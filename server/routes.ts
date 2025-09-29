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
import { insertMediaAssetSchema, insertMessageSchema, insertProfileSchema } from "@shared/schema";
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
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  // Store active connections
  const connections = new Map<string, WebSocket>();

  wss.on('connection', (ws) => {
    let userId: string | null = null;

    ws.on('message', async (data) => {
      try {
        const message = JSON.parse(data.toString());
        
        if (message.type === 'auth') {
          userId = message.userId;
          connections.set(userId, ws);
          console.log(`User ${userId} connected to WebSocket`);
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

  return httpServer;
}
