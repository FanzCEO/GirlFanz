"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = void 0;
const express_1 = require("express");
const oauth = __importStar(require("openid-client"));
const passport_1 = __importDefault(require("passport"));
const passport_custom_1 = require("passport-custom");
const express_session_1 = __importDefault(require("express-session"));
const db_1 = require("./db");
const memoizee_1 = __importDefault(require("memoizee"));
const connect_pg_simple_1 = __importDefault(require("connect-pg-simple"));
const pg_1 = require("pg");
const PgSession = (0, connect_pg_simple_1.default)(express_session_1.default);
const pool = new pg_1.Pool({
    connectionString: process.env.DATABASE_URL,
});
const getClient = (0, memoizee_1.default)(async () => {
    const issuer = new URL(process.env.REPLIT_DEPLOYMENT === "1"
        ? "https://replit.com"
        : `https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co`);
    const config = await oauth.discovery(issuer, process.env.REPLIT_DEPLOYMENT === "1"
        ? process.env.REPL_ID
        : "local-testing", undefined, undefined, { execute: [oauth.allowInsecureRequests] });
    return config;
}, { promise: true, maxAge: 60000 });
passport_1.default.use("replit", new passport_custom_1.Strategy(async (req, done) => {
    try {
        const client = await getClient();
        const currentUrl = new URL(req.url, `https://${req.get("host")}`);
        const tokens = await oauth.authorizationCodeGrant(client, currentUrl, {
            expectedState: req.session.state,
            pkceCodeVerifier: req.session.codeVerifier,
        });
        const claims = oauth.getValidatedIdTokenClaims(tokens);
        const user = await db_1.db.user.upsert({
            where: { id: claims.sub },
            update: {},
            create: {
                id: claims.sub,
                email: claims.email,
                firstName: claims.given_name || null,
                lastName: claims.family_name || null,
                profileImageUrl: claims.profile_image || null,
                password: "", // Replit auth doesn't use passwords
            },
        });
        done(null, user);
    }
    catch (err) {
        done(err);
    }
}));
passport_1.default.serializeUser((user, done) => {
    done(null, user.id);
});
passport_1.default.deserializeUser(async (id, done) => {
    try {
        const user = await db_1.db.user.findUnique({ where: { id } });
        done(null, user);
    }
    catch (err) {
        done(err);
    }
});
const router = (0, express_1.Router)();
router.use((0, express_session_1.default)({
    store: new PgSession({ pool }),
    secret: process.env.SESSION_SECRET || "your-secret-key",
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === "production",
        httpOnly: true,
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    },
}));
router.use(passport_1.default.initialize());
router.use(passport_1.default.session());
router.get("/login", async (req, res) => {
    const client = await getClient();
    const state = oauth.generateRandomState();
    const codeVerifier = oauth.generateRandomCodeVerifier();
    req.session.state = state;
    req.session.codeVerifier = codeVerifier;
    const authUrl = oauth.buildAuthorizationUrl(client, {
        state,
        code_challenge: await oauth.calculatePKCECodeChallenge(codeVerifier),
        code_challenge_method: "S256",
    });
    res.redirect(authUrl.href);
});
router.get("/callback", passport_1.default.authenticate("replit"), (req, res) => {
    res.redirect("/");
});
router.get("/logout", (req, res) => {
    req.logout((err) => {
        if (err) {
            return res.status(500).json({ error: "Logout failed" });
        }
        res.redirect("/");
    });
});
router.get("/user", (req, res) => {
    if (req.isAuthenticated()) {
        res.json(req.user);
    }
    else {
        res.status(401).json({ error: "Not authenticated" });
    }
});
const authMiddleware = (req, res, next) => {
    if (req.isAuthenticated()) {
        return next();
    }
    res.status(401).json({ error: "Authentication required" });
};
exports.authMiddleware = authMiddleware;
exports.default = router;
