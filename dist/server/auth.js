"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isAuthenticated = void 0;
exports.getSession = getSession;
exports.generateToken = generateToken;
exports.verifyToken = verifyToken;
exports.hashPassword = hashPassword;
exports.verifyPassword = verifyPassword;
exports.generateSecureToken = generateSecureToken;
exports.sendPasswordResetEmail = sendPasswordResetEmail;
exports.sendVerificationEmail = sendVerificationEmail;
exports.setupAuth = setupAuth;
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const crypto_1 = __importDefault(require("crypto"));
const nodemailer_1 = __importDefault(require("nodemailer"));
const express_session_1 = __importDefault(require("express-session"));
const connect_pg_simple_1 = __importDefault(require("connect-pg-simple"));
const storage_1 = require("./storage");
if (!process.env.JWT_SECRET) {
    console.error('CRITICAL: JWT_SECRET environment variable must be set for production use!');
    console.error('Generate a secure secret with: openssl rand -base64 64');
    if (process.env.NODE_ENV === 'production') {
        throw new Error('JWT_SECRET is required in production');
    }
}
const JWT_SECRET = process.env.JWT_SECRET || crypto_1.default.randomBytes(32).toString('hex');
const BCRYPT_ROUNDS = 12;
// Email transporter (configure with your SMTP details)
const emailTransporter = nodemailer_1.default.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});
// Session configuration for scalability
function getSession() {
    const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
    const pgStore = (0, connect_pg_simple_1.default)(express_session_1.default);
    const sessionStore = new pgStore({
        conString: process.env.DATABASE_URL,
        createTableIfMissing: false,
        ttl: sessionTtl,
        tableName: 'sessions',
    });
    return (0, express_session_1.default)({
        secret: process.env.SESSION_SECRET,
        store: sessionStore,
        resave: false,
        saveUninitialized: false,
        cookie: {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
            maxAge: sessionTtl,
        },
    });
}
// Generate JWT token
function generateToken(user) {
    return jsonwebtoken_1.default.sign({
        sub: user.id,
        email: user.email,
        role: user.role,
        isCreator: user.isCreator,
    }, JWT_SECRET, { expiresIn: '7d' });
}
// Verify JWT token
function verifyToken(token) {
    try {
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        return {
            id: decoded.sub,
            email: decoded.email,
            role: decoded.role,
            isCreator: decoded.isCreator,
        };
    }
    catch (error) {
        return null;
    }
}
// Hash password
async function hashPassword(password) {
    return bcrypt_1.default.hash(password, BCRYPT_ROUNDS);
}
// Verify password
async function verifyPassword(password, hash) {
    return bcrypt_1.default.compare(password, hash);
}
// Generate secure random token
function generateSecureToken() {
    return crypto_1.default.randomBytes(32).toString('hex');
}
// Send password reset email
async function sendPasswordResetEmail(email, token) {
    const resetUrl = `${process.env.APP_URL || 'http://localhost:5000'}/reset-password?token=${token}`;
    await emailTransporter.sendMail({
        from: process.env.SMTP_FROM || 'noreply@girlfanz.com',
        to: email,
        subject: 'Reset Your GirlFanz Password',
        html: `
      <h2>Reset Your Password</h2>
      <p>Click the link below to reset your password. This link will expire in 1 hour.</p>
      <a href="${resetUrl}">${resetUrl}</a>
      <p>If you didn't request this, please ignore this email.</p>
    `,
    });
}
// Send email verification
async function sendVerificationEmail(email, token) {
    const verifyUrl = `${process.env.APP_URL || 'http://localhost:5000'}/verify-email?token=${token}`;
    await emailTransporter.sendMail({
        from: process.env.SMTP_FROM || 'noreply@girlfanz.com',
        to: email,
        subject: 'Verify Your GirlFanz Email',
        html: `
      <h2>Welcome to GirlFanz!</h2>
      <p>Please verify your email address by clicking the link below:</p>
      <a href="${verifyUrl}">${verifyUrl}</a>
    `,
    });
}
// Authentication middleware
const isAuthenticated = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        const token = (authHeader === null || authHeader === void 0 ? void 0 : authHeader.startsWith('Bearer ')) ? authHeader.substring(7) : null;
        if (!token) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        const user = verifyToken(token);
        if (!user) {
            return res.status(401).json({ message: 'Invalid token' });
        }
        // Attach user to request
        req.user = { claims: user };
        next();
    }
    catch (error) {
        res.status(401).json({ message: 'Unauthorized' });
    }
};
exports.isAuthenticated = isAuthenticated;
// Setup auth routes
async function setupAuth(app) {
    app.set('trust proxy', 1);
    app.use(getSession());
    // Register
    app.post('/api/auth/register', async (req, res) => {
        try {
            const { email, password, firstName, lastName, isCreator, securityQuestion, securityAnswer } = req.body;
            // Validate input
            if (!email || !password) {
                return res.status(400).json({ message: 'Email and password are required' });
            }
            if (password.length < 8) {
                return res.status(400).json({ message: 'Password must be at least 8 characters' });
            }
            // Check if user exists
            const existingUser = await storage_1.storage.getUserByEmail(email);
            if (existingUser) {
                return res.status(400).json({ message: 'Email already registered' });
            }
            // Hash password and security answer
            const hashedPassword = await hashPassword(password);
            const hashedSecurityAnswer = securityAnswer ? await hashPassword(securityAnswer.toLowerCase().trim()) : null;
            // Create user
            const user = await storage_1.storage.createUser({
                email,
                password: hashedPassword,
                firstName,
                lastName,
                isCreator: isCreator || false,
                authProvider: 'local',
                securityQuestion,
                securityAnswer: hashedSecurityAnswer || undefined,
            });
            // Generate verification token
            const verificationToken = generateSecureToken();
            const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
            await storage_1.storage.createEmailVerificationToken({
                userId: user.id,
                token: verificationToken,
                expiresAt,
            });
            // Send verification email (non-blocking)
            sendVerificationEmail(email, verificationToken).catch(err => console.error('Failed to send verification email:', err));
            // Generate JWT
            const token = generateToken({
                id: user.id,
                email: user.email,
                role: user.role,
                isCreator: user.isCreator,
            });
            res.json({
                token,
                user: {
                    id: user.id,
                    email: user.email,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    isCreator: user.isCreator,
                    emailVerified: user.emailVerified,
                },
            });
        }
        catch (error) {
            console.error('Registration error:', error);
            res.status(500).json({ message: 'Registration failed' });
        }
    });
    // Login
    app.post('/api/auth/login', async (req, res) => {
        try {
            const { email, password } = req.body;
            if (!email || !password) {
                return res.status(400).json({ message: 'Email and password are required' });
            }
            // Get user
            const user = await storage_1.storage.getUserByEmail(email);
            if (!user || !user.password) {
                return res.status(401).json({ message: 'Invalid email or password' });
            }
            // Verify password
            const isValid = await verifyPassword(password, user.password);
            if (!isValid) {
                return res.status(401).json({ message: 'Invalid email or password' });
            }
            // Check if account is suspended/banned
            if (user.status !== 'active') {
                return res.status(403).json({ message: 'Account is suspended or banned' });
            }
            // Generate JWT
            const token = generateToken({
                id: user.id,
                email: user.email,
                role: user.role,
                isCreator: user.isCreator,
            });
            res.json({
                token,
                user: {
                    id: user.id,
                    email: user.email,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    isCreator: user.isCreator,
                    emailVerified: user.emailVerified,
                },
            });
        }
        catch (error) {
            console.error('Login error:', error);
            res.status(500).json({ message: 'Login failed' });
        }
    });
    // Get current user
    app.get('/api/auth/user', exports.isAuthenticated, async (req, res) => {
        try {
            const userId = req.user.claims.sub;
            const user = await storage_1.storage.getUser(userId);
            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }
            res.json({
                id: user.id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                isCreator: user.isCreator,
                emailVerified: user.emailVerified,
                role: user.role,
            });
        }
        catch (error) {
            res.status(500).json({ message: 'Failed to get user' });
        }
    });
    // Forgot password
    app.post('/api/auth/forgot-password', async (req, res) => {
        try {
            const { email } = req.body;
            if (!email) {
                return res.status(400).json({ message: 'Email is required' });
            }
            const user = await storage_1.storage.getUserByEmail(email);
            // Always return success to prevent email enumeration
            res.json({ message: 'If an account exists, a password reset link has been sent' });
            if (!user) {
                return;
            }
            // Generate reset token
            const resetToken = generateSecureToken();
            const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
            await storage_1.storage.createPasswordResetToken({
                userId: user.id,
                token: resetToken,
                expiresAt,
            });
            // Send reset email (non-blocking)
            sendPasswordResetEmail(email, resetToken).catch(err => console.error('Failed to send reset email:', err));
        }
        catch (error) {
            console.error('Forgot password error:', error);
            res.status(500).json({ message: 'Failed to process request' });
        }
    });
    // Reset password
    app.post('/api/auth/reset-password', async (req, res) => {
        try {
            const { token, newPassword } = req.body;
            if (!token || !newPassword) {
                return res.status(400).json({ message: 'Token and new password are required' });
            }
            if (newPassword.length < 8) {
                return res.status(400).json({ message: 'Password must be at least 8 characters' });
            }
            // Get token
            const resetToken = await storage_1.storage.getPasswordResetToken(token);
            if (!resetToken || resetToken.used) {
                return res.status(400).json({ message: 'Invalid or expired token' });
            }
            // Check expiration
            if (new Date() > new Date(resetToken.expiresAt)) {
                return res.status(400).json({ message: 'Token has expired' });
            }
            // Hash new password
            const hashedPassword = await hashPassword(newPassword);
            // Update user password
            await storage_1.storage.updateUser(resetToken.userId, {
                password: hashedPassword,
            });
            // Mark token as used
            await storage_1.storage.markPasswordResetTokenUsed(token);
            res.json({ message: 'Password reset successful' });
        }
        catch (error) {
            console.error('Reset password error:', error);
            res.status(500).json({ message: 'Failed to reset password' });
        }
    });
    // Recover email with security question
    app.post('/api/auth/recover-email', async (req, res) => {
        try {
            const { securityQuestion, securityAnswer } = req.body;
            if (!securityQuestion || !securityAnswer) {
                return res.status(400).json({ message: 'Security question and answer are required' });
            }
            // Find user by security question
            const users = await storage_1.storage.getUsersBySecurityQuestion(securityQuestion);
            // Try to match security answer
            for (const user of users) {
                if (user.securityAnswer) {
                    const isValid = await verifyPassword(securityAnswer.toLowerCase().trim(), user.securityAnswer);
                    if (isValid) {
                        // Return partial email for privacy
                        const email = user.email;
                        const [localPart, domain] = email.split('@');
                        const maskedEmail = `${localPart.substring(0, 2)}${'*'.repeat(localPart.length - 2)}@${domain}`;
                        return res.json({
                            success: true,
                            email: maskedEmail,
                            hint: `Your email is: ${maskedEmail}`,
                        });
                    }
                }
            }
            res.status(401).json({ message: 'Security answer does not match' });
        }
        catch (error) {
            console.error('Recover email error:', error);
            res.status(500).json({ message: 'Failed to recover email' });
        }
    });
    // Verify email
    app.post('/api/auth/verify-email', async (req, res) => {
        try {
            const { token } = req.body;
            if (!token) {
                return res.status(400).json({ message: 'Token is required' });
            }
            const verificationToken = await storage_1.storage.getEmailVerificationToken(token);
            if (!verificationToken || verificationToken.used) {
                return res.status(400).json({ message: 'Invalid or expired token' });
            }
            if (new Date() > new Date(verificationToken.expiresAt)) {
                return res.status(400).json({ message: 'Token has expired' });
            }
            // Update user
            await storage_1.storage.updateUser(verificationToken.userId, {
                emailVerified: true,
            });
            // Mark token as used
            await storage_1.storage.markEmailVerificationTokenUsed(token);
            res.json({ message: 'Email verified successfully' });
        }
        catch (error) {
            console.error('Verify email error:', error);
            res.status(500).json({ message: 'Failed to verify email' });
        }
    });
    // Logout (optional - mainly for session cleanup)
    app.post('/api/auth/logout', (req, res) => {
        var _a;
        (_a = req.session) === null || _a === void 0 ? void 0 : _a.destroy((err) => {
            if (err) {
                return res.status(500).json({ message: 'Logout failed' });
            }
            res.json({ message: 'Logged out successfully' });
        });
    });
}
