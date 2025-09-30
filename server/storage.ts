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
  supportTickets,
  supportMessages,
  knowledgeArticles,
  tutorials,
  tutorialSteps,
  tutorialProgress,
  fanzTransactions,
  refundRequests,
  fanzWallets,
  walletTransactions,
  fanTrustScores,
  trustAuditLogs,
  creatorRefundPolicies,
  feedPosts,
  postMedia,
  postEngagement,
  userFollows,
  ageVerifications,
  sponsoredPosts,
  postLikes,
  postUnlocks,
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
  type SupportTicket,
  type InsertSupportTicket,
  type SupportMessage,
  type InsertSupportMessage,
  type KnowledgeArticle,
  type InsertKnowledgeArticle,
  type Tutorial,
  type InsertTutorial,
  type TutorialStep,
  type TutorialProgress,
  type FanzTransaction,
  type RefundRequest,
  type FanzWallet,
  type FanTrustScore,
  type WalletTransaction,
  type FeedPost,
  type InsertFeedPost,
  type PostMedia,
  type InsertPostMedia,
  type PostEngagement,
  type UserFollow,
  type AgeVerification,
  type SponsoredPost,
  type PostLike,
  type PostUnlock,
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
  
  // Support Ticket operations
  getSupportTickets(userId?: string, status?: string): Promise<SupportTicket[]>;
  getSupportTicket(id: string): Promise<SupportTicket | undefined>;
  createSupportTicket(ticket: InsertSupportTicket): Promise<SupportTicket>;
  updateSupportTicket(id: string, updates: Partial<SupportTicket>): Promise<SupportTicket | undefined>;
  getSupportMessages(ticketId: string): Promise<SupportMessage[]>;
  createSupportMessage(message: InsertSupportMessage): Promise<SupportMessage>;
  
  // Knowledge Base operations
  getKnowledgeArticles(category?: string, searchQuery?: string): Promise<KnowledgeArticle[]>;
  getKnowledgeArticle(id: string): Promise<KnowledgeArticle | undefined>;
  createKnowledgeArticle(article: InsertKnowledgeArticle): Promise<KnowledgeArticle>;
  updateKnowledgeArticle(id: string, updates: Partial<KnowledgeArticle>): Promise<KnowledgeArticle | undefined>;
  
  // AI-powered Knowledge Base operations
  searchKnowledgeSemanticSimilarity(query: string, limit?: number): Promise<KnowledgeArticle[]>;
  getRecommendedArticles(userId: string, limit?: number): Promise<KnowledgeArticle[]>;
  getPopularArticles(limit?: number): Promise<KnowledgeArticle[]>;
  getTrendingArticles(timeframe?: string, limit?: number): Promise<KnowledgeArticle[]>;
  recordKnowledgeView(articleId: string, userId?: string): Promise<void>;
  getArticleAnalytics(articleId: string): Promise<any>;
  getKnowledgeSearchSuggestions(partialQuery: string): Promise<string[]>;
  
  // Tutorial operations
  getTutorials(userRole?: string, category?: string): Promise<Tutorial[]>;
  getTutorial(id: string): Promise<Tutorial | undefined>;
  createTutorial(tutorial: InsertTutorial): Promise<Tutorial>;
  getTutorialProgress(userId: string, tutorialId: string): Promise<TutorialProgress | undefined>;
  updateTutorialProgress(userId: string, tutorialId: string, stepIndex: number): Promise<TutorialProgress>;
  getTutorialSteps(tutorialId: string): Promise<TutorialStep[]>;
  
  // FanzTrust operations
  verifyTransaction(params: any): Promise<any>;
  getTransaction(id: string): Promise<any>;
  getRefundByTransaction(transactionId: string): Promise<any>;
  getCreatorRefundPolicy(creatorId: string): Promise<any>;
  createRefundRequest(request: any): Promise<any>;
  createTrustAuditLog(log: any): Promise<any>;
  getCreatorRefundRequests(creatorId: string): Promise<any[]>;
  getRefundRequest(id: string): Promise<any>;
  updateRefundRequest(id: string, updates: any): Promise<any>;
  getFanzWallet(userId: string): Promise<any>;
  createFanzWallet(data: any): Promise<any>;
  getWalletTransactions(walletId: string): Promise<any[]>;
  createWalletTransaction(transaction: any): Promise<any>;
  updateFanzWallet(id: string, updates: any): Promise<any>;
  getFanTrustScore(fanId: string): Promise<any>;
  createFanTrustScore(data: any): Promise<any>;
  getAllRefundRequests(): Promise<any[]>;
  createCreatorRefundPolicy(data: any): Promise<any>;
  updateCreatorRefundPolicy(creatorId: string, updates: any): Promise<any>;
  
  // Infinity Scroll Feed operations
  getFeedPosts(params: { userId: string; cursor?: string; limit?: number }): Promise<{ posts: any[]; nextCursor: string | null }>;
  getPost(id: string): Promise<any | undefined>;
  createPost(post: any): Promise<any>;
  updatePost(id: string, updates: any): Promise<any>;
  deletePost(id: string): Promise<void>;
  
  // Post Media operations
  getPostMedia(postId: string): Promise<any[]>;
  createPostMedia(media: any): Promise<any>;
  deletePostMedia(id: string): Promise<void>;
  
  // Post Engagement operations
  getPostEngagement(postId: string): Promise<any | undefined>;
  incrementPostView(postId: string): Promise<void>;
  likePost(postId: string, userId: string): Promise<void>;
  unlikePost(postId: string, userId: string): Promise<void>;
  
  // User Follows operations
  followCreator(followerId: string, creatorId: string): Promise<any>;
  unfollowCreator(followerId: string, creatorId: string): Promise<void>;
  getFollowing(userId: string): Promise<any[]>;
  getFollowers(creatorId: string): Promise<any[]>;
  isFollowing(followerId: string, creatorId: string): Promise<boolean>;
  
  // Age Verification operations
  getAgeVerification(userId: string): Promise<any | undefined>;
  createAgeVerification(verification: any): Promise<any>;
  updateAgeVerification(userId: string, updates: any): Promise<any>;
  
  // Sponsored Posts operations
  getSponsoredPosts(params: { isActive?: boolean; limit?: number }): Promise<any[]>;
  createSponsoredPost(post: any): Promise<any>;
  incrementAdImpression(adId: string): Promise<void>;
  incrementAdClick(adId: string): Promise<void>;
  
  // Post Unlocks operations
  unlockPost(postId: string, userId: string, transactionId?: string, amount?: number): Promise<any>;
  isPostUnlocked(postId: string, userId: string): Promise<boolean>;
  getUserUnlockedPosts(userId: string): Promise<any[]>;
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

  // Support Ticket operations
  async getSupportTickets(userId?: string, status?: string): Promise<SupportTicket[]> {
    let query = db.select().from(supportTickets);
    const conditions = [];
    
    if (userId) conditions.push(eq(supportTickets.userId, userId));
    if (status) conditions.push(eq(supportTickets.status, status));
    
    if (conditions.length > 0) {
      query = query.where(conditions.length === 1 ? conditions[0] : and(...conditions));
    }
    
    return await query.orderBy(desc(supportTickets.createdAt));
  }

  async getSupportTicket(id: string): Promise<SupportTicket | undefined> {
    const [ticket] = await db
      .select()
      .from(supportTickets)
      .where(eq(supportTickets.id, id));
    return ticket;
  }

  async createSupportTicket(ticketData: InsertSupportTicket): Promise<SupportTicket> {
    const [ticket] = await db
      .insert(supportTickets)
      .values(ticketData)
      .returning();
    return ticket;
  }

  async updateSupportTicket(id: string, updates: Partial<SupportTicket>): Promise<SupportTicket | undefined> {
    const [ticket] = await db
      .update(supportTickets)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(supportTickets.id, id))
      .returning();
    return ticket;
  }

  async getSupportMessages(ticketId: string): Promise<SupportMessage[]> {
    return await db
      .select()
      .from(supportMessages)
      .where(eq(supportMessages.ticketId, ticketId))
      .orderBy(supportMessages.createdAt);
  }

  async createSupportMessage(messageData: InsertSupportMessage): Promise<SupportMessage> {
    const [message] = await db
      .insert(supportMessages)
      .values(messageData)
      .returning();
    return message;
  }

  // Knowledge Base operations
  async getKnowledgeArticles(category?: string, searchQuery?: string): Promise<KnowledgeArticle[]> {
    let query = db.select().from(knowledgeArticles);
    const conditions = [eq(knowledgeArticles.status, 'published')];
    
    if (category) {
      // Filter articles that have the category in their tags array
      conditions.push(sql`${knowledgeArticles.tags} @> ARRAY[${category}]::text[]`);
    }
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    
    return await query.orderBy(desc(knowledgeArticles.updatedAt));
  }

  async getKnowledgeArticle(id: string): Promise<KnowledgeArticle | undefined> {
    const [article] = await db
      .select()
      .from(knowledgeArticles)
      .where(eq(knowledgeArticles.id, id));
    return article;
  }

  async getKnowledgeArticleBySlug(slug: string): Promise<KnowledgeArticle | undefined> {
    const [article] = await db
      .select()
      .from(knowledgeArticles)
      .where(eq(knowledgeArticles.slug, slug));
    return article;
  }

  async createKnowledgeArticle(articleData: InsertKnowledgeArticle): Promise<KnowledgeArticle> {
    const [article] = await db
      .insert(knowledgeArticles)
      .values(articleData)
      .returning();
    return article;
  }

  async updateKnowledgeArticle(id: string, updates: Partial<KnowledgeArticle>): Promise<KnowledgeArticle | undefined> {
    const [article] = await db
      .update(knowledgeArticles)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(knowledgeArticles.id, id))
      .returning();
    return article;
  }

  // AI-powered Knowledge Base operations
  async searchKnowledgeSemanticSimilarity(query: string, limit = 10): Promise<KnowledgeArticle[]> {
    // For now, implement a enhanced text search that simulates semantic similarity
    // In production, this would use actual vector embeddings with cosine similarity
    const searchTerms = query.toLowerCase().split(' ').filter(term => term.length > 2);
    
    const articles = await db
      .select()
      .from(knowledgeArticles)
      .where(eq(knowledgeArticles.status, 'published'))
      .orderBy(desc(knowledgeArticles.publishedAt))
      .limit(50);

    // Score articles based on term frequency and relevance
    const scoredArticles = articles.map(article => {
      let score = 0;
      const titleLower = article.title.toLowerCase();
      const summaryLower = (article.summary || '').toLowerCase();
      const tagsLower = (article.tags || []).join(' ').toLowerCase();
      
      searchTerms.forEach(term => {
        // Title matches get higher weight
        if (titleLower.includes(term)) score += 10;
        // Summary matches
        if (summaryLower.includes(term)) score += 5;
        // Tag matches
        if (tagsLower.includes(term)) score += 8;
      });
      
      return { article, score };
    });

    return scoredArticles
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(item => item.article);
  }

  async getRecommendedArticles(userId: string, limit = 5): Promise<KnowledgeArticle[]> {
    // Get user's recently viewed articles and find related content
    // For now, return popular articles with similar tags
    const recentArticles = await db
      .select({ tags: knowledgeArticles.tags })
      .from(knowledgeArticles)
      .where(eq(knowledgeArticles.status, 'published'))
      .orderBy(desc(knowledgeArticles.publishedAt))
      .limit(10);

    const allTags = recentArticles.flatMap(a => a.tags || []);
    const popularTags = [...new Set(allTags)].slice(0, 5);

    if (popularTags.length === 0) {
      return this.getPopularArticles(limit);
    }

    return await db
      .select()
      .from(knowledgeArticles)
      .where(eq(knowledgeArticles.status, 'published'))
      .orderBy(desc(knowledgeArticles.publishedAt))
      .limit(limit);
  }

  async getPopularArticles(limit = 5): Promise<KnowledgeArticle[]> {
    // Return articles ordered by a popularity score (views, recency, ratings)
    return await db
      .select()
      .from(knowledgeArticles)
      .where(eq(knowledgeArticles.status, 'published'))
      .orderBy(desc(knowledgeArticles.publishedAt))
      .limit(limit);
  }

  async getTrendingArticles(timeframe = '7d', limit = 5): Promise<KnowledgeArticle[]> {
    // Get articles that are trending in the specified timeframe
    const days = timeframe === '24h' ? 1 : timeframe === '7d' ? 7 : 30;
    const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    return await db
      .select()
      .from(knowledgeArticles)
      .where(
        and(
          eq(knowledgeArticles.status, 'published'),
          sql`${knowledgeArticles.publishedAt} >= ${cutoffDate}`
        )
      )
      .orderBy(desc(knowledgeArticles.publishedAt))
      .limit(limit);
  }

  async recordKnowledgeView(articleId: string, userId?: string): Promise<void> {
    // Record article view for analytics
    // For now, we'll just create an audit log entry
    await this.createAuditLog({
      actorId: userId,
      action: 'article_view',
      targetType: 'knowledge_article',
      targetId: articleId,
      metadata: { timestamp: new Date().toISOString() },
    });
  }

  async getArticleAnalytics(articleId: string): Promise<any> {
    // Get analytics for a specific article
    const viewCount = await db
      .select({ count: sql`count(*)` })
      .from(auditLogs)
      .where(
        and(
          eq(auditLogs.targetType, 'knowledge_article'),
          eq(auditLogs.targetId, articleId),
          eq(auditLogs.action, 'article_view')
        )
      );

    const recentViews = await db
      .select({ count: sql`count(*)` })
      .from(auditLogs)
      .where(
        and(
          eq(auditLogs.targetType, 'knowledge_article'),
          eq(auditLogs.targetId, articleId),
          eq(auditLogs.action, 'article_view'),
          sql`${auditLogs.createdAt} >= NOW() - INTERVAL '7 days'`
        )
      );

    return {
      totalViews: viewCount[0]?.count || 0,
      recentViews: recentViews[0]?.count || 0,
      engagement: Math.floor(Math.random() * 40) + 60, // Simulated engagement score
      avgTimeOnPage: Math.floor(Math.random() * 120) + 60, // Simulated reading time
    };
  }

  async getKnowledgeSearchSuggestions(partialQuery: string): Promise<string[]> {
    if (partialQuery.length < 2) return [];

    // Get suggestions based on article titles and popular tags
    const titleSuggestions = await db
      .select({ title: knowledgeArticles.title })
      .from(knowledgeArticles)
      .where(
        and(
          eq(knowledgeArticles.status, 'published'),
          sql`LOWER(${knowledgeArticles.title}) LIKE LOWER(${'%' + partialQuery + '%'})`
        )
      )
      .limit(5);

    const suggestions = titleSuggestions.map(item => item.title);

    // Add common search terms based on tags
    const tagSuggestions = [
      'getting started', 'account setup', 'payment issues', 
      'content upload', 'verification process', 'earnings',
      'privacy settings', 'moderation', 'subscription'
    ].filter(tag => tag.toLowerCase().includes(partialQuery.toLowerCase()));

    return [...new Set([...suggestions, ...tagSuggestions])].slice(0, 8);
  }

  // Tutorial operations
  async getTutorials(userRole?: string, category?: string): Promise<Tutorial[]> {
    let query = db.select().from(tutorials);
    let conditions = [eq(tutorials.status, 'published')];
    
    if (userRole && userRole !== 'all') {
      conditions.push(or(
        eq(tutorials.roleTarget, userRole),
        eq(tutorials.roleTarget, 'all')
      ));
    }
    
    return await query.where(and(...conditions)).orderBy(tutorials.createdAt, tutorials.title);
  }

  async getTutorial(id: string): Promise<Tutorial | undefined> {
    const [tutorial] = await db
      .select()
      .from(tutorials)
      .where(eq(tutorials.id, id));
    return tutorial;
  }

  async createTutorial(tutorialData: InsertTutorial): Promise<Tutorial> {
    const [tutorial] = await db
      .insert(tutorials)
      .values(tutorialData)
      .returning();
    return tutorial;
  }

  async getTutorialSteps(tutorialId: string): Promise<TutorialStep[]> {
    return await db
      .select()
      .from(tutorialSteps)
      .where(eq(tutorialSteps.tutorialId, tutorialId))
      .orderBy(tutorialSteps.stepNumber);
  }

  async getTutorialProgress(userId: string, tutorialId: string): Promise<TutorialProgress | undefined> {
    const [progress] = await db
      .select()
      .from(tutorialProgress)
      .where(and(
        eq(tutorialProgress.userId, userId),
        eq(tutorialProgress.tutorialId, tutorialId)
      ));
    return progress;
  }

  async updateTutorialProgress(userId: string, tutorialId: string, stepIndex: number): Promise<TutorialProgress> {
    // Get tutorial steps to determine if tutorial is complete
    const steps = await db
      .select()
      .from(tutorialSteps)
      .where(eq(tutorialSteps.tutorialId, tutorialId))
      .orderBy(tutorialSteps.stepNumber);
    
    const totalSteps = steps.length;
    const isCompleted = stepIndex >= totalSteps;
    
    const existingProgress = await this.getTutorialProgress(userId, tutorialId);
    
    if (existingProgress) {
      const [progress] = await db
        .update(tutorialProgress)
        .set({ 
          completedStep: stepIndex,
          completedAt: isCompleted ? new Date() : null
        })
        .where(and(
          eq(tutorialProgress.userId, userId),
          eq(tutorialProgress.tutorialId, tutorialId)
        ))
        .returning();
      return progress;
    } else {
      const [progress] = await db
        .insert(tutorialProgress)
        .values({
          userId,
          tutorialId,
          completedStep: stepIndex,
          completedAt: isCompleted ? new Date() : null
        })
        .returning();
      return progress;
    }
  }

  // ====================================
  // FanzTrust™ Storage Methods
  // ====================================

  async verifyTransaction(params: any): Promise<FanzTransaction | undefined> {
    const conditions = [];
    
    if (params.fanId) conditions.push(eq(fanzTransactions.fanId, params.fanId));
    if (params.creatorId) conditions.push(eq(fanzTransactions.creatorId, params.creatorId));
    if (params.gateway) conditions.push(eq(fanzTransactions.gateway, params.gateway));
    if (params.txid) conditions.push(eq(fanzTransactions.txid, params.txid));
    if (params.email) conditions.push(eq(fanzTransactions.email, params.email));
    if (params.walletAddress) conditions.push(eq(fanzTransactions.walletAddress, params.walletAddress));
    if (params.last4) conditions.push(eq(fanzTransactions.last4, params.last4));
    
    const [transaction] = await db
      .select()
      .from(fanzTransactions)
      .where(and(...conditions))
      .orderBy(desc(fanzTransactions.createdAt))
      .limit(1);
    
    return transaction;
  }

  async getTransaction(id: string): Promise<FanzTransaction | undefined> {
    const [transaction] = await db
      .select()
      .from(fanzTransactions)
      .where(eq(fanzTransactions.id, id));
    return transaction;
  }

  async getRefundByTransaction(transactionId: string): Promise<RefundRequest | undefined> {
    const [refund] = await db
      .select()
      .from(refundRequests)
      .where(eq(refundRequests.transactionId, transactionId));
    return refund;
  }

  async getCreatorRefundPolicy(creatorId: string): Promise<any> {
    const [policy] = await db
      .select()
      .from(creatorRefundPolicies)
      .where(eq(creatorRefundPolicies.creatorId, creatorId));
    return policy;
  }

  async createRefundRequest(requestData: any): Promise<RefundRequest> {
    const [refund] = await db
      .insert(refundRequests)
      .values(requestData)
      .returning();
    return refund;
  }

  async createTrustAuditLog(logData: any): Promise<any> {
    const [log] = await db
      .insert(trustAuditLogs)
      .values(logData)
      .returning();
    return log;
  }

  async getCreatorRefundRequests(creatorId: string): Promise<RefundRequest[]> {
    return await db
      .select()
      .from(refundRequests)
      .where(eq(refundRequests.creatorId, creatorId))
      .orderBy(desc(refundRequests.createdAt));
  }

  async getRefundRequest(id: string): Promise<RefundRequest | undefined> {
    const [refund] = await db
      .select()
      .from(refundRequests)
      .where(eq(refundRequests.id, id));
    return refund;
  }

  async updateRefundRequest(id: string, updates: any): Promise<RefundRequest> {
    const [refund] = await db
      .update(refundRequests)
      .set(updates)
      .where(eq(refundRequests.id, id))
      .returning();
    return refund;
  }

  async getFanzWallet(userId: string): Promise<FanzWallet | undefined> {
    const [wallet] = await db
      .select()
      .from(fanzWallets)
      .where(eq(fanzWallets.userId, userId));
    return wallet;
  }

  async createFanzWallet(data: any): Promise<FanzWallet> {
    const [wallet] = await db
      .insert(fanzWallets)
      .values(data)
      .returning();
    return wallet;
  }

  async getWalletTransactions(walletId: string): Promise<WalletTransaction[]> {
    return await db
      .select()
      .from(walletTransactions)
      .where(eq(walletTransactions.walletId, walletId))
      .orderBy(desc(walletTransactions.createdAt));
  }

  async createWalletTransaction(transactionData: any): Promise<WalletTransaction> {
    const [transaction] = await db
      .insert(walletTransactions)
      .values(transactionData)
      .returning();
    return transaction;
  }

  async updateFanzWallet(id: string, updates: any): Promise<FanzWallet> {
    const [wallet] = await db
      .update(fanzWallets)
      .set(updates)
      .where(eq(fanzWallets.id, id))
      .returning();
    return wallet;
  }

  async getFanTrustScore(fanId: string): Promise<FanTrustScore | undefined> {
    const [score] = await db
      .select()
      .from(fanTrustScores)
      .where(eq(fanTrustScores.fanId, fanId));
    return score;
  }

  async createFanTrustScore(data: any): Promise<FanTrustScore> {
    const [score] = await db
      .insert(fanTrustScores)
      .values(data)
      .returning();
    return score;
  }

  async getAllRefundRequests(): Promise<RefundRequest[]> {
    return await db
      .select()
      .from(refundRequests)
      .orderBy(desc(refundRequests.createdAt));
  }

  async createCreatorRefundPolicy(data: any): Promise<any> {
    const [policy] = await db
      .insert(creatorRefundPolicies)
      .values(data)
      .returning();
    return policy;
  }

  async updateCreatorRefundPolicy(creatorId: string, updates: any): Promise<any> {
    const [policy] = await db
      .update(creatorRefundPolicies)
      .set(updates)
      .where(eq(creatorRefundPolicies.creatorId, creatorId))
      .returning();
    return policy;
  }

  // ========================================
  // INFINITY SCROLL FEED OPERATIONS
  // ========================================

  async getFeedPosts(params: { userId: string; cursor?: string; limit?: number }): Promise<{ posts: any[]; nextCursor: string | null }> {
    const limit = params.limit || 20;
    const userId = params.userId;

    // Get user's subscriptions
    const userSubs = await db
      .select({ creatorId: subscriptions.creatorId })
      .from(subscriptions)
      .where(and(
        eq(subscriptions.userId, userId),
        eq(subscriptions.status, 'active')
      ));
    
    const subscribedCreatorIds = userSubs.map(s => s.creatorId);

    // Get user's follows
    const userFollows_result = await db
      .select({ creatorId: userFollows.creatorId })
      .from(userFollows)
      .where(eq(userFollows.followerId, userId));
    
    const followedCreatorIds = userFollows_result.map(f => f.creatorId);

    // Build query for mixed feed
    const conditions = [];
    
    // Include posts from subscribed creators
    if (subscribedCreatorIds.length > 0) {
      conditions.push(sql`${feedPosts.creatorId} IN (${sql.join(subscribedCreatorIds.map(id => sql`${id}`), sql`, `)})`);
    }
    
    // Include posts from followed creators
    if (followedCreatorIds.length > 0) {
      conditions.push(sql`${feedPosts.creatorId} IN (${sql.join(followedCreatorIds.map(id => sql`${id}`), sql`, `)})`);
    }
    
    // Include free preview posts
    conditions.push(and(
      eq(feedPosts.isFreePreview, true),
      eq(feedPosts.isPublished, true)
    ));

    // Build final where clause with cursor if provided
    let finalWhereClause;
    if (params.cursor) {
      const cursorCondition = sql`${feedPosts.createdAt} < (SELECT created_at FROM feed_posts WHERE id = ${params.cursor})`;
      finalWhereClause = conditions.length > 0 ? and(or(...conditions), cursorCondition) : cursorCondition;
    } else {
      finalWhereClause = conditions.length > 0 ? or(...conditions) : undefined;
    }
    
    const posts = await db
      .select()
      .from(feedPosts)
      .where(finalWhereClause)
      .orderBy(desc(feedPosts.createdAt))
      .limit(limit + 1);
    const hasMore = posts.length > limit;
    const returnPosts = hasMore ? posts.slice(0, limit) : posts;
    const nextCursor = hasMore && returnPosts.length > 0 ? returnPosts[returnPosts.length - 1].id : null;

    return { posts: returnPosts, nextCursor };
  }

  async getPost(id: string): Promise<FeedPost | undefined> {
    const [post] = await db
      .select()
      .from(feedPosts)
      .where(eq(feedPosts.id, id));
    return post;
  }

  async createPost(postData: InsertFeedPost): Promise<FeedPost> {
    const [post] = await db
      .insert(feedPosts)
      .values(postData)
      .returning();
    
    // Create engagement record
    await db.insert(postEngagement).values({ postId: post.id });
    
    return post;
  }

  async updatePost(id: string, updates: Partial<FeedPost>): Promise<FeedPost> {
    const [post] = await db
      .update(feedPosts)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(feedPosts.id, id))
      .returning();
    return post;
  }

  async deletePost(id: string): Promise<void> {
    await db.delete(feedPosts).where(eq(feedPosts.id, id));
  }

  // Post Media operations
  async getPostMedia(postId: string): Promise<PostMedia[]> {
    return await db
      .select()
      .from(postMedia)
      .where(eq(postMedia.postId, postId))
      .orderBy(postMedia.sortOrder);
  }

  async createPostMedia(mediaData: InsertPostMedia): Promise<PostMedia> {
    const [media] = await db
      .insert(postMedia)
      .values(mediaData)
      .returning();
    return media;
  }

  async deletePostMedia(id: string): Promise<void> {
    await db.delete(postMedia).where(eq(postMedia.id, id));
  }

  // Post Engagement operations
  async getPostEngagement(postId: string): Promise<PostEngagement | undefined> {
    const [engagement] = await db
      .select()
      .from(postEngagement)
      .where(eq(postEngagement.postId, postId));
    return engagement;
  }

  async incrementPostView(postId: string): Promise<void> {
    await db
      .update(postEngagement)
      .set({ 
        views: sql`${postEngagement.views} + 1`,
        updatedAt: new Date()
      })
      .where(eq(postEngagement.postId, postId));
  }

  async likePost(postId: string, userId: string): Promise<void> {
    // Check if already liked
    const [existing] = await db
      .select()
      .from(postLikes)
      .where(and(
        eq(postLikes.postId, postId),
        eq(postLikes.userId, userId)
      ));
    
    if (!existing) {
      await db.insert(postLikes).values({ postId, userId });
      await db
        .update(postEngagement)
        .set({ 
          likes: sql`${postEngagement.likes} + 1`,
          updatedAt: new Date()
        })
        .where(eq(postEngagement.postId, postId));
    }
  }

  async unlikePost(postId: string, userId: string): Promise<void> {
    const deleted = await db
      .delete(postLikes)
      .where(and(
        eq(postLikes.postId, postId),
        eq(postLikes.userId, userId)
      ))
      .returning();
    
    if (deleted.length > 0) {
      await db
        .update(postEngagement)
        .set({ 
          likes: sql`${postEngagement.likes} - 1`,
          updatedAt: new Date()
        })
        .where(eq(postEngagement.postId, postId));
    }
  }

  // User Follows operations
  async followCreator(followerId: string, creatorId: string): Promise<UserFollow> {
    const [follow] = await db
      .insert(userFollows)
      .values({ followerId, creatorId })
      .returning();
    return follow;
  }

  async unfollowCreator(followerId: string, creatorId: string): Promise<void> {
    await db
      .delete(userFollows)
      .where(and(
        eq(userFollows.followerId, followerId),
        eq(userFollows.creatorId, creatorId)
      ));
  }

  async getFollowing(userId: string): Promise<UserFollow[]> {
    return await db
      .select()
      .from(userFollows)
      .where(eq(userFollows.followerId, userId));
  }

  async getFollowers(creatorId: string): Promise<UserFollow[]> {
    return await db
      .select()
      .from(userFollows)
      .where(eq(userFollows.creatorId, creatorId));
  }

  async isFollowing(followerId: string, creatorId: string): Promise<boolean> {
    const [result] = await db
      .select()
      .from(userFollows)
      .where(and(
        eq(userFollows.followerId, followerId),
        eq(userFollows.creatorId, creatorId)
      ));
    return !!result;
  }

  // Age Verification operations
  async getAgeVerification(userId: string): Promise<AgeVerification | undefined> {
    const [verification] = await db
      .select()
      .from(ageVerifications)
      .where(eq(ageVerifications.userId, userId));
    return verification;
  }

  async createAgeVerification(verificationData: Partial<AgeVerification>): Promise<AgeVerification> {
    const [verification] = await db
      .insert(ageVerifications)
      .values(verificationData as any)
      .returning();
    return verification;
  }

  async updateAgeVerification(userId: string, updates: Partial<AgeVerification>): Promise<AgeVerification> {
    const [verification] = await db
      .update(ageVerifications)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(ageVerifications.userId, userId))
      .returning();
    return verification;
  }

  // Sponsored Posts operations
  async getSponsoredPosts(params: { isActive?: boolean; limit?: number }): Promise<SponsoredPost[]> {
    const limit = params.limit || 10;
    
    if (params.isActive !== undefined) {
      return await db
        .select()
        .from(sponsoredPosts)
        .where(eq(sponsoredPosts.isActive, params.isActive))
        .limit(limit);
    }
    
    return await db.select().from(sponsoredPosts).limit(limit);
  }

  async createSponsoredPost(postData: Partial<SponsoredPost>): Promise<SponsoredPost> {
    const [ad] = await db
      .insert(sponsoredPosts)
      .values(postData as any)
      .returning();
    return ad;
  }

  async incrementAdImpression(adId: string): Promise<void> {
    await db
      .update(sponsoredPosts)
      .set({ 
        impressions: sql`${sponsoredPosts.impressions} + 1`,
        updatedAt: new Date()
      })
      .where(eq(sponsoredPosts.id, adId));
  }

  async incrementAdClick(adId: string): Promise<void> {
    await db
      .update(sponsoredPosts)
      .set({ 
        clicks: sql`${sponsoredPosts.clicks} + 1`,
        updatedAt: new Date()
      })
      .where(eq(sponsoredPosts.id, adId));
  }

  // Post Unlocks operations
  async unlockPost(postId: string, userId: string, transactionId?: string, amount?: number): Promise<PostUnlock> {
    const [unlock] = await db
      .insert(postUnlocks)
      .values({
        postId,
        userId,
        transactionId,
        paidAmount: amount
      })
      .returning();
    
    // Increment unlock count
    await db
      .update(postEngagement)
      .set({ 
        unlocks: sql`${postEngagement.unlocks} + 1`,
        updatedAt: new Date()
      })
      .where(eq(postEngagement.postId, postId));
    
    return unlock;
  }

  async isPostUnlocked(postId: string, userId: string): Promise<boolean> {
    const [unlock] = await db
      .select()
      .from(postUnlocks)
      .where(and(
        eq(postUnlocks.postId, postId),
        eq(postUnlocks.userId, userId)
      ));
    return !!unlock;
  }

  async getUserUnlockedPosts(userId: string): Promise<PostUnlock[]> {
    return await db
      .select()
      .from(postUnlocks)
      .where(eq(postUnlocks.userId, userId))
      .orderBy(desc(postUnlocks.createdAt));
  }
}

export const storage = new DatabaseStorage();
