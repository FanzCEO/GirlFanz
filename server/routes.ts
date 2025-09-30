import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import {
  ObjectStorageService,
  ObjectNotFoundError,
} from "./objectStorage";
import { ObjectPermission } from "./objectAcl";
import { 
  insertMediaAssetSchema, 
  insertMessageSchema, 
  insertProfileSchema,
  insertSupportTicketSchema,
  insertSupportMessageSchema,
  insertKnowledgeArticleSchema,
  insertTutorialSchema,
  insertFeedPostSchema,
  insertPostMediaSchema
} from "@shared/schema";
import { z } from "zod";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import { createCCBillService } from "./payments/ccbill";
import { verifymyService } from "./compliance/verifymy";
import { contentFingerprintingService } from "./services/fingerprinting";
import { creatorPayoutService } from "./services/payouts";

// Rate limiting
const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: process.env.NODE_ENV === "production" ? 1000 : 10000, // requests per minute
  message: "Too many requests from this IP",
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Security middleware
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "https:", "blob:"],
        scriptSrc: process.env.NODE_ENV === "development" 
          ? ["'self'", "'unsafe-inline'", "'unsafe-eval'"] 
          : ["'self'"],
        connectSrc: ["'self'", "wss:", "ws:"],
      },
    },
  }));
  
  app.use(limiter);

  // Auth middleware
  await setupAuth(app);

  // Health check endpoints
  app.get('/api/health', async (req, res) => {
    try {
      const health = await storage.getSystemHealth();
      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        ...health,
      });
    } catch (error) {
      res.status(500).json({ message: "Health check failed" });
    }
  });

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Get profile if exists
      const profile = await storage.getProfile(userId);
      
      res.json({
        ...user,
        profile,
      });
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // User profile routes
  app.get('/api/profile', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const profile = await storage.getProfileWithUser(userId);
      
      if (!profile) {
        return res.status(404).json({ message: "Profile not found" });
      }
      
      res.json(profile);
    } catch (error) {
      console.error("Error fetching profile:", error);
      res.status(500).json({ message: "Failed to fetch profile" });
    }
  });

  app.post('/api/profile', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const profileData = insertProfileSchema.parse({ ...req.body, userId });
      
      const existingProfile = await storage.getProfile(userId);
      let profile;
      
      if (existingProfile) {
        profile = await storage.updateProfile(userId, profileData);
      } else {
        profile = await storage.createProfile(profileData);
      }
      
      res.json(profile);
    } catch (error) {
      console.error("Error creating/updating profile:", error);
      res.status(500).json({ message: "Failed to save profile" });
    }
  });

  app.get('/api/stats', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const stats = await storage.getUserStats(userId);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching stats:", error);
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  // Media/Content routes
  app.get('/api/media', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const limit = parseInt(req.query.limit as string) || 20;
      const media = await storage.getMediaAssetsByOwner(userId, limit);
      res.json(media);
    } catch (error) {
      console.error("Error fetching media:", error);
      res.status(500).json({ message: "Failed to fetch media" });
    }
  });

  app.post('/api/media', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const mediaData = insertMediaAssetSchema.parse({ ...req.body, ownerId: userId });
      
      const media = await storage.createMediaAsset(mediaData);
      
      // Add to moderation queue if not admin
      await storage.createModerationItem({
        mediaId: media.id,
        status: 'pending',
        priority: 1,
        aiConfidence: Math.floor(Math.random() * 40) + 60, // Simulate AI confidence
      });
      
      // Audit log
      await storage.createAuditLog({
        actorId: userId,
        action: 'media_upload',
        targetType: 'media',
        targetId: media.id,
        metadata: { filename: media.filename, mimeType: media.mimeType },
      });
      
      res.json(media);
    } catch (error) {
      console.error("Error creating media:", error);
      res.status(500).json({ message: "Failed to create media" });
    }
  });

  // Object storage routes for file handling
  app.get("/objects/:objectPath(*)", isAuthenticated, async (req: any, res) => {
    const userId = req.user?.claims?.sub;
    const objectStorageService = new ObjectStorageService();
    try {
      const objectFile = await objectStorageService.getObjectEntityFile(req.path);
      const canAccess = await objectStorageService.canAccessObjectEntity({
        objectFile,
        userId: userId,
        requestedPermission: ObjectPermission.READ,
      });
      if (!canAccess) {
        return res.sendStatus(401);
      }
      objectStorageService.downloadObject(objectFile, res);
    } catch (error) {
      console.error("Error checking object access:", error);
      if (error instanceof ObjectNotFoundError) {
        return res.sendStatus(404);
      }
      return res.sendStatus(500);
    }
  });

  app.post("/api/objects/upload", isAuthenticated, async (req, res) => {
    const objectStorageService = new ObjectStorageService();
    try {
      const uploadURL = await objectStorageService.getObjectEntityUploadURL();
      res.json({ uploadURL });
    } catch (error) {
      console.error("Error getting upload URL:", error);
      res.status(500).json({ error: "Failed to get upload URL" });
    }
  });

  app.put("/api/media/upload", isAuthenticated, async (req: any, res) => {
    if (!req.body.mediaUrl) {
      return res.status(400).json({ error: "mediaUrl is required" });
    }

    const userId = req.user?.claims?.sub;

    try {
      const objectStorageService = new ObjectStorageService();
      const objectPath = await objectStorageService.trySetObjectEntityAclPolicy(
        req.body.mediaUrl,
        {
          owner: userId,
          visibility: req.body.isPublic ? "public" : "private",
        },
      );

      res.status(200).json({ objectPath });
    } catch (error) {
      console.error("Error setting media ACL:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Messaging routes
  app.get('/api/conversations', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const conversations = await storage.getConversations(userId);
      res.json(conversations);
    } catch (error) {
      console.error("Error fetching conversations:", error);
      res.status(500).json({ message: "Failed to fetch conversations" });
    }
  });

  app.get('/api/messages/:otherUserId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { otherUserId } = req.params;
      const limit = parseInt(req.query.limit as string) || 50;
      
      const messages = await storage.getMessages(userId, otherUserId, limit);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  app.post('/api/messages', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const messageData = insertMessageSchema.parse({ ...req.body, senderId: userId });
      
      const message = await storage.createMessage(messageData);
      
      // Broadcast to WebSocket if receiver is online
      broadcastToUser(messageData.receiverId, {
        type: 'new_message',
        data: message,
      });
      
      res.json(message);
    } catch (error) {
      console.error("Error sending message:", error);
      res.status(500).json({ message: "Failed to send message" });
    }
  });

  // Moderation routes
  app.get('/api/moderation/queue', isAuthenticated, async (req: any, res) => {
    try {
      const status = req.query.status as string;
      const limit = parseInt(req.query.limit as string) || 50;
      
      const queue = await storage.getModerationQueue(status, limit);
      res.json(queue);
    } catch (error) {
      console.error("Error fetching moderation queue:", error);
      res.status(500).json({ message: "Failed to fetch moderation queue" });
    }
  });

  app.patch('/api/moderation/:itemId', isAuthenticated, async (req: any, res) => {
    try {
      const { itemId } = req.params;
      const userId = req.user.claims.sub;
      const { status, notes } = req.body;
      
      const item = await storage.updateModerationItem(itemId, {
        status,
        notes,
        reviewerId: userId,
      });
      
      // Update media status based on moderation decision
      if (item && item.mediaId) {
        await storage.updateMediaAsset(item.mediaId, {
          status: status === 'approved' ? 'approved' : 'rejected',
        });
      }
      
      // Audit log
      await storage.createAuditLog({
        actorId: userId,
        action: 'moderation_review',
        targetType: 'moderation',
        targetId: itemId,
        metadata: { status, notes },
      });
      
      res.json(item);
    } catch (error) {
      console.error("Error updating moderation item:", error);
      res.status(500).json({ message: "Failed to update moderation item" });
    }
  });

  // Create HTTP server
  const httpServer = createServer(app);

  // WebSocket server for real-time features
  const wss = new WebSocketServer({ 
    server: httpServer, 
    path: '/ws',
    verifyClient: (info) => {
      // Parse token from query string if present
      const url = new URL(info.req.url!, `http://${info.req.headers.host}`);
      const token = url.searchParams.get('token');
      
      console.log('WebSocket verification - token present:', !!token);
      
      // For now, accept all connections and handle auth later
      // In production, you would validate the token here
      return true;
    }
  });
  
  // Store active connections
  const connections = new Map<string, WebSocket>();

  wss.on('connection', (ws, req) => {
    let userId: string | null = null;
    console.log('WebSocket connection attempt from:', req.socket.remoteAddress);

    // Try to extract token from query parameters
    const url = new URL(req.url!, `http://${req.headers.host}`);
    const token = url.searchParams.get('token');
    
    if (token) {
      console.log('WebSocket connection with token:', token.substring(0, 10) + '...');
      // For demo purposes, we'll use the token as a user identifier
      // In production, you would validate the JWT token here
      userId = token;
      connections.set(userId, ws);
      
      // Send immediate auth success
      ws.send(JSON.stringify({
        type: 'auth_success',
        userId: userId
      }));
      console.log('WebSocket authenticated via token');
    }

    ws.on('message', async (data) => {
      try {
        const message = JSON.parse(data.toString());
        console.log('WebSocket message received:', message.type, userId ? `from user ${userId}` : '(unauthenticated)');
        
        if (message.type === 'auth') {
          userId = message.userId;
          connections.set(userId, ws);
          console.log(`User ${userId} successfully authenticated via WebSocket`);
          
          // Send confirmation back to client
          ws.send(JSON.stringify({
            type: 'auth_success',
            userId: userId
          }));
        }
        
        if (message.type === 'ping') {
          ws.send(JSON.stringify({ type: 'pong' }));
        }
        
        // Handle real-time messaging
        if (message.type === 'chat_message' && userId) {
          const messageData = {
            senderId: userId,
            receiverId: message.receiverId,
            content: message.content,
          };
          
          const newMessage = await storage.createMessage(messageData);
          
          // Send to receiver if online
          const receiverWs = connections.get(message.receiverId);
          if (receiverWs && receiverWs.readyState === WebSocket.OPEN) {
            receiverWs.send(JSON.stringify({
              type: 'new_message',
              data: newMessage,
            }));
          }
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    });

    ws.on('close', () => {
      if (userId) {
        connections.delete(userId);
        console.log(`User ${userId} disconnected from WebSocket`);
      }
    });
  });

  // Helper function to broadcast to specific user
  function broadcastToUser(userId: string, message: any) {
    const ws = connections.get(userId);
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }

  // Payment routes
  const ccbillService = createCCBillService();

  // Generic CCBill checkout URL endpoint
  app.get('/api/ccbill/checkout-url', isAuthenticated, (req: any, res) => {
    try {
      const { amount, type = 'purchase' } = req.query;
      const userId = req.user.claims.sub;

      if (!amount) {
        return res.status(400).json({ error: 'Amount is required' });
      }

      const checkoutUrl = ccbillService.generatePurchaseCheckoutUrl({
        userId,
        amount: parseInt(amount as string),
        type: type as string,
        creatorId: 'demo-creator', // For testing purposes
      });

      res.json({
        url: checkoutUrl.url,
        digest: checkoutUrl.digest,
        amount: parseInt(amount as string),
        type
      });
    } catch (error) {
      console.error('Error generating CCBill checkout URL:', error);
      res.status(500).json({ error: 'Failed to generate checkout URL' });
    }
  });

  // Create subscription checkout
  app.post('/api/payments/subscription/checkout', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { creatorId, pricePerMonth, planName, description, billingCycle } = req.body;

      if (!creatorId || !pricePerMonth) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const checkoutUrl = ccbillService.generateSubscriptionCheckoutUrl({
        userId,
        creatorId,
        pricePerMonth,
        currency: 'USD',
        planName: planName || 'Monthly Subscription',
        description: description || 'Creator subscription',
        billingCycle: billingCycle || 'monthly',
      });

      // Log checkout creation
      await storage.createAuditLog({
        actorId: userId,
        action: 'checkout_created',
        targetType: 'subscription',
        targetId: creatorId,
        metadata: { pricePerMonth, provider: 'ccbill' },
      });

      res.json({ checkoutUrl });
    } catch (error) {
      console.error('Error creating subscription checkout:', error);
      res.status(500).json({ error: 'Failed to create checkout' });
    }
  });

  // Create one-time purchase checkout
  app.post('/api/payments/purchase/checkout', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { creatorId, mediaId, amount, description, type } = req.body;

      if (!amount || amount <= 0) {
        return res.status(400).json({ error: 'Invalid amount' });
      }

      const checkoutUrl = ccbillService.generatePurchaseCheckoutUrl({
        userId,
        creatorId,
        mediaId,
        amount,
        currency: 'USD',
        description: description || 'Content purchase',
        type: type || 'purchase',
      });

      // Log checkout creation
      await storage.createAuditLog({
        actorId: userId,
        action: 'checkout_created',
        targetType: 'purchase',
        targetId: mediaId || creatorId,
        metadata: { amount, provider: 'ccbill', type },
      });

      res.json({ checkoutUrl });
    } catch (error) {
      console.error('Error creating purchase checkout:', error);
      res.status(500).json({ error: 'Failed to create checkout' });
    }
  });

  // CCBill webhook endpoint - handles form-encoded data
  app.post('/api/webhooks/ccbill', async (req, res) => {
    try {
      // CCBill sends form-encoded data, not JSON
      const formData = req.body;

      // Verify webhook data using CCBill's MD5 verification
      if (!ccbillService.verifyWebhookData(formData)) {
        console.error('Invalid CCBill webhook verification');
        return res.status(401).json({ error: 'Invalid verification' });
      }

      // Process webhook
      await ccbillService.processWebhookNotification(formData);
      
      res.status(200).json({ status: 'success' });
    } catch (error) {
      console.error('Error processing CCBill webhook:', error);
      res.status(500).json({ error: 'Webhook processing failed' });
    }
  });

  // Get user subscriptions
  app.get('/api/subscriptions', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const subscriptions = await storage.getSubscriptionsAsFan(userId);
      res.json(subscriptions);
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
      res.status(500).json({ error: 'Failed to fetch subscriptions' });
    }
  });

  // Get creator subscriptions 
  app.get('/api/subscriptions/creator', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const subscriptions = await storage.getSubscriptionsAsCreator(userId);
      res.json(subscriptions);
    } catch (error) {
      console.error('Error fetching creator subscriptions:', error);
      res.status(500).json({ error: 'Failed to fetch subscriptions' });
    }
  });

  // Get user transactions
  app.get('/api/transactions', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const transactions = await storage.getTransactionsAsBuyer(userId);
      res.json(transactions);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      res.status(500).json({ error: 'Failed to fetch transactions' });
    }
  });

  // Get creator transactions
  app.get('/api/transactions/creator', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const transactions = await storage.getTransactionsAsCreator(userId);
      res.json(transactions);
    } catch (error) {
      console.error('Error fetching creator transactions:', error);
      res.status(500).json({ error: 'Failed to fetch transactions' });
    }
  });

  // Age verification endpoints (verifymy integration)
  app.post('/api/verification/age', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const verificationRequest = {
        userId,
        firstName: user.firstName || req.body.firstName,
        lastName: user.lastName || req.body.lastName,
        dateOfBirth: req.body.dateOfBirth,
        ssn4: req.body.ssn4,
        phone: req.body.phone,
        email: user.email!,
        address: req.body.address
      };

      const result = await verifymyService.verifyAge(verificationRequest);
      
      res.json({
        transactionId: result.transactionId,
        status: result.status,
        confidence: result.confidence
      });
    } catch (error) {
      console.error('Error processing age verification:', error);
      res.status(500).json({ error: 'Age verification failed' });
    }
  });

  // Identity verification endpoints 
  app.post('/api/verification/identity', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      const verificationRequest = {
        userId,
        documentType: req.body.documentType,
        frontImageUrl: req.body.frontImageUrl,
        backImageUrl: req.body.backImageUrl,
        selfieImageUrl: req.body.selfieImageUrl,
        documentNumber: req.body.documentNumber
      };

      const result = await verifymyService.verifyIdentity(verificationRequest);
      
      res.json({
        transactionId: result.transactionId,
        status: result.status,
        confidence: result.confidence
      });
    } catch (error) {
      console.error('Error processing identity verification:', error);
      res.status(500).json({ error: 'Identity verification failed' });
    }
  });

  // Get KYC status
  app.get('/api/verification/status', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const verification = await storage.getKycVerification(userId);
      let profile = await storage.getProfile(userId);
      
      // Create profile if it doesn't exist
      if (!profile) {
        profile = await storage.createProfile({
          userId,
          ageVerified: false,
          kycStatus: 'pending'
        });
      }

      // Get the most recent age and identity verifications
      const ageVerification = await storage.getKycVerificationByType(userId, 'age_verification');
      const identityVerification = await storage.getKycVerificationByType(userId, 'identity_verification');
      
      res.json({
        ageVerified: profile.ageVerified,
        kycStatus: profile.kycStatus,
        lastVerification: verification,
        ageVerification: ageVerification ? {
          status: ageVerification.status,
          confidence: ageVerification.dataJson?.confidence,
          verifiedAt: ageVerification.verifiedAt,
          createdAt: ageVerification.createdAt
        } : null,
        identityVerification: identityVerification ? {
          status: identityVerification.status,
          confidence: identityVerification.dataJson?.confidence,
          verifiedAt: identityVerification.verifiedAt,
          createdAt: identityVerification.createdAt
        } : null
      });
    } catch (error) {
      console.error('Error fetching verification status:', error);
      res.status(500).json({ error: 'Failed to fetch verification status' });
    }
  });

  // Content moderation endpoint (for verifymy AI moderation)
  app.post('/api/moderation/ai', isAuthenticated, async (req: any, res) => {
    try {
      const { mediaId, contentUrl, contentType } = req.body;
      const userId = req.user.claims.sub;
      
      const result = await verifymyService.moderateContent(
        contentUrl,
        contentType,
        { userId, mediaId }
      );
      
      res.json(result);
    } catch (error) {
      console.error('Error processing AI moderation:', error);
      res.status(500).json({ error: 'AI moderation failed' });
    }
  });

  // Verifymy webhook endpoint
  app.post('/api/webhooks/verifymy', async (req, res) => {
    try {
      const signature = req.headers['x-verifymy-signature'] as string;
      const body = JSON.stringify(req.body);

      // Verify webhook signature
      if (!verifymyService.verifyWebhookSignature(body, signature)) {
        console.error('Invalid verifymy webhook signature');
        return res.status(401).json({ error: 'Invalid signature' });
      }

      // Process webhook
      await verifymyService.processWebhookNotification(req.body);
      
      res.status(200).json({ status: 'success' });
    } catch (error) {
      console.error('Error processing verifymy webhook:', error);
      res.status(500).json({ error: 'Webhook processing failed' });
    }
  });

  // Creator Payout Endpoints
  app.get('/api/payouts/earnings', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const months = parseInt(req.query.months as string) || 12;
      
      const summary = await creatorPayoutService.getCreatorEarningsSummary(userId, months);
      res.json(summary);
    } catch (error) {
      console.error('Error fetching creator earnings:', error);
      res.status(500).json({ error: 'Failed to fetch earnings' });
    }
  });

  app.get('/api/payouts/calculate', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { startDate, endDate } = req.query;
      
      if (!startDate || !endDate) {
        return res.status(400).json({ error: 'Start date and end date are required' });
      }

      const calculation = await creatorPayoutService.calculateCreatorEarnings(
        userId,
        new Date(startDate as string),
        new Date(endDate as string)
      );
      
      res.json(calculation);
    } catch (error) {
      console.error('Error calculating earnings:', error);
      res.status(500).json({ error: 'Failed to calculate earnings' });
    }
  });

  app.post('/api/payouts/request', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { amount, payoutAccountId } = req.body;
      
      if (!amount || !payoutAccountId) {
        return res.status(400).json({ error: 'Amount and payout account are required' });
      }

      // For now, return success - full implementation would create payout request
      res.json({
        success: true,
        message: 'Payout request submitted',
        payoutId: `payout_${Date.now()}`,
        amount,
        status: 'pending'
      });
    } catch (error) {
      console.error('Error requesting payout:', error);
      res.status(500).json({ error: 'Failed to request payout' });
    }
  });

  // Admin endpoint for processing scheduled payouts
  app.post('/api/admin/payouts/process', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      // Check if user is admin
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
      }

      const results = await creatorPayoutService.processScheduledPayouts();
      
      res.json({
        success: true,
        results
      });
    } catch (error) {
      console.error('Error processing payouts:', error);
      res.status(500).json({ error: 'Failed to process payouts' });
    }
  });

  // Content fingerprinting endpoints
  app.post('/api/media/:id/fingerprint', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const mediaId = req.params.id;
      
      // Verify user owns the media or is admin
      const media = await storage.getMediaAsset(mediaId);
      if (!media || (media.ownerId !== userId)) {
        return res.status(403).json({ error: 'Access denied' });
      }

      // Find similar content
      const matches = await contentFingerprintingService.findSimilarContent(mediaId, 0.8);
      
      res.json({
        mediaId,
        matches,
        forensicSignature: media.forensicSignature
      });
    } catch (error) {
      console.error('Error checking content fingerprint:', error);
      res.status(500).json({ error: 'Failed to check fingerprint' });
    }
  });

  app.get('/api/admin/audit-logs', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      // Check if user is admin
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
      }

      const limit = Math.min(parseInt(req.query.limit as string) || 100, 1000);
      const offset = parseInt(req.query.offset as string) || 0;
      const action = req.query.action as string;

      // This would query audit logs from database
      // For now return mock data
      res.json({
        logs: [],
        total: 0,
        limit,
        offset
      });
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      res.status(500).json({ error: 'Failed to fetch audit logs' });
    }
  });

  // Support Ticket Routes
  app.get('/api/support/tickets', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      let tickets;
      if (user?.role === 'admin' || user?.role === 'support') {
        // Admin/Support can see all tickets
        const status = req.query.status as string;
        tickets = await storage.getSupportTickets(undefined, status);
      } else {
        // Users can only see their own tickets
        tickets = await storage.getSupportTickets(userId);
      }
      
      res.json({ tickets });
    } catch (error) {
      console.error('Error fetching support tickets:', error);
      res.status(500).json({ error: 'Failed to fetch tickets' });
    }
  });

  app.get('/api/support/tickets/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      const ticketId = req.params.id;
      
      const ticket = await storage.getSupportTicket(ticketId);
      if (!ticket) {
        return res.status(404).json({ error: 'Ticket not found' });
      }
      
      // Check access permissions
      if (ticket.userId !== userId && user?.role !== 'admin' && user?.role !== 'support') {
        return res.status(403).json({ error: 'Access denied' });
      }
      
      const messages = await storage.getSupportMessages(ticketId);
      
      res.json({ ticket, messages });
    } catch (error) {
      console.error('Error fetching support ticket:', error);
      res.status(500).json({ error: 'Failed to fetch ticket' });
    }
  });

  app.post('/api/support/tickets', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const ticketData = insertSupportTicketSchema.parse({
        ...req.body,
        userId,
        status: 'open'
      });
      
      const ticket = await storage.createSupportTicket(ticketData);
      
      // Create initial message
      if (req.body.message) {
        await storage.createSupportMessage({
          ticketId: ticket.id,
          senderId: userId,
          body: req.body.message,
          isInternalNote: false
        });
      }
      
      res.json({ ticket });
    } catch (error) {
      console.error('Error creating support ticket:', error);
      res.status(500).json({ error: 'Failed to create ticket' });
    }
  });

  app.put('/api/support/tickets/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      const ticketId = req.params.id;
      
      const ticket = await storage.getSupportTicket(ticketId);
      if (!ticket) {
        return res.status(404).json({ error: 'Ticket not found' });
      }
      
      // Check permissions
      if (ticket.userId !== userId && user?.role !== 'admin' && user?.role !== 'support') {
        return res.status(403).json({ error: 'Access denied' });
      }
      
      // Define allowed updates based on role
      let allowedUpdates: any = {};
      
      if (user?.role === 'admin' || user?.role === 'support') {
        // Staff can update status, priority, assignment, and category
        const staffUpdateSchema = z.object({
          status: z.enum(['open', 'in_progress', 'resolved', 'closed']).optional(),
          priority: z.enum(['low', 'normal', 'high', 'critical']).optional(),
          assignedTo: z.string().optional(),
          category: z.string().optional()
        });
        allowedUpdates = staffUpdateSchema.parse(req.body);
      } else {
        // Regular users can only update subject and category
        const userUpdateSchema = z.object({
          subject: z.string().max(255).optional(),
          category: z.string().optional()
        });
        allowedUpdates = userUpdateSchema.parse(req.body);
      }
      
      const updatedTicket = await storage.updateSupportTicket(ticketId, allowedUpdates);
      res.json({ ticket: updatedTicket });
    } catch (error) {
      console.error('Error updating support ticket:', error);
      res.status(500).json({ error: 'Failed to update ticket' });
    }
  });

  app.post('/api/support/tickets/:id/messages', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      const ticketId = req.params.id;
      
      const ticket = await storage.getSupportTicket(ticketId);
      if (!ticket) {
        return res.status(404).json({ error: 'Ticket not found' });
      }
      
      // Check access permissions
      if (ticket.userId !== userId && user?.role !== 'admin' && user?.role !== 'support') {
        return res.status(403).json({ error: 'Access denied' });
      }
      
      const messageData = insertSupportMessageSchema.parse({
        ticketId,
        senderId: userId,
        body: req.body.message,
        isInternalNote: user?.role === 'admin' || user?.role === 'support'
      });
      
      const message = await storage.createSupportMessage(messageData);
      res.json({ message });
    } catch (error) {
      console.error('Error creating support message:', error);
      res.status(500).json({ error: 'Failed to send message' });
    }
  });

  // Knowledge Base Routes
  app.get('/api/wiki/articles', async (req, res) => {
    try {
      const category = req.query.category as string;
      const searchQuery = req.query.search as string;
      
      const articles = await storage.getKnowledgeArticles(category, searchQuery);
      res.json({ articles });
    } catch (error) {
      console.error('Error fetching knowledge articles:', error);
      res.status(500).json({ error: 'Failed to fetch articles' });
    }
  });

  app.get('/api/wiki/articles/:id', async (req, res) => {
    try {
      const articleId = req.params.id;
      const article = await storage.getKnowledgeArticle(articleId);
      
      if (!article) {
        return res.status(404).json({ error: 'Article not found' });
      }
      
      res.json({ article });
    } catch (error) {
      console.error('Error fetching knowledge article:', error);
      res.status(500).json({ error: 'Failed to fetch article' });
    }
  });

  app.get('/api/wiki/articles/by-slug/:slug', async (req, res) => {
    try {
      const slug = req.params.slug;
      const article = await storage.getKnowledgeArticleBySlug(slug);
      
      if (!article) {
        return res.status(404).json({ error: 'Article not found' });
      }
      
      res.json(article);
    } catch (error) {
      console.error('Error fetching knowledge article by slug:', error);
      res.status(500).json({ error: 'Failed to fetch article' });
    }
  });

  app.post('/api/wiki/articles', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      // Check if user has permission to create articles
      if (user?.role !== 'admin' && user?.role !== 'support') {
        return res.status(403).json({ error: 'Admin access required' });
      }
      
      const articleData = insertKnowledgeArticleSchema.parse({
        ...req.body,
        authorId: userId
      });
      
      const article = await storage.createKnowledgeArticle(articleData);
      res.json({ article });
    } catch (error) {
      console.error('Error creating knowledge article:', error);
      res.status(500).json({ error: 'Failed to create article' });
    }
  });

  app.put('/api/wiki/articles/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      const articleId = req.params.id;
      
      // Check if user has permission to edit articles
      if (user?.role !== 'admin' && user?.role !== 'support') {
        return res.status(403).json({ error: 'Admin access required' });
      }
      
      const updatedArticle = await storage.updateKnowledgeArticle(articleId, req.body);
      res.json({ article: updatedArticle });
    } catch (error) {
      console.error('Error updating knowledge article:', error);
      res.status(500).json({ error: 'Failed to update article' });
    }
  });

  // AI-Powered Knowledge Base Routes
  app.get('/api/wiki/search/semantic', async (req, res) => {
    try {
      const query = req.query.q as string;
      const limit = parseInt(req.query.limit as string) || 10;
      
      if (!query || query.trim().length < 2) {
        return res.status(400).json({ error: 'Query must be at least 2 characters long' });
      }
      
      const articles = await storage.searchKnowledgeSemanticSimilarity(query, limit);
      res.json({ articles, query, searchType: 'semantic' });
    } catch (error) {
      console.error('Error performing semantic search:', error);
      res.status(500).json({ error: 'Failed to perform semantic search' });
    }
  });

  app.get('/api/wiki/recommendations', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const limit = parseInt(req.query.limit as string) || 5;
      
      const recommendations = await storage.getRecommendedArticles(userId, limit);
      res.json({ articles: recommendations, type: 'personalized' });
    } catch (error) {
      console.error('Error fetching recommendations:', error);
      res.status(500).json({ error: 'Failed to fetch recommendations' });
    }
  });

  app.get('/api/wiki/popular', async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 5;
      const articles = await storage.getPopularArticles(limit);
      res.json({ articles, type: 'popular' });
    } catch (error) {
      console.error('Error fetching popular articles:', error);
      res.status(500).json({ error: 'Failed to fetch popular articles' });
    }
  });

  app.get('/api/wiki/trending', async (req, res) => {
    try {
      const timeframe = (req.query.timeframe as string) || '7d';
      const limit = parseInt(req.query.limit as string) || 5;
      
      if (!['24h', '7d', '30d'].includes(timeframe)) {
        return res.status(400).json({ error: 'Invalid timeframe. Use 24h, 7d, or 30d' });
      }
      
      const articles = await storage.getTrendingArticles(timeframe, limit);
      res.json({ articles, timeframe, type: 'trending' });
    } catch (error) {
      console.error('Error fetching trending articles:', error);
      res.status(500).json({ error: 'Failed to fetch trending articles' });
    }
  });

  app.post('/api/wiki/articles/:id/view', async (req: any, res) => {
    try {
      const articleId = req.params.id;
      const userId = req.user?.claims?.sub; // Optional for unauthenticated users
      
      await storage.recordKnowledgeView(articleId, userId);
      res.json({ message: 'View recorded successfully' });
    } catch (error) {
      console.error('Error recording article view:', error);
      res.status(500).json({ error: 'Failed to record view' });
    }
  });

  app.get('/api/wiki/articles/:id/analytics', isAuthenticated, async (req: any, res) => {
    try {
      const articleId = req.params.id;
      const user = await storage.getUser(req.user.claims.sub);
      
      // Only allow admin/support to view analytics
      if (user?.role !== 'admin' && user?.role !== 'support') {
        return res.status(403).json({ error: 'Admin access required' });
      }
      
      const analytics = await storage.getArticleAnalytics(articleId);
      res.json({ analytics });
    } catch (error) {
      console.error('Error fetching article analytics:', error);
      res.status(500).json({ error: 'Failed to fetch analytics' });
    }
  });

  app.get('/api/wiki/search/suggestions', async (req, res) => {
    try {
      const query = req.query.q as string;
      
      if (!query || query.trim().length < 2) {
        return res.json({ suggestions: [] });
      }
      
      const suggestions = await storage.getKnowledgeSearchSuggestions(query);
      res.json({ suggestions });
    } catch (error) {
      console.error('Error fetching search suggestions:', error);
      res.status(500).json({ error: 'Failed to fetch suggestions' });
    }
  });

  // Tutorial Routes
  app.get('/api/tutorials', async (req, res) => {
    try {
      const userRole = req.query.role as string;
      const category = req.query.category as string;
      
      const tutorials = await storage.getTutorials(userRole, category);
      res.json({ tutorials });
    } catch (error) {
      console.error('Error fetching tutorials:', error);
      res.status(500).json({ error: 'Failed to fetch tutorials' });
    }
  });

  app.get('/api/tutorials/:id', async (req, res) => {
    try {
      const tutorialId = req.params.id;
      const tutorial = await storage.getTutorial(tutorialId);
      
      if (!tutorial) {
        return res.status(404).json({ error: 'Tutorial not found' });
      }
      
      res.json({ tutorial });
    } catch (error) {
      console.error('Error fetching tutorial:', error);
      res.status(500).json({ error: 'Failed to fetch tutorial' });
    }
  });

  app.get('/api/tutorials/:id/progress', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const tutorialId = req.params.id;
      
      const progress = await storage.getTutorialProgress(userId, tutorialId);
      res.json({ progress });
    } catch (error) {
      console.error('Error fetching tutorial progress:', error);
      res.status(500).json({ error: 'Failed to fetch progress' });
    }
  });

  app.put('/api/tutorials/:id/progress', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const tutorialId = req.params.id;
      const { stepIndex } = req.body;
      
      const progress = await storage.updateTutorialProgress(userId, tutorialId, stepIndex);
      res.json({ progress });
    } catch (error) {
      console.error('Error updating tutorial progress:', error);
      res.status(500).json({ error: 'Failed to update progress' });
    }
  });

  app.get('/api/tutorials/:id/steps', async (req, res) => {
    try {
      const tutorialId = req.params.id;
      const steps = await storage.getTutorialSteps(tutorialId);
      res.json({ steps });
    } catch (error) {
      console.error('Error fetching tutorial steps:', error);
      res.status(500).json({ error: 'Failed to fetch tutorial steps' });
    }
  });

  app.post('/api/tutorials', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      // Check if user has permission to create tutorials
      if (user?.role !== 'admin' && user?.role !== 'support') {
        return res.status(403).json({ error: 'Admin access required' });
      }
      
      const tutorialData = insertTutorialSchema.parse({
        ...req.body,
        createdBy: userId
      });
      
      const tutorial = await storage.createTutorial(tutorialData);
      res.json({ tutorial });
    } catch (error) {
      console.error('Error creating tutorial:', error);
      res.status(500).json({ error: 'Failed to create tutorial' });
    }
  });

  // ====================================
  // FanzTrust™ API Routes
  // ====================================

  // Transaction Verification
  app.post('/api/fanztrust/verify-transaction', async (req, res) => {
    try {
      const { fanId, creatorId, gateway, txid, email, walletAddress, last4 } = req.body;
      
      // Verify transaction exists in database
      const transaction = await storage.verifyTransaction({
        fanId,
        creatorId,
        gateway,
        txid,
        email,
        walletAddress,
        last4
      });
      
      if (transaction) {
        res.json({
          status: 'verified',
          active: transaction.status === 'completed',
          transaction: {
            id: transaction.id,
            amount: transaction.amount,
            currency: transaction.currency,
            createdAt: transaction.createdAt,
            subscriptionId: transaction.subscriptionId
          }
        });
      } else {
        res.json({
          status: 'not_found',
          active: false
        });
      }
    } catch (error) {
      console.error('Error verifying transaction:', error);
      res.status(500).json({ error: 'Failed to verify transaction' });
    }
  });

  // Request Refund
  app.post('/api/fanztrust/request-refund', isAuthenticated, async (req: any, res) => {
    try {
      const fanId = req.user.claims.sub;
      const { transactionId, creatorId, reason } = req.body;
      
      // Verify transaction belongs to fan
      const transaction = await storage.getTransaction(transactionId);
      if (!transaction || transaction.fanId !== fanId) {
        return res.status(403).json({ error: 'Invalid transaction' });
      }
      
      // Check if refund already exists
      const existingRefund = await storage.getRefundByTransaction(transactionId);
      if (existingRefund) {
        return res.status(400).json({ error: 'Refund already requested' });
      }
      
      // Get creator's refund policy
      const policy = await storage.getCreatorRefundPolicy(creatorId);
      
      // Auto-approve logic
      const minutesSincePurchase = (Date.now() - new Date(transaction.createdAt!).getTime()) / (1000 * 60);
      const timeLimit = policy?.autoApproveTimeLimit || 60;
      const shouldAutoApprove = 
        policy?.autoApproveEnabled !== false &&
        minutesSincePurchase < timeLimit &&
        !transaction.contentAccessed;
      
      // Create refund request
      const refundRequest = await storage.createRefundRequest({
        transactionId,
        fanId,
        creatorId,
        reason,
        amount: transaction.amount,
        status: shouldAutoApprove ? 'auto_approved' : 'pending',
        isAutoApproved: shouldAutoApprove,
        ipAddress: req.ip,
        deviceFingerprint: req.headers['user-agent']
      });
      
      // Log audit
      await storage.createTrustAuditLog({
        action: 'request_refund',
        performedBy: fanId,
        transactionId,
        refundId: refundRequest.id,
        result: shouldAutoApprove ? 'auto_approved' : 'pending',
        ipAddress: req.ip
      });
      
      res.json({ 
        refund: refundRequest,
        autoApproved: shouldAutoApprove
      });
    } catch (error) {
      console.error('Error requesting refund:', error);
      res.status(500).json({ error: 'Failed to request refund' });
    }
  });

  // Get Refund Requests (Creator)
  app.get('/api/fanztrust/refunds/creator', isAuthenticated, async (req: any, res) => {
    try {
      const creatorId = req.user.claims.sub;
      const refunds = await storage.getCreatorRefundRequests(creatorId);
      res.json({ refunds });
    } catch (error) {
      console.error('Error fetching creator refunds:', error);
      res.status(500).json({ error: 'Failed to fetch refunds' });
    }
  });

  // Approve/Deny Refund (Creator)
  app.put('/api/fanztrust/refunds/:id', isAuthenticated, async (req: any, res) => {
    try {
      const creatorId = req.user.claims.sub;
      const refundId = req.params.id;
      const { action, reviewNotes } = req.body; // action: 'approve' | 'deny'
      
      const refund = await storage.getRefundRequest(refundId);
      if (!refund || refund.creatorId !== creatorId) {
        return res.status(403).json({ error: 'Invalid refund request' });
      }
      
      const updatedRefund = await storage.updateRefundRequest(refundId, {
        status: action === 'approve' ? 'approved' : 'denied',
        reviewedBy: creatorId,
        reviewNotes,
        reviewedAt: new Date()
      });
      
      // Log audit
      await storage.createTrustAuditLog({
        action: action === 'approve' ? 'approve_refund' : 'deny_refund',
        performedBy: creatorId,
        refundId,
        result: action,
        ipAddress: req.ip
      });
      
      res.json({ refund: updatedRefund });
    } catch (error) {
      console.error('Error updating refund:', error);
      res.status(500).json({ error: 'Failed to update refund' });
    }
  });

  // FanzWallet - Get Wallet
  app.get('/api/fanzwallet', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      let wallet = await storage.getFanzWallet(userId);
      
      // Create wallet if doesn't exist
      if (!wallet) {
        wallet = await storage.createFanzWallet({ userId });
      }
      
      res.json({ wallet });
    } catch (error) {
      console.error('Error fetching wallet:', error);
      res.status(500).json({ error: 'Failed to fetch wallet' });
    }
  });

  // FanzWallet - Get Transactions
  app.get('/api/fanzwallet/transactions', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const wallet = await storage.getFanzWallet(userId);
      
      if (!wallet) {
        return res.status(404).json({ error: 'Wallet not found' });
      }
      
      const transactions = await storage.getWalletTransactions(wallet.id);
      res.json({ transactions });
    } catch (error) {
      console.error('Error fetching wallet transactions:', error);
      res.status(500).json({ error: 'Failed to fetch transactions' });
    }
  });

  // FanzWallet - Deposit/Withdrawal
  app.post('/api/fanzwallet/transaction', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { type, amount, currency, description } = req.body;
      
      const wallet = await storage.getFanzWallet(userId);
      if (!wallet) {
        return res.status(404).json({ error: 'Wallet not found' });
      }
      
      // Create wallet transaction
      const transaction = await storage.createWalletTransaction({
        walletId: wallet.id,
        type,
        amount,
        currency: currency || 'FANZ',
        description,
        status: 'pending'
      });
      
      // Update wallet balances based on type
      if (type === 'deposit' && transaction.status === 'completed') {
        await storage.updateFanzWallet(wallet.id, {
          fanzTokenBalance: wallet.fanzTokenBalance + amount,
          totalDeposited: wallet.totalDeposited + amount
        });
      }
      
      res.json({ transaction });
    } catch (error) {
      console.error('Error processing wallet transaction:', error);
      res.status(500).json({ error: 'Failed to process transaction' });
    }
  });

  // Trust Score - Get Fan Trust Score
  app.get('/api/fanztrust/score/:fanId', async (req, res) => {
    try {
      const fanId = req.params.fanId;
      let trustScore = await storage.getFanTrustScore(fanId);
      
      // Create trust score if doesn't exist
      if (!trustScore) {
        trustScore = await storage.createFanTrustScore({ fanId });
      }
      
      res.json({ trustScore });
    } catch (error) {
      console.error('Error fetching trust score:', error);
      res.status(500).json({ error: 'Failed to fetch trust score' });
    }
  });

  // Admin - Get All Refunds
  app.get('/api/fanztrust/admin/refunds', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      
      if (user?.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
      }
      
      const refunds = await storage.getAllRefundRequests();
      res.json({ refunds });
    } catch (error) {
      console.error('Error fetching all refunds:', error);
      res.status(500).json({ error: 'Failed to fetch refunds' });
    }
  });

  // Admin - Override Refund
  app.post('/api/fanztrust/admin/refunds/:id/override', isAuthenticated, async (req: any, res) => {
    try {
      const adminId = req.user.claims.sub;
      const user = await storage.getUser(adminId);
      
      if (user?.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
      }
      
      const refundId = req.params.id;
      const { action, notes } = req.body;
      
      const updatedRefund = await storage.updateRefundRequest(refundId, {
        status: action === 'approve' ? 'approved' : 'denied',
        reviewedBy: adminId,
        reviewNotes: `[ADMIN OVERRIDE] ${notes}`,
        reviewedAt: new Date()
      });
      
      // Log audit
      await storage.createTrustAuditLog({
        action: 'admin_override_refund',
        performedBy: adminId,
        refundId,
        result: action,
        ipAddress: req.ip,
        details: { notes }
      });
      
      res.json({ refund: updatedRefund });
    } catch (error) {
      console.error('Error overriding refund:', error);
      res.status(500).json({ error: 'Failed to override refund' });
    }
  });

  // Creator Refund Policy
  app.get('/api/fanztrust/policy', isAuthenticated, async (req: any, res) => {
    try {
      const creatorId = req.user.claims.sub;
      let policy = await storage.getCreatorRefundPolicy(creatorId);
      
      if (!policy) {
        policy = await storage.createCreatorRefundPolicy({ creatorId });
      }
      
      res.json({ policy });
    } catch (error) {
      console.error('Error fetching refund policy:', error);
      res.status(500).json({ error: 'Failed to fetch policy' });
    }
  });

  app.put('/api/fanztrust/policy', isAuthenticated, async (req: any, res) => {
    try {
      const creatorId = req.user.claims.sub;
      const policyData = req.body;
      
      const policy = await storage.updateCreatorRefundPolicy(creatorId, policyData);
      res.json({ policy });
    } catch (error) {
      console.error('Error updating refund policy:', error);
      res.status(500).json({ error: 'Failed to update policy' });
    }
  });

  // ========================================
  // INFINITY SCROLL FEED API ROUTES
  // ========================================

  // Get Feed with Pagination
  app.get('/api/feed', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const cursor = req.query.cursor as string | undefined;
      const limit = parseInt(req.query.limit as string) || 20;

      // Get age verification status
      const ageVerification = await storage.getAgeVerification(userId);
      
      if (!ageVerification?.isVerified) {
        return res.status(403).json({ 
          error: 'Age verification required',
          code: 'AGE_VERIFICATION_REQUIRED'
        });
      }

      const result = await storage.getFeedPosts({ userId, cursor, limit });
      
      // Get sponsored posts for ad injection
      const sponsoredPosts = await storage.getSponsoredPosts({ isActive: true, limit: 5 });
      
      // Inject sponsored posts every 4th position
      const postsWithAds = [];
      let adIndex = 0;
      
      for (let i = 0; i < result.posts.length; i++) {
        postsWithAds.push(result.posts[i]);
        
        if ((i + 1) % 4 === 0 && adIndex < sponsoredPosts.length) {
          postsWithAds.push({
            ...sponsoredPosts[adIndex],
            isSponsored: true
          });
          
          // Track ad impression
          await storage.incrementAdImpression(sponsoredPosts[adIndex].id);
          adIndex++;
        }
      }

      res.json({
        posts: postsWithAds,
        nextCursor: result.nextCursor,
        hasMore: !!result.nextCursor
      });
    } catch (error) {
      console.error('Error fetching feed:', error);
      res.status(500).json({ error: 'Failed to fetch feed' });
    }
  });

  // Create Post
  app.post('/api/posts', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const postData = insertFeedPostSchema.parse({
        ...req.body,
        creatorId: userId
      });

      const post = await storage.createPost(postData);
      res.json({ post });
    } catch (error) {
      console.error('Error creating post:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid post data', details: error.errors });
      }
      res.status(500).json({ error: 'Failed to create post' });
    }
  });

  // Get Single Post
  app.get('/api/posts/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const postId = req.params.id;

      const post = await storage.getPost(postId);
      
      if (!post) {
        return res.status(404).json({ error: 'Post not found' });
      }

      // Check if user can access this post
      const canAccess = await checkPostAccess(userId, post);
      
      if (!canAccess) {
        return res.status(403).json({ 
          error: 'Access denied',
          requiresUnlock: post.visibility === 'paid',
          priceInCents: post.priceInCents
        });
      }

      // Get media
      const media = await storage.getPostMedia(postId);
      
      // Get engagement
      const engagement = await storage.getPostEngagement(postId);

      res.json({
        post,
        media,
        engagement
      });
    } catch (error) {
      console.error('Error fetching post:', error);
      res.status(500).json({ error: 'Failed to fetch post' });
    }
  });

  // Update Post
  app.put('/api/posts/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const postId = req.params.id;

      const post = await storage.getPost(postId);
      
      if (!post) {
        return res.status(404).json({ error: 'Post not found' });
      }

      if (post.creatorId !== userId) {
        return res.status(403).json({ error: 'Not authorized to edit this post' });
      }

      const updatedPost = await storage.updatePost(postId, req.body);
      res.json({ post: updatedPost });
    } catch (error) {
      console.error('Error updating post:', error);
      res.status(500).json({ error: 'Failed to update post' });
    }
  });

  // Delete Post
  app.delete('/api/posts/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const postId = req.params.id;

      const post = await storage.getPost(postId);
      
      if (!post) {
        return res.status(404).json({ error: 'Post not found' });
      }

      if (post.creatorId !== userId) {
        return res.status(403).json({ error: 'Not authorized to delete this post' });
      }

      await storage.deletePost(postId);
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting post:', error);
      res.status(500).json({ error: 'Failed to delete post' });
    }
  });

  // Add Media to Post
  app.post('/api/posts/:id/media', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const postId = req.params.id;

      const post = await storage.getPost(postId);
      
      if (!post) {
        return res.status(404).json({ error: 'Post not found' });
      }

      if (post.creatorId !== userId) {
        return res.status(403).json({ error: 'Not authorized to add media to this post' });
      }

      const mediaData = insertPostMediaSchema.parse({
        ...req.body,
        postId
      });

      const media = await storage.createPostMedia(mediaData);
      res.json({ media });
    } catch (error) {
      console.error('Error adding media:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid media data', details: error.errors });
      }
      res.status(500).json({ error: 'Failed to add media' });
    }
  });

  // Like Post
  app.post('/api/posts/:id/like', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const postId = req.params.id;

      await storage.likePost(postId, userId);
      
      const engagement = await storage.getPostEngagement(postId);
      res.json({ engagement });
    } catch (error) {
      console.error('Error liking post:', error);
      res.status(500).json({ error: 'Failed to like post' });
    }
  });

  // Unlike Post
  app.delete('/api/posts/:id/like', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const postId = req.params.id;

      await storage.unlikePost(postId, userId);
      
      const engagement = await storage.getPostEngagement(postId);
      res.json({ engagement });
    } catch (error) {
      console.error('Error unliking post:', error);
      res.status(500).json({ error: 'Failed to unlike post' });
    }
  });

  // Track Post View
  app.post('/api/posts/:id/view', isAuthenticated, async (req: any, res) => {
    try {
      const postId = req.params.id;
      await storage.incrementPostView(postId);
      res.json({ success: true });
    } catch (error) {
      console.error('Error tracking view:', error);
      res.status(500).json({ error: 'Failed to track view' });
    }
  });

  // Unlock Paid Post
  app.post('/api/posts/:id/unlock', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const postId = req.params.id;

      const post = await storage.getPost(postId);
      
      if (!post) {
        return res.status(404).json({ error: 'Post not found' });
      }

      if (post.visibility !== 'paid') {
        return res.status(400).json({ error: 'Post is not a paid post' });
      }

      // Check if already unlocked
      const isUnlocked = await storage.isPostUnlocked(postId, userId);
      if (isUnlocked) {
        return res.status(400).json({ error: 'Post already unlocked' });
      }

      // Process payment (integrate with FanzTrust wallet)
      const wallet = await storage.getFanzWallet(userId);
      const priceInTokens = (post.priceInCents || 0) * 10; // 1 cent = 10 FanzTokens
      
      if (!wallet || (wallet.fanzTokenBalance || 0) < priceInTokens) {
        return res.status(402).json({ 
          error: 'Insufficient funds',
          required: priceInTokens,
          available: wallet?.fanzTokenBalance || 0
        });
      }

      // Deduct from wallet
      const newBalance = (wallet.fanzTokenBalance || 0) - priceInTokens;
      await storage.updateFanzWallet(wallet.id, { fanzTokenBalance: newBalance });

      // Create transaction record
      const transaction = await storage.createWalletTransaction({
        walletId: wallet.id,
        type: 'debit',
        amount: priceInTokens,
        currency: 'FanzToken',
        description: `Unlocked post: ${post.content?.substring(0, 50) || 'Untitled'}`,
        status: 'completed'
      });

      // Unlock post
      const unlock = await storage.unlockPost(postId, userId, transaction.id, priceInTokens);

      res.json({ 
        success: true,
        unlock,
        newBalance 
      });
    } catch (error) {
      console.error('Error unlocking post:', error);
      res.status(500).json({ error: 'Failed to unlock post' });
    }
  });

  // Follow Creator
  app.post('/api/follow/:creatorId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const creatorId = req.params.creatorId;

      if (userId === creatorId) {
        return res.status(400).json({ error: 'Cannot follow yourself' });
      }

      const follow = await storage.followCreator(userId, creatorId);
      res.json({ follow });
    } catch (error) {
      console.error('Error following creator:', error);
      res.status(500).json({ error: 'Failed to follow creator' });
    }
  });

  // Unfollow Creator
  app.delete('/api/follow/:creatorId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const creatorId = req.params.creatorId;

      await storage.unfollowCreator(userId, creatorId);
      res.json({ success: true });
    } catch (error) {
      console.error('Error unfollowing creator:', error);
      res.status(500).json({ error: 'Failed to unfollow creator' });
    }
  });

  // Check Following Status
  app.get('/api/follow/:creatorId/status', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const creatorId = req.params.creatorId;

      const isFollowing = await storage.isFollowing(userId, creatorId);
      res.json({ isFollowing });
    } catch (error) {
      console.error('Error checking follow status:', error);
      res.status(500).json({ error: 'Failed to check follow status' });
    }
  });

  // Get User's Following List
  app.get('/api/following', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const following = await storage.getFollowing(userId);
      res.json({ following });
    } catch (error) {
      console.error('Error fetching following:', error);
      res.status(500).json({ error: 'Failed to fetch following list' });
    }
  });

  // Track Ad Click
  app.post('/api/ads/:id/click', isAuthenticated, async (req: any, res) => {
    try {
      const adId = req.params.id;
      await storage.incrementAdClick(adId);
      res.json({ success: true });
    } catch (error) {
      console.error('Error tracking ad click:', error);
      res.status(500).json({ error: 'Failed to track ad click' });
    }
  });

  // ====================================
  // COMMENTS API
  // ====================================

  // Get Post Comments
  app.get('/api/posts/:postId/comments', isAuthenticated, async (req: any, res) => {
    try {
      const postId = req.params.postId;
      const userId = req.user.claims.sub;

      // Mock comments data - would fetch from storage
      const comments = [
        {
          id: '1',
          postId,
          userId: 'user1',
          content: 'Great content!',
          likes: 5,
          isLiked: false,
          isPinned: false,
          isEdited: false,
          parentId: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          author: {
            id: 'user1',
            username: 'user1',
            displayName: 'User One',
            avatarUrl: '/avatar1.jpg',
          },
          replies: [],
        },
      ];

      res.json(comments);
    } catch (error) {
      console.error('Error fetching comments:', error);
      res.status(500).json({ error: 'Failed to fetch comments' });
    }
  });

  // Add Comment
  app.post('/api/posts/:postId/comments', isAuthenticated, async (req: any, res) => {
    try {
      const postId = req.params.postId;
      const userId = req.user.claims.sub;
      const { content, parentId } = req.body;

      const comment = {
        id: Math.random().toString(36),
        postId,
        userId,
        content,
        parentId,
        likes: 0,
        isEdited: false,
        isPinned: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      res.json({ comment });
    } catch (error) {
      console.error('Error adding comment:', error);
      res.status(500).json({ error: 'Failed to add comment' });
    }
  });

  // Like Comment
  app.post('/api/comments/:commentId/like', isAuthenticated, async (req: any, res) => {
    try {
      const commentId = req.params.commentId;
      const userId = req.user.claims.sub;

      res.json({ success: true, liked: true });
    } catch (error) {
      console.error('Error liking comment:', error);
      res.status(500).json({ error: 'Failed to like comment' });
    }
  });

  // ====================================
  // LIVE STREAMS API
  // ====================================

  // Get All Streams
  app.get('/api/streams', isAuthenticated, async (req: any, res) => {
    try {
      const filter = req.query.filter || 'all';

      const streams = [
        {
          id: '1',
          creatorId: 'creator1',
          title: 'Live Coding Session',
          description: 'Building a React app',
          thumbnailUrl: '/stream1.jpg',
          streamKey: 'key123',
          playbackUrl: '/play/stream1',
          status: 'live',
          visibility: 'free',
          priceInCents: 0,
          viewerCount: 150,
          totalViews: 500,
          scheduledAt: null,
          startedAt: new Date(),
          endedAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          creator: {
            id: 'creator1',
            username: 'creator1',
            displayName: 'Creator One',
            avatarUrl: '/avatar1.jpg',
          },
        },
      ];

      res.json(streams);
    } catch (error) {
      console.error('Error fetching streams:', error);
      res.status(500).json({ error: 'Failed to fetch streams' });
    }
  });

  // Create Stream
  app.post('/api/streams', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { title, description, visibility, priceInCents, scheduledAt } = req.body;

      const stream = {
        id: Math.random().toString(36),
        creatorId: userId,
        title,
        description,
        thumbnailUrl: null,
        streamKey: `stream_${Math.random().toString(36)}`,
        playbackUrl: null,
        status: 'scheduled',
        visibility,
        priceInCents,
        viewerCount: 0,
        totalViews: 0,
        scheduledAt,
        startedAt: null,
        endedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      res.json({ stream });
    } catch (error) {
      console.error('Error creating stream:', error);
      res.status(500).json({ error: 'Failed to create stream' });
    }
  });

  // ====================================
  // AI RECOMMENDATIONS API
  // ====================================

  // Get Personalized Recommendations
  app.get('/api/discover', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;

      const recommendations = {
        posts: [],
        categories: ['Photography', 'Fitness', 'Art', 'Fashion', 'Gaming'],
        trendingCreators: [],
        personalizedScore: 85,
      };

      res.json(recommendations);
    } catch (error) {
      console.error('Error fetching recommendations:', error);
      res.status(500).json({ error: 'Failed to fetch recommendations' });
    }
  });

  // Track Content Interaction (for AI learning)
  app.post('/api/interactions', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { postId, streamId, interactionType, watchTimeSeconds, engagementScore } = req.body;

      // Store interaction for AI recommendations
      res.json({ success: true });
    } catch (error) {
      console.error('Error tracking interaction:', error);
      res.status(500).json({ error: 'Failed to track interaction' });
    }
  });

  // ====================================
  // CREATOR ANALYTICS API
  // ====================================

  // Get Creator Analytics
  app.get('/api/creator/analytics', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;

      const analytics = {
        totalEarnings: 12450,
        activeSubscribers: 1234,
        totalViews: 45200,
        engagementRate: 78,
        earningsData: [],
        contentPerformance: [],
        topPosts: [],
      };

      res.json(analytics);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      res.status(500).json({ error: 'Failed to fetch analytics' });
    }
  });

  // Helper function to check post access
  async function checkPostAccess(userId: string, post: any): Promise<boolean> {
    // Creator can always access their own posts
    if (post.creatorId === userId) {
      return true;
    }

    // Free previews are accessible to all
    if (post.isFreePreview || post.visibility === 'free') {
      return true;
    }

    // Check subscription status
    if (post.visibility === 'subscriber') {
      const subscription = await storage.getSubscription(userId, post.creatorId);
      return subscription?.status === 'active';
    }

    // Check if paid post is unlocked
    if (post.visibility === 'paid') {
      return await storage.isPostUnlocked(post.id, userId);
    }

    // Followers-only content
    if (post.visibility === 'followers') {
      return await storage.isFollowing(userId, post.creatorId);
    }

    return false;
  }

  return httpServer;
}
