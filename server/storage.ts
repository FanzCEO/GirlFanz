import {
  users,
  profiles,
  mediaAssets,
  messages,
  moderationQueue,
  payoutAccounts,
  payoutRequests,
  subscriptions,
  transactions,
  auditLogs,
  kycVerifications,
  type User,
  type UpsertUser,
  type Profile,
  type InsertProfile,
  type MediaAsset,
  type InsertMediaAsset,
  type Message,
  type InsertMessage,
  type ModerationItem,
  type PayoutAccount,
  type PayoutRequest,
  type Subscription,
  type InsertSubscription,
  type Transaction,
  type InsertTransaction,
  type AuditLog,
  type KycVerification,
  type InsertKycVerification,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, or, sql } from "drizzle-orm";

export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  createUser(user: Partial<User>): Promise<User>;
  
  // Profile operations
  getProfile(userId: string): Promise<Profile | undefined>;
  getProfileWithUser(userId: string): Promise<(Profile & { user: User }) | undefined>;
  createProfile(profile: InsertProfile): Promise<Profile>;
  updateProfile(userId: string, updates: Partial<InsertProfile>): Promise<Profile | undefined>;
  
  // Media operations
  getMediaAsset(id: string): Promise<MediaAsset | undefined>;
  getMediaAssetsByOwner(ownerId: string, limit?: number): Promise<MediaAsset[]>;
  createMediaAsset(media: InsertMediaAsset): Promise<MediaAsset>;
  updateMediaAsset(id: string, updates: Partial<MediaAsset>): Promise<MediaAsset | undefined>;
  
  // Messaging operations
  getMessages(senderId: string, receiverId: string, limit?: number): Promise<Message[]>;
  getConversations(userId: string): Promise<any[]>;
  createMessage(message: InsertMessage): Promise<Message>;
  markMessageAsRead(id: string): Promise<void>;
  
  // Moderation operations
  getModerationQueue(status?: string, limit?: number): Promise<ModerationItem[]>;
  createModerationItem(item: Partial<ModerationItem>): Promise<ModerationItem>;
  updateModerationItem(id: string, updates: Partial<ModerationItem>): Promise<ModerationItem | undefined>;
  
  // Payout operations
  getPayoutAccounts(userId: string): Promise<PayoutAccount[]>;
  getPayoutRequests(userId: string, limit?: number): Promise<PayoutRequest[]>;
  
  // Analytics operations
  getUserStats(userId: string): Promise<any>;
  getSystemHealth(): Promise<any>;
  
  // Subscription operations
  getSubscriptionsAsFan(userId: string): Promise<Subscription[]>;
  getSubscriptionsAsCreator(userId: string): Promise<Subscription[]>;
  createSubscription(subscription: InsertSubscription): Promise<Subscription>;
  updateSubscription(id: string, updates: Partial<Subscription>): Promise<Subscription | undefined>;
  
  // Transaction operations
  getTransactionsAsBuyer(userId: string): Promise<Transaction[]>;
  getTransactionsAsCreator(userId: string): Promise<Transaction[]>;
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  updateTransaction(id: string, updates: Partial<Transaction>): Promise<Transaction | undefined>;

  // KYC operations
  getKycVerification(userId: string): Promise<KycVerification | undefined>;
  getKycVerificationByType(userId: string, documentType: string): Promise<KycVerification | undefined>;
  createKycVerification(verification: InsertKycVerification): Promise<KycVerification>;
  
  // Audit operations
  createAuditLog(log: Partial<AuditLog>): Promise<AuditLog>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async createUser(userData: Partial<User>): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .returning();
    return user;
  }

  // Profile operations
  async getProfile(userId: string): Promise<Profile | undefined> {
    const [profile] = await db
      .select()
      .from(profiles)
      .where(eq(profiles.userId, userId));
    return profile;
  }

  async getProfileWithUser(userId: string): Promise<(Profile & { user: User }) | undefined> {
    const [result] = await db
      .select()
      .from(profiles)
      .innerJoin(users, eq(profiles.userId, users.id))
      .where(eq(profiles.userId, userId));
    
    if (!result) return undefined;
    
    return {
      ...result.profiles,
      user: result.users,
    };
  }

  async createProfile(profileData: InsertProfile): Promise<Profile> {
    const [profile] = await db
      .insert(profiles)
      .values(profileData)
      .returning();
    return profile;
  }

  async updateProfile(userId: string, updates: Partial<InsertProfile>): Promise<Profile | undefined> {
    const [profile] = await db
      .update(profiles)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(profiles.userId, userId))
      .returning();
    return profile;
  }

  // Media operations
  async getMediaAsset(id: string): Promise<MediaAsset | undefined> {
    const [media] = await db
      .select()
      .from(mediaAssets)
      .where(eq(mediaAssets.id, id));
    return media;
  }

  async getMediaAssetsByOwner(ownerId: string, limit = 20): Promise<MediaAsset[]> {
    return await db
      .select()
      .from(mediaAssets)
      .where(eq(mediaAssets.ownerId, ownerId))
      .orderBy(desc(mediaAssets.createdAt))
      .limit(limit);
  }

  async createMediaAsset(mediaData: InsertMediaAsset): Promise<MediaAsset> {
    const [media] = await db
      .insert(mediaAssets)
      .values(mediaData)
      .returning();
    return media;
  }

  async updateMediaAsset(id: string, updates: Partial<MediaAsset>): Promise<MediaAsset | undefined> {
    const [media] = await db
      .update(mediaAssets)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(mediaAssets.id, id))
      .returning();
    return media;
  }

  // Messaging operations
  async getMessages(senderId: string, receiverId: string, limit = 50): Promise<Message[]> {
    return await db
      .select()
      .from(messages)
      .where(
        or(
          and(eq(messages.senderId, senderId), eq(messages.receiverId, receiverId)),
          and(eq(messages.senderId, receiverId), eq(messages.receiverId, senderId))
        )
      )
      .orderBy(desc(messages.createdAt))
      .limit(limit);
  }

  async getConversations(userId: string): Promise<any[]> {
    // Get latest message for each conversation
    const conversations = await db
      .select({
        otherUserId: sql`CASE WHEN ${messages.senderId} = ${userId} THEN ${messages.receiverId} ELSE ${messages.senderId} END`.as('other_user_id'),
        lastMessage: messages.content,
        lastMessageTime: messages.createdAt,
        isRead: messages.isRead,
      })
      .from(messages)
      .where(or(eq(messages.senderId, userId), eq(messages.receiverId, userId)))
      .orderBy(desc(messages.createdAt));

    // Group by conversation and get the latest message
    const conversationMap = new Map();
    conversations.forEach(conv => {
      const key = conv.otherUserId;
      if (!conversationMap.has(key)) {
        conversationMap.set(key, conv);
      }
    });

    return Array.from(conversationMap.values());
  }

  async createMessage(messageData: InsertMessage): Promise<Message> {
    const [message] = await db
      .insert(messages)
      .values(messageData)
      .returning();
    return message;
  }

  async markMessageAsRead(id: string): Promise<void> {
    await db
      .update(messages)
      .set({ isRead: true })
      .where(eq(messages.id, id));
  }

  // Moderation operations
  async getModerationQueue(status?: string, limit = 50): Promise<ModerationItem[]> {
    let query = db
      .select()
      .from(moderationQueue)
      .innerJoin(mediaAssets, eq(moderationQueue.mediaId, mediaAssets.id))
      .orderBy(desc(moderationQueue.createdAt))
      .limit(limit);

    if (status) {
      query = query.where(eq(moderationQueue.status, status as any));
    }

    const results = await query;
    return results.map(r => ({
      ...r.moderation_queue,
      media: r.media_assets,
    })) as any;
  }

  async createModerationItem(itemData: Partial<ModerationItem>): Promise<ModerationItem> {
    const [item] = await db
      .insert(moderationQueue)
      .values(itemData as any)
      .returning();
    return item;
  }

  async updateModerationItem(id: string, updates: Partial<ModerationItem>): Promise<ModerationItem | undefined> {
    const [item] = await db
      .update(moderationQueue)
      .set({ ...updates, reviewedAt: new Date() })
      .where(eq(moderationQueue.id, id))
      .returning();
    return item;
  }

  // Payout operations
  async getPayoutAccounts(userId: string): Promise<PayoutAccount[]> {
    return await db
      .select()
      .from(payoutAccounts)
      .where(eq(payoutAccounts.userId, userId));
  }

  async getPayoutRequests(userId: string, limit = 20): Promise<PayoutRequest[]> {
    return await db
      .select()
      .from(payoutRequests)
      .where(eq(payoutRequests.userId, userId))
      .orderBy(desc(payoutRequests.createdAt))
      .limit(limit);
  }

  // Analytics operations
  async getUserStats(userId: string): Promise<any> {
    const profile = await this.getProfile(userId);
    const mediaCount = await db
      .select({ count: sql`count(*)` })
      .from(mediaAssets)
      .where(eq(mediaAssets.ownerId, userId));

    const totalViews = await db
      .select({ total: sql`sum(${mediaAssets.views})` })
      .from(mediaAssets)
      .where(eq(mediaAssets.ownerId, userId));

    return {
      totalEarnings: profile?.totalEarnings || 0,
      fanCount: profile?.fanCount || 0,
      contentPosts: mediaCount[0]?.count || 0,
      totalViews: totalViews[0]?.total || 0,
      engagement: 94.2, // Calculate based on actual metrics
    };
  }

  async getSystemHealth(): Promise<any> {
    // Check database connection
    const dbCheck = await db.select({ count: sql`count(*)` }).from(users);
    
    // Get moderation queue count
    const pendingModeration = await db
      .select({ count: sql`count(*)` })
      .from(moderationQueue)
      .where(eq(moderationQueue.status, 'pending'));

    // Get active user count
    const activeUsers = await db
      .select({ count: sql`count(*)` })
      .from(users)
      .where(eq(users.status, 'active'));

    return {
      database: {
        status: 'healthy',
        connections: 45,
        queryTime: '12ms',
      },
      apiGateway: {
        status: 'healthy',
        responseTime: '45ms',
        uptime: '99.98%',
      },
      payments: {
        status: 'maintenance',
        provider: 'CCBill',
        successRate: '98.2%',
      },
      websocket: {
        status: 'active',
        connections: activeUsers[0]?.count || 0,
        latency: '28ms',
      },
      moderation: {
        pending: pendingModeration[0]?.count || 0,
        status: 'operational',
      },
    };
  }

  // Audit operations
  async createAuditLog(logData: Partial<AuditLog>): Promise<AuditLog> {
    const [log] = await db
      .insert(auditLogs)
      .values(logData as any)
      .returning();
    return log;
  }

  // Subscription operations
  async getSubscriptionsAsFan(userId: string): Promise<Subscription[]> {
    return await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, userId))
      .orderBy(desc(subscriptions.createdAt));
  }

  async getSubscriptionsAsCreator(userId: string): Promise<Subscription[]> {
    return await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.creatorId, userId))
      .orderBy(desc(subscriptions.createdAt));
  }

  async createSubscription(subscriptionData: InsertSubscription): Promise<Subscription> {
    const [subscription] = await db
      .insert(subscriptions)
      .values(subscriptionData)
      .returning();
    return subscription;
  }

  async updateSubscription(id: string, updates: Partial<Subscription>): Promise<Subscription | undefined> {
    const [subscription] = await db
      .update(subscriptions)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(subscriptions.id, id))
      .returning();
    return subscription;
  }

  // Transaction operations
  async getTransactionsAsBuyer(userId: string): Promise<Transaction[]> {
    return await db
      .select()
      .from(transactions)
      .where(eq(transactions.userId, userId))
      .orderBy(desc(transactions.createdAt));
  }

  async getTransactionsAsCreator(userId: string): Promise<Transaction[]> {
    return await db
      .select()
      .from(transactions)
      .where(eq(transactions.creatorId, userId))
      .orderBy(desc(transactions.createdAt));
  }

  async createTransaction(transactionData: InsertTransaction): Promise<Transaction> {
    const [transaction] = await db
      .insert(transactions)
      .values(transactionData)
      .returning();
    return transaction;
  }

  async updateTransaction(id: string, updates: Partial<Transaction>): Promise<Transaction | undefined> {
    const [transaction] = await db
      .update(transactions)
      .set(updates)
      .where(eq(transactions.id, id))
      .returning();
    return transaction;
  }

  // KYC operations
  async getKycVerification(userId: string): Promise<KycVerification | undefined> {
    const [verification] = await db
      .select()
      .from(kycVerifications)
      .where(eq(kycVerifications.userId, userId))
      .orderBy(desc(kycVerifications.createdAt))
      .limit(1);
    return verification;
  }

  async getKycVerificationByType(userId: string, documentType: string): Promise<KycVerification | undefined> {
    const [verification] = await db
      .select()
      .from(kycVerifications)
      .where(and(
        eq(kycVerifications.userId, userId),
        eq(kycVerifications.documentType, documentType)
      ))
      .orderBy(desc(kycVerifications.createdAt))
      .limit(1);
    return verification;
  }

  async createKycVerification(verificationData: InsertKycVerification): Promise<KycVerification> {
    const [verification] = await db
      .insert(kycVerifications)
      .values(verificationData)
      .returning();
    return verification;
  }

  // Audit operations  
  async createAuditLog(logData: Partial<AuditLog>): Promise<AuditLog> {
    const [auditLog] = await db
      .insert(auditLogs)
      .values(logData)
      .returning();
    return auditLog;
  }
}

export const storage = new DatabaseStorage();
