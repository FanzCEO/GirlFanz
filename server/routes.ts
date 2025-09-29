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

  return httpServer;
}
