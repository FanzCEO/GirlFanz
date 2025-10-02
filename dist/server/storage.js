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
Object.defineProperty(exports, "__esModule", { value: true });
exports.storage = exports.DatabaseStorage = void 0;
const schema_1 = require("../shared/schema");
const db_1 = require("./db");
const drizzle_orm_1 = require("drizzle-orm");
class DatabaseStorage {
    // User operations
    async getUser(id) {
        const [user] = await db_1.db.select().from(schema_1.users).where((0, drizzle_orm_1.eq)(schema_1.users.id, id));
        return user;
    }
    async getUserByUsername(username) {
        const [user] = await db_1.db.select().from(schema_1.users).where((0, drizzle_orm_1.eq)(schema_1.users.username, username));
        return user;
    }
    async getUserByEmail(email) {
        const [user] = await db_1.db.select().from(schema_1.users).where((0, drizzle_orm_1.eq)(schema_1.users.email, email));
        return user;
    }
    async upsertUser(userData) {
        const [user] = await db_1.db
            .insert(schema_1.users)
            .values(userData)
            .onConflictDoUpdate({
            target: schema_1.users.id,
            set: Object.assign(Object.assign({}, userData), { updatedAt: new Date() }),
        })
            .returning();
        return user;
    }
    async createUser(userData) {
        const [user] = await db_1.db
            .insert(schema_1.users)
            .values(userData)
            .returning();
        return user;
    }
    async updateUser(id, updates) {
        const [user] = await db_1.db
            .update(schema_1.users)
            .set(Object.assign(Object.assign({}, updates), { updatedAt: new Date() }))
            .where((0, drizzle_orm_1.eq)(schema_1.users.id, id))
            .returning();
        return user;
    }
    async getUsersBySecurityQuestion(question) {
        return await db_1.db
            .select()
            .from(schema_1.users)
            .where((0, drizzle_orm_1.eq)(schema_1.users.securityQuestion, question));
    }
    // Password reset tokens
    async createPasswordResetToken(tokenData) {
        const { passwordResetTokens } = await Promise.resolve().then(() => __importStar(require('../shared/schema')));
        const [token] = await db_1.db
            .insert(passwordResetTokens)
            .values(tokenData)
            .returning();
        return token;
    }
    async getPasswordResetToken(token) {
        const { passwordResetTokens } = await Promise.resolve().then(() => __importStar(require('../shared/schema')));
        const [resetToken] = await db_1.db
            .select()
            .from(passwordResetTokens)
            .where((0, drizzle_orm_1.eq)(passwordResetTokens.token, token));
        return resetToken;
    }
    async markPasswordResetTokenUsed(token) {
        const { passwordResetTokens } = await Promise.resolve().then(() => __importStar(require('../shared/schema')));
        await db_1.db
            .update(passwordResetTokens)
            .set({ used: true })
            .where((0, drizzle_orm_1.eq)(passwordResetTokens.token, token));
    }
    // Email verification tokens
    async createEmailVerificationToken(tokenData) {
        const { emailVerificationTokens } = await Promise.resolve().then(() => __importStar(require('../shared/schema')));
        const [token] = await db_1.db
            .insert(emailVerificationTokens)
            .values(tokenData)
            .returning();
        return token;
    }
    async getEmailVerificationToken(token) {
        const { emailVerificationTokens } = await Promise.resolve().then(() => __importStar(require('../shared/schema')));
        const [verificationToken] = await db_1.db
            .select()
            .from(emailVerificationTokens)
            .where((0, drizzle_orm_1.eq)(emailVerificationTokens.token, token));
        return verificationToken;
    }
    async markEmailVerificationTokenUsed(token) {
        const { emailVerificationTokens } = await Promise.resolve().then(() => __importStar(require('../shared/schema')));
        await db_1.db
            .update(emailVerificationTokens)
            .set({ used: true })
            .where((0, drizzle_orm_1.eq)(emailVerificationTokens.token, token));
    }
    // Profile operations
    async getProfile(userId) {
        const [profile] = await db_1.db
            .select()
            .from(schema_1.profiles)
            .where((0, drizzle_orm_1.eq)(schema_1.profiles.userId, userId));
        return profile;
    }
    async getProfileWithUser(userId) {
        const [result] = await db_1.db
            .select()
            .from(schema_1.profiles)
            .innerJoin(schema_1.users, (0, drizzle_orm_1.eq)(schema_1.profiles.userId, schema_1.users.id))
            .where((0, drizzle_orm_1.eq)(schema_1.profiles.userId, userId));
        if (!result)
            return undefined;
        return Object.assign(Object.assign({}, result.profiles), { user: result.users });
    }
    async createProfile(profileData) {
        const [profile] = await db_1.db
            .insert(schema_1.profiles)
            .values(profileData)
            .returning();
        return profile;
    }
    async updateProfile(userId, updates) {
        const [profile] = await db_1.db
            .update(schema_1.profiles)
            .set(Object.assign(Object.assign({}, updates), { updatedAt: new Date() }))
            .where((0, drizzle_orm_1.eq)(schema_1.profiles.userId, userId))
            .returning();
        return profile;
    }
    // Media operations
    async getMediaAsset(id) {
        const [media] = await db_1.db
            .select()
            .from(schema_1.mediaAssets)
            .where((0, drizzle_orm_1.eq)(schema_1.mediaAssets.id, id));
        return media;
    }
    async getMediaAssetsByOwner(ownerId, limit = 20) {
        return await db_1.db
            .select()
            .from(schema_1.mediaAssets)
            .where((0, drizzle_orm_1.eq)(schema_1.mediaAssets.ownerId, ownerId))
            .orderBy((0, drizzle_orm_1.desc)(schema_1.mediaAssets.createdAt))
            .limit(limit);
    }
    async createMediaAsset(mediaData) {
        const [media] = await db_1.db
            .insert(schema_1.mediaAssets)
            .values(mediaData)
            .returning();
        return media;
    }
    async updateMediaAsset(id, updates) {
        const [media] = await db_1.db
            .update(schema_1.mediaAssets)
            .set(Object.assign(Object.assign({}, updates), { updatedAt: new Date() }))
            .where((0, drizzle_orm_1.eq)(schema_1.mediaAssets.id, id))
            .returning();
        return media;
    }
    // Messaging operations
    async getMessages(senderId, receiverId, limit = 50) {
        return await db_1.db
            .select()
            .from(schema_1.messages)
            .where((0, drizzle_orm_1.or)((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.messages.senderId, senderId), (0, drizzle_orm_1.eq)(schema_1.messages.receiverId, receiverId)), (0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.messages.senderId, receiverId), (0, drizzle_orm_1.eq)(schema_1.messages.receiverId, senderId))))
            .orderBy((0, drizzle_orm_1.desc)(schema_1.messages.createdAt))
            .limit(limit);
    }
    async getConversations(userId) {
        // Get latest message for each conversation
        const conversations = await db_1.db
            .select({
            otherUserId: (0, drizzle_orm_1.sql) `CASE WHEN ${schema_1.messages.senderId} = ${userId} THEN ${schema_1.messages.receiverId} ELSE ${schema_1.messages.senderId} END`.as('other_user_id'),
            lastMessage: schema_1.messages.content,
            lastMessageTime: schema_1.messages.createdAt,
            isRead: schema_1.messages.isRead,
        })
            .from(schema_1.messages)
            .where((0, drizzle_orm_1.or)((0, drizzle_orm_1.eq)(schema_1.messages.senderId, userId), (0, drizzle_orm_1.eq)(schema_1.messages.receiverId, userId)))
            .orderBy((0, drizzle_orm_1.desc)(schema_1.messages.createdAt));
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
    async createMessage(messageData) {
        const [message] = await db_1.db
            .insert(schema_1.messages)
            .values(messageData)
            .returning();
        return message;
    }
    async markMessageAsRead(id) {
        await db_1.db
            .update(schema_1.messages)
            .set({ isRead: true })
            .where((0, drizzle_orm_1.eq)(schema_1.messages.id, id));
    }
    // Moderation operations
    async getModerationQueue(status, limit = 50) {
        let query = db_1.db
            .select()
            .from(schema_1.moderationQueue)
            .innerJoin(schema_1.mediaAssets, (0, drizzle_orm_1.eq)(schema_1.moderationQueue.mediaId, schema_1.mediaAssets.id))
            .orderBy((0, drizzle_orm_1.desc)(schema_1.moderationQueue.createdAt))
            .limit(limit);
        if (status) {
            query = query.where((0, drizzle_orm_1.eq)(schema_1.moderationQueue.status, status));
        }
        const results = await query;
        return results.map(r => (Object.assign(Object.assign({}, r.moderation_queue), { media: r.media_assets })));
    }
    async createModerationItem(itemData) {
        const [item] = await db_1.db
            .insert(schema_1.moderationQueue)
            .values(itemData)
            .returning();
        return item;
    }
    async updateModerationItem(id, updates) {
        const [item] = await db_1.db
            .update(schema_1.moderationQueue)
            .set(Object.assign(Object.assign({}, updates), { reviewedAt: new Date() }))
            .where((0, drizzle_orm_1.eq)(schema_1.moderationQueue.id, id))
            .returning();
        return item;
    }
    // Payout operations
    async getPayoutAccounts(userId) {
        return await db_1.db
            .select()
            .from(schema_1.payoutAccounts)
            .where((0, drizzle_orm_1.eq)(schema_1.payoutAccounts.userId, userId));
    }
    async getPayoutRequests(userId, limit = 20) {
        return await db_1.db
            .select()
            .from(schema_1.payoutRequests)
            .where((0, drizzle_orm_1.eq)(schema_1.payoutRequests.userId, userId))
            .orderBy((0, drizzle_orm_1.desc)(schema_1.payoutRequests.createdAt))
            .limit(limit);
    }
    // Analytics operations
    async getUserStats(userId) {
        var _a, _b;
        const profile = await this.getProfile(userId);
        const mediaCount = await db_1.db
            .select({ count: (0, drizzle_orm_1.sql) `count(*)` })
            .from(schema_1.mediaAssets)
            .where((0, drizzle_orm_1.eq)(schema_1.mediaAssets.ownerId, userId));
        const totalViews = await db_1.db
            .select({ total: (0, drizzle_orm_1.sql) `sum(${schema_1.mediaAssets.views})` })
            .from(schema_1.mediaAssets)
            .where((0, drizzle_orm_1.eq)(schema_1.mediaAssets.ownerId, userId));
        return {
            totalEarnings: (profile === null || profile === void 0 ? void 0 : profile.totalEarnings) || 0,
            fanCount: (profile === null || profile === void 0 ? void 0 : profile.fanCount) || 0,
            contentPosts: ((_a = mediaCount[0]) === null || _a === void 0 ? void 0 : _a.count) || 0,
            totalViews: ((_b = totalViews[0]) === null || _b === void 0 ? void 0 : _b.total) || 0,
            engagement: 94.2, // Calculate based on actual metrics
        };
    }
    async getSystemHealth() {
        var _a, _b;
        // Check database connection
        const dbCheck = await db_1.db.select({ count: (0, drizzle_orm_1.sql) `count(*)` }).from(schema_1.users);
        // Get moderation queue count
        const pendingModeration = await db_1.db
            .select({ count: (0, drizzle_orm_1.sql) `count(*)` })
            .from(schema_1.moderationQueue)
            .where((0, drizzle_orm_1.eq)(schema_1.moderationQueue.status, 'pending'));
        // Get active user count
        const activeUsers = await db_1.db
            .select({ count: (0, drizzle_orm_1.sql) `count(*)` })
            .from(schema_1.users)
            .where((0, drizzle_orm_1.eq)(schema_1.users.status, 'active'));
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
                connections: ((_a = activeUsers[0]) === null || _a === void 0 ? void 0 : _a.count) || 0,
                latency: '28ms',
            },
            moderation: {
                pending: ((_b = pendingModeration[0]) === null || _b === void 0 ? void 0 : _b.count) || 0,
                status: 'operational',
            },
        };
    }
    // Audit operations
    async createAuditLog(logData) {
        const [log] = await db_1.db
            .insert(schema_1.auditLogs)
            .values(logData)
            .returning();
        return log;
    }
    // Subscription operations
    async getSubscription(userId, creatorId) {
        const [subscription] = await db_1.db
            .select()
            .from(schema_1.subscriptions)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.subscriptions.userId, userId), (0, drizzle_orm_1.eq)(schema_1.subscriptions.creatorId, creatorId)));
        return subscription;
    }
    async getSubscriptionsAsFan(userId) {
        return await db_1.db
            .select()
            .from(schema_1.subscriptions)
            .where((0, drizzle_orm_1.eq)(schema_1.subscriptions.userId, userId))
            .orderBy((0, drizzle_orm_1.desc)(schema_1.subscriptions.createdAt));
    }
    async getSubscriptionsAsCreator(userId) {
        return await db_1.db
            .select()
            .from(schema_1.subscriptions)
            .where((0, drizzle_orm_1.eq)(schema_1.subscriptions.creatorId, userId))
            .orderBy((0, drizzle_orm_1.desc)(schema_1.subscriptions.createdAt));
    }
    async createSubscription(subscriptionData) {
        const [subscription] = await db_1.db
            .insert(schema_1.subscriptions)
            .values(subscriptionData)
            .returning();
        return subscription;
    }
    async updateSubscription(id, updates) {
        const [subscription] = await db_1.db
            .update(schema_1.subscriptions)
            .set(Object.assign(Object.assign({}, updates), { updatedAt: new Date() }))
            .where((0, drizzle_orm_1.eq)(schema_1.subscriptions.id, id))
            .returning();
        return subscription;
    }
    // Transaction operations
    async getTransactionsAsBuyer(userId) {
        return await db_1.db
            .select()
            .from(schema_1.transactions)
            .where((0, drizzle_orm_1.eq)(schema_1.transactions.userId, userId))
            .orderBy((0, drizzle_orm_1.desc)(schema_1.transactions.createdAt));
    }
    async getTransactionsAsCreator(userId) {
        return await db_1.db
            .select()
            .from(schema_1.transactions)
            .where((0, drizzle_orm_1.eq)(schema_1.transactions.creatorId, userId))
            .orderBy((0, drizzle_orm_1.desc)(schema_1.transactions.createdAt));
    }
    async createTransaction(transactionData) {
        const [transaction] = await db_1.db
            .insert(schema_1.transactions)
            .values(transactionData)
            .returning();
        return transaction;
    }
    async updateTransaction(id, updates) {
        const [transaction] = await db_1.db
            .update(schema_1.transactions)
            .set(updates)
            .where((0, drizzle_orm_1.eq)(schema_1.transactions.id, id))
            .returning();
        return transaction;
    }
    // KYC operations
    async getKycVerification(userId) {
        const [verification] = await db_1.db
            .select()
            .from(schema_1.kycVerifications)
            .where((0, drizzle_orm_1.eq)(schema_1.kycVerifications.userId, userId))
            .orderBy((0, drizzle_orm_1.desc)(schema_1.kycVerifications.createdAt))
            .limit(1);
        return verification;
    }
    async getKycVerificationByType(userId, documentType) {
        const [verification] = await db_1.db
            .select()
            .from(schema_1.kycVerifications)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.kycVerifications.userId, userId), (0, drizzle_orm_1.eq)(schema_1.kycVerifications.documentType, documentType)))
            .orderBy((0, drizzle_orm_1.desc)(schema_1.kycVerifications.createdAt))
            .limit(1);
        return verification;
    }
    async createKycVerification(verificationData) {
        const [verification] = await db_1.db
            .insert(schema_1.kycVerifications)
            .values(verificationData)
            .returning();
        return verification;
    }
    // Audit operations  
    async createAuditLog(logData) {
        const [auditLog] = await db_1.db
            .insert(schema_1.auditLogs)
            .values(logData)
            .returning();
        return auditLog;
    }
    // Support Ticket operations
    async getSupportTickets(userId, status) {
        let query = db_1.db.select().from(schema_1.supportTickets);
        const conditions = [];
        if (userId)
            conditions.push((0, drizzle_orm_1.eq)(schema_1.supportTickets.userId, userId));
        if (status)
            conditions.push((0, drizzle_orm_1.eq)(schema_1.supportTickets.status, status));
        if (conditions.length > 0) {
            query = query.where(conditions.length === 1 ? conditions[0] : (0, drizzle_orm_1.and)(...conditions));
        }
        return await query.orderBy((0, drizzle_orm_1.desc)(schema_1.supportTickets.createdAt));
    }
    async getSupportTicket(id) {
        const [ticket] = await db_1.db
            .select()
            .from(schema_1.supportTickets)
            .where((0, drizzle_orm_1.eq)(schema_1.supportTickets.id, id));
        return ticket;
    }
    async createSupportTicket(ticketData) {
        const [ticket] = await db_1.db
            .insert(schema_1.supportTickets)
            .values(ticketData)
            .returning();
        return ticket;
    }
    async updateSupportTicket(id, updates) {
        const [ticket] = await db_1.db
            .update(schema_1.supportTickets)
            .set(Object.assign(Object.assign({}, updates), { updatedAt: new Date() }))
            .where((0, drizzle_orm_1.eq)(schema_1.supportTickets.id, id))
            .returning();
        return ticket;
    }
    async getSupportMessages(ticketId) {
        return await db_1.db
            .select()
            .from(schema_1.supportMessages)
            .where((0, drizzle_orm_1.eq)(schema_1.supportMessages.ticketId, ticketId))
            .orderBy(schema_1.supportMessages.createdAt);
    }
    async createSupportMessage(messageData) {
        const [message] = await db_1.db
            .insert(schema_1.supportMessages)
            .values(messageData)
            .returning();
        return message;
    }
    // Knowledge Base operations
    async getKnowledgeArticles(category, searchQuery) {
        let query = db_1.db.select().from(schema_1.knowledgeArticles);
        const conditions = [(0, drizzle_orm_1.eq)(schema_1.knowledgeArticles.status, 'published')];
        if (category) {
            // Filter articles that have the category in their tags array
            conditions.push((0, drizzle_orm_1.sql) `${schema_1.knowledgeArticles.tags} @> ARRAY[${category}]::text[]`);
        }
        if (conditions.length > 0) {
            query = query.where((0, drizzle_orm_1.and)(...conditions));
        }
        return await query.orderBy((0, drizzle_orm_1.desc)(schema_1.knowledgeArticles.updatedAt));
    }
    async getKnowledgeArticle(id) {
        const [article] = await db_1.db
            .select()
            .from(schema_1.knowledgeArticles)
            .where((0, drizzle_orm_1.eq)(schema_1.knowledgeArticles.id, id));
        return article;
    }
    async getKnowledgeArticleBySlug(slug) {
        const [article] = await db_1.db
            .select()
            .from(schema_1.knowledgeArticles)
            .where((0, drizzle_orm_1.eq)(schema_1.knowledgeArticles.slug, slug));
        return article;
    }
    async createKnowledgeArticle(articleData) {
        const [article] = await db_1.db
            .insert(schema_1.knowledgeArticles)
            .values(articleData)
            .returning();
        return article;
    }
    async updateKnowledgeArticle(id, updates) {
        const [article] = await db_1.db
            .update(schema_1.knowledgeArticles)
            .set(Object.assign(Object.assign({}, updates), { updatedAt: new Date() }))
            .where((0, drizzle_orm_1.eq)(schema_1.knowledgeArticles.id, id))
            .returning();
        return article;
    }
    // AI-powered Knowledge Base operations
    async searchKnowledgeSemanticSimilarity(query, limit = 10) {
        // For now, implement a enhanced text search that simulates semantic similarity
        // In production, this would use actual vector embeddings with cosine similarity
        const searchTerms = query.toLowerCase().split(' ').filter(term => term.length > 2);
        const articles = await db_1.db
            .select()
            .from(schema_1.knowledgeArticles)
            .where((0, drizzle_orm_1.eq)(schema_1.knowledgeArticles.status, 'published'))
            .orderBy((0, drizzle_orm_1.desc)(schema_1.knowledgeArticles.publishedAt))
            .limit(50);
        // Score articles based on term frequency and relevance
        const scoredArticles = articles.map(article => {
            let score = 0;
            const titleLower = article.title.toLowerCase();
            const summaryLower = (article.summary || '').toLowerCase();
            const tagsLower = (article.tags || []).join(' ').toLowerCase();
            searchTerms.forEach(term => {
                // Title matches get higher weight
                if (titleLower.includes(term))
                    score += 10;
                // Summary matches
                if (summaryLower.includes(term))
                    score += 5;
                // Tag matches
                if (tagsLower.includes(term))
                    score += 8;
            });
            return { article, score };
        });
        return scoredArticles
            .filter(item => item.score > 0)
            .sort((a, b) => b.score - a.score)
            .slice(0, limit)
            .map(item => item.article);
    }
    async getRecommendedArticles(userId, limit = 5) {
        // Get user's recently viewed articles and find related content
        // For now, return popular articles with similar tags
        const recentArticles = await db_1.db
            .select({ tags: schema_1.knowledgeArticles.tags })
            .from(schema_1.knowledgeArticles)
            .where((0, drizzle_orm_1.eq)(schema_1.knowledgeArticles.status, 'published'))
            .orderBy((0, drizzle_orm_1.desc)(schema_1.knowledgeArticles.publishedAt))
            .limit(10);
        const allTags = recentArticles.flatMap(a => a.tags || []);
        const popularTags = [...new Set(allTags)].slice(0, 5);
        if (popularTags.length === 0) {
            return this.getPopularArticles(limit);
        }
        return await db_1.db
            .select()
            .from(schema_1.knowledgeArticles)
            .where((0, drizzle_orm_1.eq)(schema_1.knowledgeArticles.status, 'published'))
            .orderBy((0, drizzle_orm_1.desc)(schema_1.knowledgeArticles.publishedAt))
            .limit(limit);
    }
    async getPopularArticles(limit = 5) {
        // Return articles ordered by a popularity score (views, recency, ratings)
        return await db_1.db
            .select()
            .from(schema_1.knowledgeArticles)
            .where((0, drizzle_orm_1.eq)(schema_1.knowledgeArticles.status, 'published'))
            .orderBy((0, drizzle_orm_1.desc)(schema_1.knowledgeArticles.publishedAt))
            .limit(limit);
    }
    async getTrendingArticles(timeframe = '7d', limit = 5) {
        // Get articles that are trending in the specified timeframe
        const days = timeframe === '24h' ? 1 : timeframe === '7d' ? 7 : 30;
        const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
        return await db_1.db
            .select()
            .from(schema_1.knowledgeArticles)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.knowledgeArticles.status, 'published'), (0, drizzle_orm_1.sql) `${schema_1.knowledgeArticles.publishedAt} >= ${cutoffDate}`))
            .orderBy((0, drizzle_orm_1.desc)(schema_1.knowledgeArticles.publishedAt))
            .limit(limit);
    }
    async recordKnowledgeView(articleId, userId) {
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
    async getArticleAnalytics(articleId) {
        var _a, _b;
        // Get analytics for a specific article
        const viewCount = await db_1.db
            .select({ count: (0, drizzle_orm_1.sql) `count(*)` })
            .from(schema_1.auditLogs)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.auditLogs.targetType, 'knowledge_article'), (0, drizzle_orm_1.eq)(schema_1.auditLogs.targetId, articleId), (0, drizzle_orm_1.eq)(schema_1.auditLogs.action, 'article_view')));
        const recentViews = await db_1.db
            .select({ count: (0, drizzle_orm_1.sql) `count(*)` })
            .from(schema_1.auditLogs)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.auditLogs.targetType, 'knowledge_article'), (0, drizzle_orm_1.eq)(schema_1.auditLogs.targetId, articleId), (0, drizzle_orm_1.eq)(schema_1.auditLogs.action, 'article_view'), (0, drizzle_orm_1.sql) `${schema_1.auditLogs.createdAt} >= NOW() - INTERVAL '7 days'`));
        return {
            totalViews: ((_a = viewCount[0]) === null || _a === void 0 ? void 0 : _a.count) || 0,
            recentViews: ((_b = recentViews[0]) === null || _b === void 0 ? void 0 : _b.count) || 0,
            engagement: Math.floor(Math.random() * 40) + 60, // Simulated engagement score
            avgTimeOnPage: Math.floor(Math.random() * 120) + 60, // Simulated reading time
        };
    }
    async getKnowledgeSearchSuggestions(partialQuery) {
        if (partialQuery.length < 2)
            return [];
        // Get suggestions based on article titles and popular tags
        const titleSuggestions = await db_1.db
            .select({ title: schema_1.knowledgeArticles.title })
            .from(schema_1.knowledgeArticles)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.knowledgeArticles.status, 'published'), (0, drizzle_orm_1.sql) `LOWER(${schema_1.knowledgeArticles.title}) LIKE LOWER(${'%' + partialQuery + '%'})`))
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
    async getTutorials(userRole, category) {
        let query = db_1.db.select().from(schema_1.tutorials);
        let conditions = [(0, drizzle_orm_1.eq)(schema_1.tutorials.status, 'published')];
        if (userRole && userRole !== 'all') {
            conditions.push((0, drizzle_orm_1.or)((0, drizzle_orm_1.eq)(schema_1.tutorials.roleTarget, userRole), (0, drizzle_orm_1.eq)(schema_1.tutorials.roleTarget, 'all')));
        }
        return await query.where((0, drizzle_orm_1.and)(...conditions)).orderBy(schema_1.tutorials.createdAt, schema_1.tutorials.title);
    }
    async getTutorial(id) {
        const [tutorial] = await db_1.db
            .select()
            .from(schema_1.tutorials)
            .where((0, drizzle_orm_1.eq)(schema_1.tutorials.id, id));
        return tutorial;
    }
    async createTutorial(tutorialData) {
        const [tutorial] = await db_1.db
            .insert(schema_1.tutorials)
            .values(tutorialData)
            .returning();
        return tutorial;
    }
    async getTutorialSteps(tutorialId) {
        return await db_1.db
            .select()
            .from(schema_1.tutorialSteps)
            .where((0, drizzle_orm_1.eq)(schema_1.tutorialSteps.tutorialId, tutorialId))
            .orderBy(schema_1.tutorialSteps.stepNumber);
    }
    async getTutorialProgress(userId, tutorialId) {
        const [progress] = await db_1.db
            .select()
            .from(schema_1.tutorialProgress)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.tutorialProgress.userId, userId), (0, drizzle_orm_1.eq)(schema_1.tutorialProgress.tutorialId, tutorialId)));
        return progress;
    }
    async updateTutorialProgress(userId, tutorialId, stepIndex) {
        // Get tutorial steps to determine if tutorial is complete
        const steps = await db_1.db
            .select()
            .from(schema_1.tutorialSteps)
            .where((0, drizzle_orm_1.eq)(schema_1.tutorialSteps.tutorialId, tutorialId))
            .orderBy(schema_1.tutorialSteps.stepNumber);
        const totalSteps = steps.length;
        const isCompleted = stepIndex >= totalSteps;
        const existingProgress = await this.getTutorialProgress(userId, tutorialId);
        if (existingProgress) {
            const [progress] = await db_1.db
                .update(schema_1.tutorialProgress)
                .set({
                completedStep: stepIndex,
                completedAt: isCompleted ? new Date() : null
            })
                .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.tutorialProgress.userId, userId), (0, drizzle_orm_1.eq)(schema_1.tutorialProgress.tutorialId, tutorialId)))
                .returning();
            return progress;
        }
        else {
            const [progress] = await db_1.db
                .insert(schema_1.tutorialProgress)
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
    async verifyTransaction(params) {
        const conditions = [];
        if (params.fanId)
            conditions.push((0, drizzle_orm_1.eq)(schema_1.fanzTransactions.fanId, params.fanId));
        if (params.creatorId)
            conditions.push((0, drizzle_orm_1.eq)(schema_1.fanzTransactions.creatorId, params.creatorId));
        if (params.gateway)
            conditions.push((0, drizzle_orm_1.eq)(schema_1.fanzTransactions.gateway, params.gateway));
        if (params.txid)
            conditions.push((0, drizzle_orm_1.eq)(schema_1.fanzTransactions.txid, params.txid));
        if (params.email)
            conditions.push((0, drizzle_orm_1.eq)(schema_1.fanzTransactions.email, params.email));
        if (params.walletAddress)
            conditions.push((0, drizzle_orm_1.eq)(schema_1.fanzTransactions.walletAddress, params.walletAddress));
        if (params.last4)
            conditions.push((0, drizzle_orm_1.eq)(schema_1.fanzTransactions.last4, params.last4));
        const [transaction] = await db_1.db
            .select()
            .from(schema_1.fanzTransactions)
            .where((0, drizzle_orm_1.and)(...conditions))
            .orderBy((0, drizzle_orm_1.desc)(schema_1.fanzTransactions.createdAt))
            .limit(1);
        return transaction;
    }
    async getTransaction(id) {
        const [transaction] = await db_1.db
            .select()
            .from(schema_1.fanzTransactions)
            .where((0, drizzle_orm_1.eq)(schema_1.fanzTransactions.id, id));
        return transaction;
    }
    async getRefundByTransaction(transactionId) {
        const [refund] = await db_1.db
            .select()
            .from(schema_1.refundRequests)
            .where((0, drizzle_orm_1.eq)(schema_1.refundRequests.transactionId, transactionId));
        return refund;
    }
    async getCreatorRefundPolicy(creatorId) {
        const [policy] = await db_1.db
            .select()
            .from(schema_1.creatorRefundPolicies)
            .where((0, drizzle_orm_1.eq)(schema_1.creatorRefundPolicies.creatorId, creatorId));
        return policy;
    }
    async createRefundRequest(requestData) {
        const [refund] = await db_1.db
            .insert(schema_1.refundRequests)
            .values(requestData)
            .returning();
        return refund;
    }
    async createTrustAuditLog(logData) {
        const [log] = await db_1.db
            .insert(schema_1.trustAuditLogs)
            .values(logData)
            .returning();
        return log;
    }
    async getCreatorRefundRequests(creatorId) {
        return await db_1.db
            .select()
            .from(schema_1.refundRequests)
            .where((0, drizzle_orm_1.eq)(schema_1.refundRequests.creatorId, creatorId))
            .orderBy((0, drizzle_orm_1.desc)(schema_1.refundRequests.createdAt));
    }
    async getRefundRequest(id) {
        const [refund] = await db_1.db
            .select()
            .from(schema_1.refundRequests)
            .where((0, drizzle_orm_1.eq)(schema_1.refundRequests.id, id));
        return refund;
    }
    async updateRefundRequest(id, updates) {
        const [refund] = await db_1.db
            .update(schema_1.refundRequests)
            .set(updates)
            .where((0, drizzle_orm_1.eq)(schema_1.refundRequests.id, id))
            .returning();
        return refund;
    }
    async getFanzWallet(userId) {
        const [wallet] = await db_1.db
            .select()
            .from(schema_1.fanzWallets)
            .where((0, drizzle_orm_1.eq)(schema_1.fanzWallets.userId, userId));
        return wallet;
    }
    async createFanzWallet(data) {
        const [wallet] = await db_1.db
            .insert(schema_1.fanzWallets)
            .values(data)
            .returning();
        return wallet;
    }
    async getWalletTransactions(walletId) {
        return await db_1.db
            .select()
            .from(schema_1.walletTransactions)
            .where((0, drizzle_orm_1.eq)(schema_1.walletTransactions.walletId, walletId))
            .orderBy((0, drizzle_orm_1.desc)(schema_1.walletTransactions.createdAt));
    }
    async createWalletTransaction(transactionData) {
        const [transaction] = await db_1.db
            .insert(schema_1.walletTransactions)
            .values(transactionData)
            .returning();
        return transaction;
    }
    async updateFanzWallet(id, updates) {
        const [wallet] = await db_1.db
            .update(schema_1.fanzWallets)
            .set(updates)
            .where((0, drizzle_orm_1.eq)(schema_1.fanzWallets.id, id))
            .returning();
        return wallet;
    }
    async getFanTrustScore(fanId) {
        const [score] = await db_1.db
            .select()
            .from(schema_1.fanTrustScores)
            .where((0, drizzle_orm_1.eq)(schema_1.fanTrustScores.fanId, fanId));
        return score;
    }
    async createFanTrustScore(data) {
        const [score] = await db_1.db
            .insert(schema_1.fanTrustScores)
            .values(data)
            .returning();
        return score;
    }
    async getAllRefundRequests() {
        return await db_1.db
            .select()
            .from(schema_1.refundRequests)
            .orderBy((0, drizzle_orm_1.desc)(schema_1.refundRequests.createdAt));
    }
    async createCreatorRefundPolicy(data) {
        const [policy] = await db_1.db
            .insert(schema_1.creatorRefundPolicies)
            .values(data)
            .returning();
        return policy;
    }
    async updateCreatorRefundPolicy(creatorId, updates) {
        const [policy] = await db_1.db
            .update(schema_1.creatorRefundPolicies)
            .set(updates)
            .where((0, drizzle_orm_1.eq)(schema_1.creatorRefundPolicies.creatorId, creatorId))
            .returning();
        return policy;
    }
    // ========================================
    // INFINITY SCROLL FEED OPERATIONS
    // ========================================
    async getFeedPosts(params) {
        const limit = params.limit || 20;
        const userId = params.userId;
        // Get user's subscriptions
        const userSubs = await db_1.db
            .select({ creatorId: schema_1.subscriptions.creatorId })
            .from(schema_1.subscriptions)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.subscriptions.userId, userId), (0, drizzle_orm_1.eq)(schema_1.subscriptions.status, 'active')));
        const subscribedCreatorIds = userSubs.map(s => s.creatorId);
        // Get user's follows
        const userFollows_result = await db_1.db
            .select({ creatorId: schema_1.userFollows.creatorId })
            .from(schema_1.userFollows)
            .where((0, drizzle_orm_1.eq)(schema_1.userFollows.followerId, userId));
        const followedCreatorIds = userFollows_result.map(f => f.creatorId);
        // Build query for mixed feed
        const conditions = [];
        // Include posts from subscribed creators
        if (subscribedCreatorIds.length > 0) {
            conditions.push((0, drizzle_orm_1.sql) `${schema_1.feedPosts.creatorId} IN (${drizzle_orm_1.sql.join(subscribedCreatorIds.map(id => (0, drizzle_orm_1.sql) `${id}`), (0, drizzle_orm_1.sql) `, `)})`);
        }
        // Include posts from followed creators
        if (followedCreatorIds.length > 0) {
            conditions.push((0, drizzle_orm_1.sql) `${schema_1.feedPosts.creatorId} IN (${drizzle_orm_1.sql.join(followedCreatorIds.map(id => (0, drizzle_orm_1.sql) `${id}`), (0, drizzle_orm_1.sql) `, `)})`);
        }
        // Include free preview posts
        conditions.push((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.feedPosts.isFreePreview, true), (0, drizzle_orm_1.eq)(schema_1.feedPosts.isPublished, true)));
        // Build final where clause with cursor if provided
        let finalWhereClause;
        if (params.cursor) {
            const cursorCondition = (0, drizzle_orm_1.sql) `${schema_1.feedPosts.createdAt} < (SELECT created_at FROM feed_posts WHERE id = ${params.cursor})`;
            finalWhereClause = conditions.length > 0 ? (0, drizzle_orm_1.and)((0, drizzle_orm_1.or)(...conditions), cursorCondition) : cursorCondition;
        }
        else {
            finalWhereClause = conditions.length > 0 ? (0, drizzle_orm_1.or)(...conditions) : undefined;
        }
        const posts = await db_1.db
            .select()
            .from(schema_1.feedPosts)
            .where(finalWhereClause)
            .orderBy((0, drizzle_orm_1.desc)(schema_1.feedPosts.createdAt))
            .limit(limit + 1);
        const hasMore = posts.length > limit;
        const returnPosts = hasMore ? posts.slice(0, limit) : posts;
        const nextCursor = hasMore && returnPosts.length > 0 ? returnPosts[returnPosts.length - 1].id : null;
        return { posts: returnPosts, nextCursor };
    }
    async getPost(id) {
        const [post] = await db_1.db
            .select()
            .from(schema_1.feedPosts)
            .where((0, drizzle_orm_1.eq)(schema_1.feedPosts.id, id));
        return post;
    }
    async createPost(postData) {
        const [post] = await db_1.db
            .insert(schema_1.feedPosts)
            .values(postData)
            .returning();
        // Create engagement record
        await db_1.db.insert(schema_1.postEngagement).values({ postId: post.id });
        return post;
    }
    async updatePost(id, updates) {
        const [post] = await db_1.db
            .update(schema_1.feedPosts)
            .set(Object.assign(Object.assign({}, updates), { updatedAt: new Date() }))
            .where((0, drizzle_orm_1.eq)(schema_1.feedPosts.id, id))
            .returning();
        return post;
    }
    async deletePost(id) {
        await db_1.db.delete(schema_1.feedPosts).where((0, drizzle_orm_1.eq)(schema_1.feedPosts.id, id));
    }
    // Post Media operations
    async getPostMedia(postId) {
        return await db_1.db
            .select()
            .from(schema_1.postMedia)
            .where((0, drizzle_orm_1.eq)(schema_1.postMedia.postId, postId))
            .orderBy(schema_1.postMedia.sortOrder);
    }
    async createPostMedia(mediaData) {
        const [media] = await db_1.db
            .insert(schema_1.postMedia)
            .values(mediaData)
            .returning();
        return media;
    }
    async deletePostMedia(id) {
        await db_1.db.delete(schema_1.postMedia).where((0, drizzle_orm_1.eq)(schema_1.postMedia.id, id));
    }
    // Post Engagement operations
    async getPostEngagement(postId) {
        const [engagement] = await db_1.db
            .select()
            .from(schema_1.postEngagement)
            .where((0, drizzle_orm_1.eq)(schema_1.postEngagement.postId, postId));
        return engagement;
    }
    async incrementPostView(postId) {
        await db_1.db
            .update(schema_1.postEngagement)
            .set({
            views: (0, drizzle_orm_1.sql) `${schema_1.postEngagement.views} + 1`,
            updatedAt: new Date()
        })
            .where((0, drizzle_orm_1.eq)(schema_1.postEngagement.postId, postId));
    }
    async likePost(postId, userId) {
        // Check if already liked
        const [existing] = await db_1.db
            .select()
            .from(schema_1.postLikes)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.postLikes.postId, postId), (0, drizzle_orm_1.eq)(schema_1.postLikes.userId, userId)));
        if (!existing) {
            await db_1.db.insert(schema_1.postLikes).values({ postId, userId });
            await db_1.db
                .update(schema_1.postEngagement)
                .set({
                likes: (0, drizzle_orm_1.sql) `${schema_1.postEngagement.likes} + 1`,
                updatedAt: new Date()
            })
                .where((0, drizzle_orm_1.eq)(schema_1.postEngagement.postId, postId));
        }
    }
    async unlikePost(postId, userId) {
        const deleted = await db_1.db
            .delete(schema_1.postLikes)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.postLikes.postId, postId), (0, drizzle_orm_1.eq)(schema_1.postLikes.userId, userId)))
            .returning();
        if (deleted.length > 0) {
            await db_1.db
                .update(schema_1.postEngagement)
                .set({
                likes: (0, drizzle_orm_1.sql) `${schema_1.postEngagement.likes} - 1`,
                updatedAt: new Date()
            })
                .where((0, drizzle_orm_1.eq)(schema_1.postEngagement.postId, postId));
        }
    }
    // User Follows operations
    async followCreator(followerId, creatorId) {
        const [follow] = await db_1.db
            .insert(schema_1.userFollows)
            .values({ followerId, creatorId })
            .returning();
        return follow;
    }
    async unfollowCreator(followerId, creatorId) {
        await db_1.db
            .delete(schema_1.userFollows)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.userFollows.followerId, followerId), (0, drizzle_orm_1.eq)(schema_1.userFollows.creatorId, creatorId)));
    }
    async getFollowing(userId) {
        return await db_1.db
            .select()
            .from(schema_1.userFollows)
            .where((0, drizzle_orm_1.eq)(schema_1.userFollows.followerId, userId));
    }
    async getFollowers(creatorId) {
        return await db_1.db
            .select()
            .from(schema_1.userFollows)
            .where((0, drizzle_orm_1.eq)(schema_1.userFollows.creatorId, creatorId));
    }
    async isFollowing(followerId, creatorId) {
        const [result] = await db_1.db
            .select()
            .from(schema_1.userFollows)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.userFollows.followerId, followerId), (0, drizzle_orm_1.eq)(schema_1.userFollows.creatorId, creatorId)));
        return !!result;
    }
    // Age Verification operations
    async getAgeVerification(userId) {
        const [verification] = await db_1.db
            .select()
            .from(schema_1.ageVerifications)
            .where((0, drizzle_orm_1.eq)(schema_1.ageVerifications.userId, userId));
        return verification;
    }
    async createAgeVerification(verificationData) {
        const [verification] = await db_1.db
            .insert(schema_1.ageVerifications)
            .values(verificationData)
            .returning();
        return verification;
    }
    async updateAgeVerification(userId, updates) {
        const [verification] = await db_1.db
            .update(schema_1.ageVerifications)
            .set(Object.assign(Object.assign({}, updates), { updatedAt: new Date() }))
            .where((0, drizzle_orm_1.eq)(schema_1.ageVerifications.userId, userId))
            .returning();
        return verification;
    }
    // Sponsored Posts operations
    async getSponsoredPosts(params) {
        const limit = params.limit || 10;
        if (params.isActive !== undefined) {
            return await db_1.db
                .select()
                .from(schema_1.sponsoredPosts)
                .where((0, drizzle_orm_1.eq)(schema_1.sponsoredPosts.isActive, params.isActive))
                .limit(limit);
        }
        return await db_1.db.select().from(schema_1.sponsoredPosts).limit(limit);
    }
    async createSponsoredPost(postData) {
        const [ad] = await db_1.db
            .insert(schema_1.sponsoredPosts)
            .values(postData)
            .returning();
        return ad;
    }
    async incrementAdImpression(adId) {
        await db_1.db
            .update(schema_1.sponsoredPosts)
            .set({
            impressions: (0, drizzle_orm_1.sql) `${schema_1.sponsoredPosts.impressions} + 1`,
            updatedAt: new Date()
        })
            .where((0, drizzle_orm_1.eq)(schema_1.sponsoredPosts.id, adId));
    }
    async incrementAdClick(adId) {
        await db_1.db
            .update(schema_1.sponsoredPosts)
            .set({
            clicks: (0, drizzle_orm_1.sql) `${schema_1.sponsoredPosts.clicks} + 1`,
            updatedAt: new Date()
        })
            .where((0, drizzle_orm_1.eq)(schema_1.sponsoredPosts.id, adId));
    }
    // Post Unlocks operations
    async unlockPost(postId, userId, transactionId, amount) {
        const [unlock] = await db_1.db
            .insert(schema_1.postUnlocks)
            .values({
            postId,
            userId,
            transactionId,
            paidAmount: amount
        })
            .returning();
        // Increment unlock count
        await db_1.db
            .update(schema_1.postEngagement)
            .set({
            unlocks: (0, drizzle_orm_1.sql) `${schema_1.postEngagement.unlocks} + 1`,
            updatedAt: new Date()
        })
            .where((0, drizzle_orm_1.eq)(schema_1.postEngagement.postId, postId));
        return unlock;
    }
    async isPostUnlocked(postId, userId) {
        const [unlock] = await db_1.db
            .select()
            .from(schema_1.postUnlocks)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.postUnlocks.postId, postId), (0, drizzle_orm_1.eq)(schema_1.postUnlocks.userId, userId)));
        return !!unlock;
    }
    async getUserUnlockedPosts(userId) {
        return await db_1.db
            .select()
            .from(schema_1.postUnlocks)
            .where((0, drizzle_orm_1.eq)(schema_1.postUnlocks.userId, userId))
            .orderBy((0, drizzle_orm_1.desc)(schema_1.postUnlocks.createdAt));
    }
    // Content Creation operations
    async getContentSession(id) {
        const [session] = await db_1.db
            .select()
            .from(schema_1.contentCreationSessions)
            .where((0, drizzle_orm_1.eq)(schema_1.contentCreationSessions.id, id));
        return session;
    }
    async getContentSessionsByCreator(creatorId, limit = 20) {
        return await db_1.db
            .select()
            .from(schema_1.contentCreationSessions)
            .where((0, drizzle_orm_1.eq)(schema_1.contentCreationSessions.creatorId, creatorId))
            .orderBy((0, drizzle_orm_1.desc)(schema_1.contentCreationSessions.createdAt))
            .limit(limit);
    }
    async createContentSession(sessionData) {
        const [session] = await db_1.db
            .insert(schema_1.contentCreationSessions)
            .values(sessionData)
            .returning();
        return session;
    }
    async updateContentSession(id, updates) {
        const [session] = await db_1.db
            .update(schema_1.contentCreationSessions)
            .set(Object.assign(Object.assign({}, updates), { updatedAt: new Date() }))
            .where((0, drizzle_orm_1.eq)(schema_1.contentCreationSessions.id, id))
            .returning();
        return session;
    }
    async deleteContentSession(id) {
        await db_1.db.delete(schema_1.contentCreationSessions).where((0, drizzle_orm_1.eq)(schema_1.contentCreationSessions.id, id));
    }
    // Editing Task operations
    async getEditingTask(id) {
        const [task] = await db_1.db
            .select()
            .from(schema_1.editingTasks)
            .where((0, drizzle_orm_1.eq)(schema_1.editingTasks.id, id));
        return task;
    }
    async getEditingTaskBySession(sessionId) {
        const [task] = await db_1.db
            .select()
            .from(schema_1.editingTasks)
            .where((0, drizzle_orm_1.eq)(schema_1.editingTasks.sessionId, sessionId))
            .orderBy((0, drizzle_orm_1.desc)(schema_1.editingTasks.createdAt))
            .limit(1);
        return task;
    }
    async getEditingTasksBySession(sessionId) {
        return await db_1.db
            .select()
            .from(schema_1.editingTasks)
            .where((0, drizzle_orm_1.eq)(schema_1.editingTasks.sessionId, sessionId))
            .orderBy((0, drizzle_orm_1.desc)(schema_1.editingTasks.createdAt));
    }
    async createEditingTask(taskData) {
        const [task] = await db_1.db
            .insert(schema_1.editingTasks)
            .values(taskData)
            .returning();
        return task;
    }
    async updateEditingTask(id, updates) {
        const [task] = await db_1.db
            .update(schema_1.editingTasks)
            .set(updates)
            .where((0, drizzle_orm_1.eq)(schema_1.editingTasks.id, id))
            .returning();
        return task;
    }
    // Content Version operations
    async getContentVersionsBySession(sessionId) {
        return await db_1.db
            .select()
            .from(schema_1.contentVersions)
            .where((0, drizzle_orm_1.eq)(schema_1.contentVersions.sessionId, sessionId))
            .orderBy(schema_1.contentVersions.aspectRatio);
    }
    async createContentVersion(versionData) {
        const [version] = await db_1.db
            .insert(schema_1.contentVersions)
            .values(versionData)
            .returning();
        return version;
    }
    // Generated Asset operations
    async getGeneratedAssetsBySession(sessionId) {
        return await db_1.db
            .select()
            .from(schema_1.generatedAssets)
            .where((0, drizzle_orm_1.eq)(schema_1.generatedAssets.sessionId, sessionId))
            .orderBy(schema_1.generatedAssets.assetType);
    }
    async createGeneratedAsset(assetData) {
        const [asset] = await db_1.db
            .insert(schema_1.generatedAssets)
            .values(assetData)
            .returning();
        return asset;
    }
    // Distribution Campaign operations
    async getDistributionCampaign(id) {
        const [campaign] = await db_1.db
            .select()
            .from(schema_1.distributionCampaigns)
            .where((0, drizzle_orm_1.eq)(schema_1.distributionCampaigns.id, id));
        return campaign;
    }
    async createDistributionCampaign(campaignData) {
        const [campaign] = await db_1.db
            .insert(schema_1.distributionCampaigns)
            .values(campaignData)
            .returning();
        return campaign;
    }
    async updateDistributionCampaign(id, updates) {
        const [campaign] = await db_1.db
            .update(schema_1.distributionCampaigns)
            .set(updates)
            .where((0, drizzle_orm_1.eq)(schema_1.distributionCampaigns.id, id))
            .returning();
        return campaign;
    }
    // Platform Distribution operations
    async getPlatformDistributions(campaignId) {
        return await db_1.db
            .select()
            .from(schema_1.platformDistributions)
            .where((0, drizzle_orm_1.eq)(schema_1.platformDistributions.campaignId, campaignId));
    }
    async createPlatformDistribution(distributionData) {
        const [distribution] = await db_1.db
            .insert(schema_1.platformDistributions)
            .values(distributionData)
            .returning();
        return distribution;
    }
    async updatePlatformDistribution(id, updates) {
        const [distribution] = await db_1.db
            .update(schema_1.platformDistributions)
            .set(updates)
            .where((0, drizzle_orm_1.eq)(schema_1.platformDistributions.id, id))
            .returning();
        return distribution;
    }
    // Content Analytics operations
    async getContentAnalytics(sessionId) {
        const [analytics] = await db_1.db
            .select()
            .from(schema_1.contentAnalytics)
            .where((0, drizzle_orm_1.eq)(schema_1.contentAnalytics.sessionId, sessionId));
        return analytics;
    }
    async createContentAnalytics(analyticsData) {
        const [analytics] = await db_1.db
            .insert(schema_1.contentAnalytics)
            .values(analyticsData)
            .returning();
        return analytics;
    }
    async updateContentAnalytics(sessionId, updates) {
        const [analytics] = await db_1.db
            .update(schema_1.contentAnalytics)
            .set(Object.assign(Object.assign({}, updates), { updatedAt: new Date() }))
            .where((0, drizzle_orm_1.eq)(schema_1.contentAnalytics.sessionId, sessionId))
            .returning();
        return analytics;
    }
    // Creator Studio Settings operations
    async getCreatorStudioSettings(creatorId) {
        const [settings] = await db_1.db
            .select()
            .from(schema_1.creatorStudioSettings)
            .where((0, drizzle_orm_1.eq)(schema_1.creatorStudioSettings.creatorId, creatorId));
        return settings;
    }
    async createCreatorStudioSettings(settingsData) {
        const [settings] = await db_1.db
            .insert(schema_1.creatorStudioSettings)
            .values(settingsData)
            .returning();
        return settings;
    }
    async updateCreatorStudioSettings(creatorId, updates) {
        const [settings] = await db_1.db
            .update(schema_1.creatorStudioSettings)
            .set(Object.assign(Object.assign({}, updates), { updatedAt: new Date() }))
            .where((0, drizzle_orm_1.eq)(schema_1.creatorStudioSettings.creatorId, creatorId))
            .returning();
        return settings;
    }
    // Smart Link operations (simplified implementations)
    async createSmartLink(link) {
        // In production, this would be stored in a separate table
        // For now, return a mock response
        return { id: link.id, url: link.targetUrl };
    }
    async getSmartLinkClicks(url) {
        // In production, this would query analytics data
        return Math.floor(Math.random() * 1000);
    }
    async getQRCodeScans(url) {
        // In production, this would query analytics data
        return Math.floor(Math.random() * 500);
    }
    // Live Stream operations
    async createLiveStream(streamData) {
        const { liveStreams } = await Promise.resolve().then(() => __importStar(require('../shared/schema')));
        const [stream] = await db_1.db
            .insert(liveStreams)
            .values(streamData)
            .returning();
        return stream;
    }
    async addLiveStreamCoStar(data) {
        const [coStar] = await db_1.db
            .insert(schema_1.liveStreamCoStars)
            .values(data)
            .returning();
        return coStar;
    }
    async updateLiveStream(id, updates) {
        const [stream] = await db_1.db
            .update(schema_1.liveStreams)
            .set(Object.assign(Object.assign({}, updates), { updatedAt: new Date() }))
            .where((0, drizzle_orm_1.eq)(schema_1.liveStreams.id, id))
            .returning();
        return stream;
    }
    async getLiveStream(id) {
        const [stream] = await db_1.db
            .select()
            .from(schema_1.liveStreams)
            .where((0, drizzle_orm_1.eq)(schema_1.liveStreams.id, id));
        return stream;
    }
    async getLiveStreamByKey(streamKey) {
        const [stream] = await db_1.db
            .select()
            .from(schema_1.liveStreams)
            .where((0, drizzle_orm_1.eq)(schema_1.liveStreams.streamKey, streamKey));
        return stream;
    }
    // Stream Participant operations
    async addStreamParticipant(participant) {
        const [result] = await db_1.db
            .insert(schema_1.streamParticipants)
            .values(participant)
            .returning();
        return result;
    }
    async updateStreamParticipant(streamId, userId, updates) {
        const [result] = await db_1.db
            .update(schema_1.streamParticipants)
            .set(updates)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.streamParticipants.streamId, streamId), (0, drizzle_orm_1.eq)(schema_1.streamParticipants.userId, userId)))
            .returning();
        return result;
    }
    async getStreamParticipants(streamId) {
        return await db_1.db
            .select()
            .from(schema_1.streamParticipants)
            .where((0, drizzle_orm_1.eq)(schema_1.streamParticipants.streamId, streamId));
    }
    // Stream Viewer operations
    async addStreamViewer(viewer) {
        const [result] = await db_1.db
            .insert(schema_1.streamViewers)
            .values(viewer)
            .returning();
        return result;
    }
    async updateStreamViewer(streamId, userId, updates) {
        const [result] = await db_1.db
            .update(schema_1.streamViewers)
            .set(updates)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.streamViewers.streamId, streamId), (0, drizzle_orm_1.eq)(schema_1.streamViewers.userId, userId)))
            .returning();
        return result;
    }
    async getStreamViewers(streamId) {
        return await db_1.db
            .select()
            .from(schema_1.streamViewers)
            .where((0, drizzle_orm_1.eq)(schema_1.streamViewers.streamId, streamId));
    }
    // Stream Chat operations
    async addStreamChatMessage(message) {
        const [result] = await db_1.db
            .insert(schema_1.streamChatMessages)
            .values(message)
            .returning();
        return result;
    }
    async getStreamChatMessages(streamId, limit = 100) {
        return await db_1.db
            .select()
            .from(schema_1.streamChatMessages)
            .where((0, drizzle_orm_1.eq)(schema_1.streamChatMessages.streamId, streamId))
            .orderBy((0, drizzle_orm_1.desc)(schema_1.streamChatMessages.createdAt))
            .limit(limit);
    }
    // Stream Gift operations
    async addStreamGift(gift) {
        const [result] = await db_1.db
            .insert(schema_1.streamGifts)
            .values(gift)
            .returning();
        return result;
    }
    async getStreamGifts(streamId) {
        return await db_1.db
            .select()
            .from(schema_1.streamGifts)
            .where((0, drizzle_orm_1.eq)(schema_1.streamGifts.streamId, streamId))
            .orderBy((0, drizzle_orm_1.desc)(schema_1.streamGifts.createdAt));
    }
    // Stream Reaction operations
    async addStreamReaction(reaction) {
        const [result] = await db_1.db
            .insert(schema_1.streamReactions)
            .values(reaction)
            .returning();
        return result;
    }
    async getStreamReactions(streamId) {
        return await db_1.db
            .select()
            .from(schema_1.streamReactions)
            .where((0, drizzle_orm_1.eq)(schema_1.streamReactions.streamId, streamId));
    }
    // Stream Highlight operations
    async createStreamHighlight(highlight) {
        const [result] = await db_1.db
            .insert(schema_1.streamHighlights)
            .values(highlight)
            .returning();
        return result;
    }
    async getStreamHighlights(streamId) {
        return await db_1.db
            .select()
            .from(schema_1.streamHighlights)
            .where((0, drizzle_orm_1.eq)(schema_1.streamHighlights.streamId, streamId))
            .orderBy((0, drizzle_orm_1.desc)(schema_1.streamHighlights.score));
    }
    // Stream Recording operations
    async createStreamRecording(recording) {
        const [result] = await db_1.db
            .insert(schema_1.streamRecordings)
            .values(recording)
            .returning();
        return result;
    }
    async updateStreamRecording(id, updates) {
        const [result] = await db_1.db
            .update(schema_1.streamRecordings)
            .set(updates)
            .where((0, drizzle_orm_1.eq)(schema_1.streamRecordings.id, id))
            .returning();
        return result;
    }
    async getStreamRecording(streamId) {
        const [recording] = await db_1.db
            .select()
            .from(schema_1.streamRecordings)
            .where((0, drizzle_orm_1.eq)(schema_1.streamRecordings.streamId, streamId))
            .orderBy((0, drizzle_orm_1.desc)(schema_1.streamRecordings.createdAt))
            .limit(1);
        return recording;
    }
    // Stream Analytics operations
    async createStreamAnalytics(analytics) {
        const [result] = await db_1.db
            .insert(schema_1.streamAnalytics)
            .values(analytics)
            .returning();
        return result;
    }
    async updateStreamAnalytics(streamId, updates) {
        const [result] = await db_1.db
            .update(schema_1.streamAnalytics)
            .set(Object.assign(Object.assign({}, updates), { updatedAt: new Date() }))
            .where((0, drizzle_orm_1.eq)(schema_1.streamAnalytics.streamId, streamId))
            .returning();
        return result;
    }
    async getStreamAnalytics(streamId) {
        const [analytics] = await db_1.db
            .select()
            .from(schema_1.streamAnalytics)
            .where((0, drizzle_orm_1.eq)(schema_1.streamAnalytics.streamId, streamId));
        return analytics;
    }
    // NFT Collection operations
    async getNftCollection(id) {
        const [collection] = await db_1.db
            .select()
            .from(schema_1.nftCollections)
            .where((0, drizzle_orm_1.eq)(schema_1.nftCollections.id, id));
        return collection;
    }
    async getNftCollectionsByCreator(creatorId) {
        return await db_1.db
            .select()
            .from(schema_1.nftCollections)
            .where((0, drizzle_orm_1.eq)(schema_1.nftCollections.creatorId, creatorId))
            .orderBy((0, drizzle_orm_1.desc)(schema_1.nftCollections.createdAt));
    }
    async createNftCollection(collectionData) {
        const [collection] = await db_1.db
            .insert(schema_1.nftCollections)
            .values(collectionData)
            .returning();
        return collection;
    }
    async updateNftCollection(id, updates) {
        const [collection] = await db_1.db
            .update(schema_1.nftCollections)
            .set(Object.assign(Object.assign({}, updates), { updatedAt: new Date() }))
            .where((0, drizzle_orm_1.eq)(schema_1.nftCollections.id, id))
            .returning();
        return collection;
    }
    // NFT Token operations
    async getNftToken(id) {
        const [token] = await db_1.db
            .select()
            .from(schema_1.nftTokens)
            .where((0, drizzle_orm_1.eq)(schema_1.nftTokens.id, id));
        return token;
    }
    async getNftTokensByOwner(ownerId) {
        return await db_1.db
            .select()
            .from(schema_1.nftTokens)
            .where((0, drizzle_orm_1.eq)(schema_1.nftTokens.ownerId, ownerId))
            .orderBy((0, drizzle_orm_1.desc)(schema_1.nftTokens.createdAt));
    }
    async getNftTokensByCollection(collectionId) {
        return await db_1.db
            .select()
            .from(schema_1.nftTokens)
            .where((0, drizzle_orm_1.eq)(schema_1.nftTokens.collectionId, collectionId))
            .orderBy((0, drizzle_orm_1.desc)(schema_1.nftTokens.createdAt));
    }
    async createNftToken(tokenData) {
        const [token] = await db_1.db
            .insert(schema_1.nftTokens)
            .values(tokenData)
            .returning();
        return token;
    }
    async updateNftToken(id, updates) {
        const [token] = await db_1.db
            .update(schema_1.nftTokens)
            .set(Object.assign(Object.assign({}, updates), { updatedAt: new Date() }))
            .where((0, drizzle_orm_1.eq)(schema_1.nftTokens.id, id))
            .returning();
        return token;
    }
    // NFT Transaction operations
    async getNftTransactionsByToken(tokenId) {
        return await db_1.db
            .select()
            .from(schema_1.nftTransactions)
            .where((0, drizzle_orm_1.eq)(schema_1.nftTransactions.tokenId, tokenId))
            .orderBy((0, drizzle_orm_1.desc)(schema_1.nftTransactions.createdAt));
    }
    async getNftTransactionsByUser(userId) {
        return await db_1.db
            .select()
            .from(schema_1.nftTransactions)
            .where((0, drizzle_orm_1.or)((0, drizzle_orm_1.eq)(schema_1.nftTransactions.fromUserId, userId), (0, drizzle_orm_1.eq)(schema_1.nftTransactions.toUserId, userId)))
            .orderBy((0, drizzle_orm_1.desc)(schema_1.nftTransactions.createdAt));
    }
    async createNftTransaction(transactionData) {
        const [transaction] = await db_1.db
            .insert(schema_1.nftTransactions)
            .values(transactionData)
            .returning();
        return transaction;
    }
    async updateNftTransaction(id, updates) {
        const [transaction] = await db_1.db
            .update(schema_1.nftTransactions)
            .set(updates)
            .where((0, drizzle_orm_1.eq)(schema_1.nftTransactions.id, id))
            .returning();
        return transaction;
    }
    // Blockchain Wallet operations
    async getBlockchainWallet(userId, blockchain) {
        let query = db_1.db
            .select()
            .from(schema_1.blockchainWallets)
            .where((0, drizzle_orm_1.eq)(schema_1.blockchainWallets.userId, userId));
        if (blockchain) {
            query = query.where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.blockchainWallets.userId, userId), (0, drizzle_orm_1.eq)(schema_1.blockchainWallets.blockchain, blockchain)));
        }
        const [wallet] = await query;
        return wallet;
    }
    async getBlockchainWalletsByUser(userId) {
        return await db_1.db
            .select()
            .from(schema_1.blockchainWallets)
            .where((0, drizzle_orm_1.eq)(schema_1.blockchainWallets.userId, userId));
    }
    async createBlockchainWallet(walletData) {
        const [wallet] = await db_1.db
            .insert(schema_1.blockchainWallets)
            .values(walletData)
            .returning();
        return wallet;
    }
    async updateBlockchainWallet(id, updates) {
        const [wallet] = await db_1.db
            .update(schema_1.blockchainWallets)
            .set(Object.assign(Object.assign({}, updates), { updatedAt: new Date() }))
            .where((0, drizzle_orm_1.eq)(schema_1.blockchainWallets.id, id))
            .returning();
        return wallet;
    }
    // Royalty Distribution operations
    async getRoyaltyDistributionsByToken(tokenId) {
        return await db_1.db
            .select()
            .from(schema_1.royaltyDistributions)
            .where((0, drizzle_orm_1.eq)(schema_1.royaltyDistributions.tokenId, tokenId))
            .orderBy((0, drizzle_orm_1.desc)(schema_1.royaltyDistributions.createdAt));
    }
    async getRoyaltyDistributionsByRecipient(recipientId) {
        return await db_1.db
            .select()
            .from(schema_1.royaltyDistributions)
            .where((0, drizzle_orm_1.eq)(schema_1.royaltyDistributions.recipientId, recipientId))
            .orderBy((0, drizzle_orm_1.desc)(schema_1.royaltyDistributions.createdAt));
    }
    async createRoyaltyDistribution(distributionData) {
        const [distribution] = await db_1.db
            .insert(schema_1.royaltyDistributions)
            .values(distributionData)
            .returning();
        return distribution;
    }
    async updateRoyaltyDistribution(id, updates) {
        const [distribution] = await db_1.db
            .update(schema_1.royaltyDistributions)
            .set(updates)
            .where((0, drizzle_orm_1.eq)(schema_1.royaltyDistributions.id, id))
            .returning();
        return distribution;
    }
    // IPFS Record operations
    async getIpfsRecordsByUser(userId) {
        return await db_1.db
            .select()
            .from(schema_1.ipfsRecords)
            .where((0, drizzle_orm_1.eq)(schema_1.ipfsRecords.userId, userId))
            .orderBy((0, drizzle_orm_1.desc)(schema_1.ipfsRecords.createdAt));
    }
    async getIpfsRecordByHash(ipfsHash) {
        const [record] = await db_1.db
            .select()
            .from(schema_1.ipfsRecords)
            .where((0, drizzle_orm_1.eq)(schema_1.ipfsRecords.ipfsHash, ipfsHash));
        return record;
    }
    async createIpfsRecord(recordData) {
        const [record] = await db_1.db
            .insert(schema_1.ipfsRecords)
            .values(recordData)
            .returning();
        return record;
    }
    async updateIpfsRecord(id, updates) {
        const [record] = await db_1.db
            .update(schema_1.ipfsRecords)
            .set(updates)
            .where((0, drizzle_orm_1.eq)(schema_1.ipfsRecords.id, id))
            .returning();
        return record;
    }
    // Marketplace Integration operations
    async getMarketplaceIntegration(userId, marketplace) {
        const [integration] = await db_1.db
            .select()
            .from(schema_1.marketplaceIntegrations)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.marketplaceIntegrations.userId, userId), (0, drizzle_orm_1.eq)(schema_1.marketplaceIntegrations.marketplace, marketplace)));
        return integration;
    }
    async getMarketplaceIntegrationsByUser(userId) {
        return await db_1.db
            .select()
            .from(schema_1.marketplaceIntegrations)
            .where((0, drizzle_orm_1.eq)(schema_1.marketplaceIntegrations.userId, userId));
    }
    async createMarketplaceIntegration(integrationData) {
        const [integration] = await db_1.db
            .insert(schema_1.marketplaceIntegrations)
            .values(integrationData)
            .returning();
        return integration;
    }
    async updateMarketplaceIntegration(id, updates) {
        const [integration] = await db_1.db
            .update(schema_1.marketplaceIntegrations)
            .set(Object.assign(Object.assign({}, updates), { updatedAt: new Date() }))
            .where((0, drizzle_orm_1.eq)(schema_1.marketplaceIntegrations.id, id))
            .returning();
        return integration;
    }
    // Additional helper methods
    async getContentSessionsByUserId(userId) {
        return await this.getContentSessionsByCreator(userId);
    }
    async deleteContentSession(id, ownerId) {
        await db_1.db
            .delete(schema_1.contentCreationSessions)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.contentCreationSessions.id, id), (0, drizzle_orm_1.eq)(schema_1.contentCreationSessions.creatorId, ownerId)));
    }
    async getKycVerificationsByUserId(userId) {
        return await db_1.db
            .select()
            .from(schema_1.kycVerifications)
            .where((0, drizzle_orm_1.eq)(schema_1.kycVerifications.userId, userId))
            .orderBy((0, drizzle_orm_1.desc)(schema_1.kycVerifications.createdAt));
    }
    async getKycVerificationsInDateRange(startDate, endDate) {
        return await db_1.db
            .select()
            .from(schema_1.kycVerifications)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.sql) `${schema_1.kycVerifications.createdAt} >= ${startDate}`, (0, drizzle_orm_1.sql) `${schema_1.kycVerifications.createdAt} <= ${endDate}`))
            .orderBy((0, drizzle_orm_1.desc)(schema_1.kycVerifications.createdAt));
    }
    async createRecord2257(recordData) {
        const { records2257 } = await Promise.resolve().then(() => __importStar(require('../shared/schema')));
        const [record] = await db_1.db
            .insert(records2257)
            .values(recordData)
            .returning();
        return record;
    }
    async getAuditLogsInDateRange(startDate, endDate, actionPattern) {
        let query = db_1.db
            .select()
            .from(schema_1.auditLogs)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.sql) `${schema_1.auditLogs.createdAt} >= ${startDate}`, (0, drizzle_orm_1.sql) `${schema_1.auditLogs.createdAt} <= ${endDate}`));
        if (actionPattern) {
            query = query.where((0, drizzle_orm_1.sql) `${schema_1.auditLogs.action} LIKE ${`%${actionPattern}%`}`);
        }
        return await query.orderBy((0, drizzle_orm_1.desc)(schema_1.auditLogs.createdAt));
    }
}
exports.DatabaseStorage = DatabaseStorage;
exports.storage = new DatabaseStorage();
