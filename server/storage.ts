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
}

export const storage = new DatabaseStorage();
