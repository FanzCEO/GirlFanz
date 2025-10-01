"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.postUnlocks = exports.postLikes = exports.sponsoredPosts = exports.ageVerifications = exports.userFollows = exports.postEngagement = exports.postMedia = exports.feedPosts = exports.contentRatingEnum = exports.postVisibilityEnum = exports.postTypeEnum = exports.tutorialProgress = exports.tutorialSteps = exports.tutorials = exports.knowledgeEmbeddings = exports.knowledgeArticles = exports.supportMessages = exports.supportTickets = exports.auditLogs = exports.messages = exports.transactions = exports.subscriptions = exports.webhooks = exports.payoutRequests = exports.payoutAccounts = exports.moderationQueue = exports.records2257 = exports.kycVerifications = exports.mediaAssets = exports.profiles = exports.emailVerificationTokens = exports.passwordResetTokens = exports.users = exports.aspectRatioEnum = exports.socialPlatformEnum = exports.distributionStatusEnum = exports.editingStatusEnum = exports.contentTypeEnum = exports.contentStatusEnum = exports.paymentProviderEnum = exports.transactionStatusEnum = exports.subscriptionStatusEnum = exports.moderationStatusEnum = exports.payoutStatusEnum = exports.mediaStatusEnum = exports.kycStatusEnum = exports.authProviderEnum = exports.userStatusEnum = exports.userRoleEnum = exports.sessions = void 0;
exports.generatedAssets = exports.contentAnalytics = exports.platformDistributions = exports.distributionCampaigns = exports.contentVersions = exports.editingTasks = exports.contentCreationSessions = exports.creatorRefundPolicies = exports.trustAuditLogs = exports.fanTrustScores = exports.walletTransactions = exports.fanzCards = exports.fanzWallets = exports.refundRequests = exports.fanzTransactions = exports.trustScoreEnum = exports.refundStatusEnum = exports.paymentGatewayEnum = exports.insertTutorialSchema = exports.insertKnowledgeArticleSchema = exports.insertSupportMessageSchema = exports.insertSupportTicketSchema = exports.insertTransactionSchema = exports.insertSubscriptionSchema = exports.insertMessageSchema = exports.insertMediaAssetSchema = exports.insertProfileSchema = exports.insertUserSchema = exports.messagesRelations = exports.transactionsRelations = exports.subscriptionsRelations = exports.moderationQueueRelations = exports.mediaAssetsRelations = exports.profilesRelations = exports.usersRelations = exports.streamAnalytics = exports.streamViewers = exports.streamRecordings = exports.streamHighlights = exports.streamReactions = exports.streamGifts = exports.streamChatMessages = exports.streamParticipants = exports.vrContent = exports.contentInteractions = exports.userPreferences = exports.streamViews = exports.liveStreams = exports.commentLikes = exports.postComments = void 0;
exports.transactionResponseSchema = exports.trustScoreResponseSchema = exports.walletResponseSchema = exports.insertContentAnalyticsSchema = exports.insertGeneratedAssetSchema = exports.insertCreatorStudioSettingsSchema = exports.insertPlatformDistributionSchema = exports.insertDistributionCampaignSchema = exports.insertContentVersionSchema = exports.insertEditingTaskSchema = exports.insertContentCreationSessionSchema = exports.insertVrContentSchema = exports.insertContentInteractionSchema = exports.insertUserPreferencesSchema = exports.insertLiveStreamSchema = exports.insertPostCommentSchema = exports.insertAgeVerificationSchema = exports.insertUserFollowSchema = exports.insertSponsoredPostSchema = exports.insertPostMediaSchema = exports.insertFeedPostSchema = exports.insertWalletTransactionSchema = exports.insertFanzWalletSchema = exports.insertRefundRequestSchema = exports.insertFanzTransactionSchema = exports.liveStreamCoStars = exports.creatorStudioSettings = void 0;
const drizzle_orm_1 = require("drizzle-orm");
const drizzle_orm_2 = require("drizzle-orm");
const pg_core_1 = require("drizzle-orm/pg-core");
const drizzle_zod_1 = require("drizzle-zod");
const zod_1 = require("zod");
// Session storage table (required for Replit Auth)
exports.sessions = (0, pg_core_1.pgTable)("sessions", {
    sid: (0, pg_core_1.varchar)("sid").primaryKey(),
    sess: (0, pg_core_1.jsonb)("sess").notNull(),
    expire: (0, pg_core_1.timestamp)("expire").notNull(),
}, (table) => [(0, pg_core_1.index)("IDX_session_expire").on(table.expire)]);
// Enums
exports.userRoleEnum = (0, pg_core_1.pgEnum)("user_role", ["fan", "creator", "admin", "support"]);
exports.userStatusEnum = (0, pg_core_1.pgEnum)("user_status", ["active", "suspended", "banned"]);
exports.authProviderEnum = (0, pg_core_1.pgEnum)("auth_provider", ["replit", "local"]);
exports.kycStatusEnum = (0, pg_core_1.pgEnum)("kyc_status", ["pending", "verified", "rejected"]);
exports.mediaStatusEnum = (0, pg_core_1.pgEnum)("media_status", ["pending", "approved", "rejected"]);
exports.payoutStatusEnum = (0, pg_core_1.pgEnum)("payout_status", ["pending", "processing", "completed", "failed"]);
exports.moderationStatusEnum = (0, pg_core_1.pgEnum)("moderation_status", ["pending", "approved", "rejected", "flagged"]);
exports.subscriptionStatusEnum = (0, pg_core_1.pgEnum)("subscription_status", ["active", "cancelled", "expired", "suspended"]);
exports.transactionStatusEnum = (0, pg_core_1.pgEnum)("transaction_status", ["pending", "completed", "failed", "refunded", "chargeback"]);
exports.paymentProviderEnum = (0, pg_core_1.pgEnum)("payment_provider", ["ccbill", "segpay", "stripe"]);
exports.contentStatusEnum = (0, pg_core_1.pgEnum)("content_status", ["draft", "processing", "ready", "published", "archived"]);
exports.contentTypeEnum = (0, pg_core_1.pgEnum)("content_type", ["video", "image", "live_stream", "audio", "gif"]);
exports.editingStatusEnum = (0, pg_core_1.pgEnum)("editing_status", ["pending", "processing", "completed", "failed"]);
exports.distributionStatusEnum = (0, pg_core_1.pgEnum)("distribution_status", ["scheduled", "publishing", "published", "failed", "cancelled"]);
exports.socialPlatformEnum = (0, pg_core_1.pgEnum)("social_platform", ["instagram", "tiktok", "twitter", "snapchat", "youtube"]);
exports.aspectRatioEnum = (0, pg_core_1.pgEnum)("aspect_ratio", ["9:16", "16:9", "1:1", "4:5"]);
// User storage table
exports.users = (0, pg_core_1.pgTable)("users", {
    id: (0, pg_core_1.varchar)("id").primaryKey().default((0, drizzle_orm_1.sql) `gen_random_uuid()`),
    email: (0, pg_core_1.varchar)("email").unique().notNull(),
    firstName: (0, pg_core_1.varchar)("first_name"),
    lastName: (0, pg_core_1.varchar)("last_name"),
    profileImageUrl: (0, pg_core_1.varchar)("profile_image_url"),
    username: (0, pg_core_1.varchar)("username").unique(),
    password: (0, pg_core_1.varchar)("password").notNull(), // Bcrypt hashed password
    role: (0, exports.userRoleEnum)("role").default("fan"),
    status: (0, exports.userStatusEnum)("status").default("active"),
    authProvider: (0, exports.authProviderEnum)("auth_provider").default("local"),
    isCreator: (0, pg_core_1.boolean)("is_creator").default(false),
    ageVerified: (0, pg_core_1.boolean)("age_verified").default(false),
    emailVerified: (0, pg_core_1.boolean)("email_verified").default(false),
    securityQuestion: (0, pg_core_1.varchar)("security_question"), // For email recovery
    securityAnswer: (0, pg_core_1.varchar)("security_answer"), // Hashed answer
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)("updated_at").defaultNow(),
});
// Password reset tokens
exports.passwordResetTokens = (0, pg_core_1.pgTable)("password_reset_tokens", {
    id: (0, pg_core_1.varchar)("id").primaryKey().default((0, drizzle_orm_1.sql) `gen_random_uuid()`),
    userId: (0, pg_core_1.varchar)("user_id").references(() => exports.users.id, { onDelete: "cascade" }).notNull(),
    token: (0, pg_core_1.varchar)("token").notNull().unique(),
    expiresAt: (0, pg_core_1.timestamp)("expires_at").notNull(),
    used: (0, pg_core_1.boolean)("used").default(false),
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow(),
});
// Email verification tokens
exports.emailVerificationTokens = (0, pg_core_1.pgTable)("email_verification_tokens", {
    id: (0, pg_core_1.varchar)("id").primaryKey().default((0, drizzle_orm_1.sql) `gen_random_uuid()`),
    userId: (0, pg_core_1.varchar)("user_id").references(() => exports.users.id, { onDelete: "cascade" }).notNull(),
    token: (0, pg_core_1.varchar)("token").notNull().unique(),
    expiresAt: (0, pg_core_1.timestamp)("expires_at").notNull(),
    used: (0, pg_core_1.boolean)("used").default(false),
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow(),
});
// Creator/Fan profiles
exports.profiles = (0, pg_core_1.pgTable)("profiles", {
    id: (0, pg_core_1.varchar)("id").primaryKey().default((0, drizzle_orm_1.sql) `gen_random_uuid()`),
    userId: (0, pg_core_1.varchar)("user_id").references(() => exports.users.id, { onDelete: "cascade" }).notNull(),
    displayName: (0, pg_core_1.varchar)("display_name"),
    bio: (0, pg_core_1.text)("bio"),
    avatarUrl: (0, pg_core_1.varchar)("avatar_url"),
    bannerUrl: (0, pg_core_1.varchar)("banner_url"),
    pronouns: (0, pg_core_1.varchar)("pronouns"),
    niches: (0, pg_core_1.text)("niches").array(),
    interests: (0, pg_core_1.text)("interests").array(),
    kycStatus: (0, exports.kycStatusEnum)("kyc_status").default("pending"),
    ageVerified: (0, pg_core_1.boolean)("age_verified").default(false),
    subscriptionPrice: (0, pg_core_1.integer)("subscription_price"), // in cents
    totalEarnings: (0, pg_core_1.integer)("total_earnings").default(0),
    fanCount: (0, pg_core_1.integer)("fan_count").default(0),
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)("updated_at").defaultNow(),
});
// Media assets (content management)
exports.mediaAssets = (0, pg_core_1.pgTable)("media_assets", {
    id: (0, pg_core_1.varchar)("id").primaryKey().default((0, drizzle_orm_1.sql) `gen_random_uuid()`),
    ownerId: (0, pg_core_1.varchar)("owner_id").references(() => exports.users.id, { onDelete: "cascade" }).notNull(),
    title: (0, pg_core_1.varchar)("title"),
    description: (0, pg_core_1.text)("description"),
    filename: (0, pg_core_1.varchar)("filename").notNull(),
    s3Key: (0, pg_core_1.varchar)("s3_key").notNull(),
    mimeType: (0, pg_core_1.varchar)("mime_type").notNull(),
    fileSize: (0, pg_core_1.integer)("file_size"),
    status: (0, exports.mediaStatusEnum)("status").default("pending"),
    isPublic: (0, pg_core_1.boolean)("is_public").default(false),
    price: (0, pg_core_1.integer)("price"), // in cents, null for free content
    forensicSignature: (0, pg_core_1.varchar)("forensic_signature"),
    views: (0, pg_core_1.integer)("views").default(0),
    likes: (0, pg_core_1.integer)("likes").default(0),
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)("updated_at").defaultNow(),
});
// KYC Verifications (compliance)
exports.kycVerifications = (0, pg_core_1.pgTable)("kyc_verifications", {
    id: (0, pg_core_1.varchar)("id").primaryKey().default((0, drizzle_orm_1.sql) `gen_random_uuid()`),
    userId: (0, pg_core_1.varchar)("user_id").references(() => exports.users.id, { onDelete: "cascade" }).notNull(),
    provider: (0, pg_core_1.varchar)("provider").notNull(),
    status: (0, exports.kycStatusEnum)("status").default("pending"),
    documentType: (0, pg_core_1.varchar)("document_type"),
    dataJson: (0, pg_core_1.jsonb)("data_json"),
    verifiedAt: (0, pg_core_1.timestamp)("verified_at"),
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow(),
});
// 2257 Records (adult industry compliance)
exports.records2257 = (0, pg_core_1.pgTable)("records_2257", {
    id: (0, pg_core_1.varchar)("id").primaryKey().default((0, drizzle_orm_1.sql) `gen_random_uuid()`),
    userId: (0, pg_core_1.varchar)("user_id").references(() => exports.users.id, { onDelete: "cascade" }).notNull(),
    docType: (0, pg_core_1.varchar)("doc_type").notNull(),
    s3Key: (0, pg_core_1.varchar)("s3_key").notNull(),
    checksum: (0, pg_core_1.varchar)("checksum").notNull(),
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow(),
});
// Moderation Queue
exports.moderationQueue = (0, pg_core_1.pgTable)("moderation_queue", {
    id: (0, pg_core_1.varchar)("id").primaryKey().default((0, drizzle_orm_1.sql) `gen_random_uuid()`),
    mediaId: (0, pg_core_1.varchar)("media_id").references(() => exports.mediaAssets.id, { onDelete: "cascade" }).notNull(),
    status: (0, exports.moderationStatusEnum)("status").default("pending"),
    reviewerId: (0, pg_core_1.varchar)("reviewer_id").references(() => exports.users.id),
    notes: (0, pg_core_1.text)("notes"),
    priority: (0, pg_core_1.integer)("priority").default(1),
    aiConfidence: (0, pg_core_1.integer)("ai_confidence"), // 0-100
    reportCount: (0, pg_core_1.integer)("report_count").default(0),
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow(),
    reviewedAt: (0, pg_core_1.timestamp)("reviewed_at"),
});
// Payout Accounts (adult-friendly providers only)
exports.payoutAccounts = (0, pg_core_1.pgTable)("payout_accounts", {
    id: (0, pg_core_1.varchar)("id").primaryKey().default((0, drizzle_orm_1.sql) `gen_random_uuid()`),
    userId: (0, pg_core_1.varchar)("user_id").references(() => exports.users.id, { onDelete: "cascade" }).notNull(),
    provider: (0, pg_core_1.varchar)("provider").notNull(), // Paxum, ePayService, etc.
    accountRef: (0, pg_core_1.varchar)("account_ref").notNull(),
    status: (0, pg_core_1.varchar)("status").default("active"),
    isDefault: (0, pg_core_1.boolean)("is_default").default(false),
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow(),
});
// Payout Requests
exports.payoutRequests = (0, pg_core_1.pgTable)("payout_requests", {
    id: (0, pg_core_1.varchar)("id").primaryKey().default((0, drizzle_orm_1.sql) `gen_random_uuid()`),
    userId: (0, pg_core_1.varchar)("user_id").references(() => exports.users.id, { onDelete: "cascade" }).notNull(),
    accountId: (0, pg_core_1.varchar)("account_id").references(() => exports.payoutAccounts.id).notNull(),
    amountCents: (0, pg_core_1.integer)("amount_cents").notNull(),
    currency: (0, pg_core_1.varchar)("currency").default("USD"),
    status: (0, exports.payoutStatusEnum)("status").default("pending"),
    providerRef: (0, pg_core_1.varchar)("provider_ref"),
    processingFee: (0, pg_core_1.integer)("processing_fee"),
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow(),
    processedAt: (0, pg_core_1.timestamp)("processed_at"),
});
// Webhooks (payment notifications)
exports.webhooks = (0, pg_core_1.pgTable)("webhooks", {
    id: (0, pg_core_1.varchar)("id").primaryKey().default((0, drizzle_orm_1.sql) `gen_random_uuid()`),
    userId: (0, pg_core_1.varchar)("user_id").references(() => exports.users.id, { onDelete: "cascade" }).notNull(),
    url: (0, pg_core_1.varchar)("url").notNull(),
    secret: (0, pg_core_1.varchar)("secret").notNull(),
    eventsJson: (0, pg_core_1.jsonb)("events_json"),
    status: (0, pg_core_1.varchar)("status").default("active"),
    lastPing: (0, pg_core_1.timestamp)("last_ping"),
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow(),
});
// Subscriptions (for creator tiers, content access)
exports.subscriptions = (0, pg_core_1.pgTable)("subscriptions", {
    id: (0, pg_core_1.varchar)("id").primaryKey().default((0, drizzle_orm_1.sql) `gen_random_uuid()`),
    userId: (0, pg_core_1.varchar)("user_id").references(() => exports.users.id, { onDelete: "cascade" }).notNull(),
    creatorId: (0, pg_core_1.varchar)("creator_id").references(() => exports.users.id, { onDelete: "cascade" }).notNull(),
    provider: (0, exports.paymentProviderEnum)("provider").notNull(),
    providerSubscriptionId: (0, pg_core_1.varchar)("provider_subscription_id").unique(),
    status: (0, exports.subscriptionStatusEnum)("status").default("active"),
    pricePerMonth: (0, pg_core_1.integer)("price_per_month").notNull(), // in cents
    currency: (0, pg_core_1.varchar)("currency").default("USD"),
    billingCycle: (0, pg_core_1.varchar)("billing_cycle").default("monthly"),
    nextBillingDate: (0, pg_core_1.timestamp)("next_billing_date"),
    cancelledAt: (0, pg_core_1.timestamp)("cancelled_at"),
    expiredAt: (0, pg_core_1.timestamp)("expired_at"),
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)("updated_at").defaultNow(),
});
// Transactions (one-time purchases, tips, subscription payments)  
exports.transactions = (0, pg_core_1.pgTable)("transactions", {
    id: (0, pg_core_1.varchar)("id").primaryKey().default((0, drizzle_orm_1.sql) `gen_random_uuid()`),
    userId: (0, pg_core_1.varchar)("user_id").references(() => exports.users.id, { onDelete: "cascade" }).notNull(),
    creatorId: (0, pg_core_1.varchar)("creator_id").references(() => exports.users.id, { onDelete: "cascade" }),
    mediaId: (0, pg_core_1.varchar)("media_id").references(() => exports.mediaAssets.id),
    subscriptionId: (0, pg_core_1.varchar)("subscription_id").references(() => exports.subscriptions.id),
    provider: (0, exports.paymentProviderEnum)("provider").notNull(),
    providerTransactionId: (0, pg_core_1.varchar)("provider_transaction_id").unique(),
    type: (0, pg_core_1.varchar)("type").notNull(), // subscription, purchase, tip, refund
    status: (0, exports.transactionStatusEnum)("status").default("pending"),
    amountCents: (0, pg_core_1.integer)("amount_cents").notNull(),
    currency: (0, pg_core_1.varchar)("currency").default("USD"),
    providerFee: (0, pg_core_1.integer)("provider_fee"),
    platformFee: (0, pg_core_1.integer)("platform_fee"),
    creatorEarnings: (0, pg_core_1.integer)("creator_earnings"),
    metadata: (0, pg_core_1.jsonb)("metadata"), // provider-specific data
    ipAddress: (0, pg_core_1.varchar)("ip_address"),
    userAgent: (0, pg_core_1.varchar)("user_agent"),
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow(),
    processedAt: (0, pg_core_1.timestamp)("processed_at"),
});
// Messages
exports.messages = (0, pg_core_1.pgTable)("messages", {
    id: (0, pg_core_1.varchar)("id").primaryKey().default((0, drizzle_orm_1.sql) `gen_random_uuid()`),
    senderId: (0, pg_core_1.varchar)("sender_id").references(() => exports.users.id, { onDelete: "cascade" }).notNull(),
    receiverId: (0, pg_core_1.varchar)("receiver_id").references(() => exports.users.id, { onDelete: "cascade" }).notNull(),
    content: (0, pg_core_1.text)("content").notNull(),
    mediaUrl: (0, pg_core_1.varchar)("media_url"),
    isRead: (0, pg_core_1.boolean)("is_read").default(false),
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow(),
});
// Audit Logs (compliance tracking)
exports.auditLogs = (0, pg_core_1.pgTable)("audit_logs", {
    id: (0, pg_core_1.varchar)("id").primaryKey().default((0, drizzle_orm_1.sql) `gen_random_uuid()`),
    actorId: (0, pg_core_1.varchar)("actor_id").references(() => exports.users.id),
    action: (0, pg_core_1.varchar)("action").notNull(),
    targetType: (0, pg_core_1.varchar)("target_type").notNull(),
    targetId: (0, pg_core_1.varchar)("target_id"),
    metadata: (0, pg_core_1.jsonb)("metadata"),
    ipAddress: (0, pg_core_1.varchar)("ip_address"),
    userAgent: (0, pg_core_1.varchar)("user_agent"),
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow(),
});
// Support Tickets System
exports.supportTickets = (0, pg_core_1.pgTable)("support_tickets", {
    id: (0, pg_core_1.varchar)("id").primaryKey().default((0, drizzle_orm_1.sql) `gen_random_uuid()`),
    userId: (0, pg_core_1.varchar)("user_id").references(() => exports.users.id, { onDelete: "cascade" }).notNull(),
    subject: (0, pg_core_1.varchar)("subject", { length: 255 }).notNull(),
    category: (0, pg_core_1.varchar)("category").notNull().default("tech"), // tech, billing, moderation, feature, other
    priority: (0, pg_core_1.varchar)("priority").notNull().default("normal"), // low, normal, high, critical
    status: (0, pg_core_1.varchar)("status").notNull().default("open"), // open, in_progress, resolved, closed
    assignedTo: (0, pg_core_1.varchar)("assigned_to").references(() => exports.users.id),
    source: (0, pg_core_1.varchar)("source").notNull().default("web"), // web, ws, email
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)("updated_at").defaultNow(),
});
exports.supportMessages = (0, pg_core_1.pgTable)("support_messages", {
    id: (0, pg_core_1.varchar)("id").primaryKey().default((0, drizzle_orm_1.sql) `gen_random_uuid()`),
    ticketId: (0, pg_core_1.varchar)("ticket_id").references(() => exports.supportTickets.id, { onDelete: "cascade" }).notNull(),
    senderId: (0, pg_core_1.varchar)("sender_id").references(() => exports.users.id, { onDelete: "cascade" }).notNull(),
    body: (0, pg_core_1.text)("body").notNull(),
    attachments: (0, pg_core_1.text)("attachments").array(),
    isInternalNote: (0, pg_core_1.boolean)("is_internal_note").default(false),
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow(),
});
// Knowledge Base / AI Wiki
exports.knowledgeArticles = (0, pg_core_1.pgTable)("knowledge_articles", {
    id: (0, pg_core_1.varchar)("id").primaryKey().default((0, drizzle_orm_1.sql) `gen_random_uuid()`),
    title: (0, pg_core_1.varchar)("title", { length: 255 }).notNull(),
    slug: (0, pg_core_1.varchar)("slug", { length: 255 }).notNull().unique(),
    summary: (0, pg_core_1.text)("summary"),
    content: (0, pg_core_1.text)("content").notNull(),
    tags: (0, pg_core_1.text)("tags").array(),
    status: (0, pg_core_1.varchar)("status").notNull().default("draft"), // draft, published, archived
    createdBy: (0, pg_core_1.varchar)("created_by").references(() => exports.users.id, { onDelete: "cascade" }).notNull(),
    updatedBy: (0, pg_core_1.varchar)("updated_by").references(() => exports.users.id),
    publishedAt: (0, pg_core_1.timestamp)("published_at"),
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)("updated_at").defaultNow(),
});
exports.knowledgeEmbeddings = (0, pg_core_1.pgTable)("knowledge_embeddings", {
    id: (0, pg_core_1.varchar)("id").primaryKey().default((0, drizzle_orm_1.sql) `gen_random_uuid()`),
    articleId: (0, pg_core_1.varchar)("article_id").references(() => exports.knowledgeArticles.id, { onDelete: "cascade" }).notNull(),
    embedding: (0, pg_core_1.text)("embedding").notNull(), // JSON string of vector embedding
    chunkIndex: (0, pg_core_1.integer)("chunk_index").notNull(),
    chunkContent: (0, pg_core_1.text)("chunk_content").notNull(),
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow(),
});
// Tutorials System
exports.tutorials = (0, pg_core_1.pgTable)("tutorials", {
    id: (0, pg_core_1.varchar)("id").primaryKey().default((0, drizzle_orm_1.sql) `gen_random_uuid()`),
    title: (0, pg_core_1.varchar)("title", { length: 255 }).notNull(),
    roleTarget: (0, pg_core_1.varchar)("role_target").notNull().default("all"), // fan, creator, admin, all
    difficulty: (0, pg_core_1.varchar)("difficulty").notNull().default("beginner"), // beginner, intermediate, advanced
    estimatedMinutes: (0, pg_core_1.integer)("estimated_minutes").default(10),
    coverImageUrl: (0, pg_core_1.varchar)("cover_image_url"),
    summary: (0, pg_core_1.text)("summary"),
    status: (0, pg_core_1.varchar)("status").notNull().default("draft"), // draft, published, archived
    createdBy: (0, pg_core_1.varchar)("created_by").references(() => exports.users.id, { onDelete: "cascade" }).notNull(),
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)("updated_at").defaultNow(),
});
exports.tutorialSteps = (0, pg_core_1.pgTable)("tutorial_steps", {
    id: (0, pg_core_1.varchar)("id").primaryKey().default((0, drizzle_orm_1.sql) `gen_random_uuid()`),
    tutorialId: (0, pg_core_1.varchar)("tutorial_id").references(() => exports.tutorials.id, { onDelete: "cascade" }).notNull(),
    stepNumber: (0, pg_core_1.integer)("step_number").notNull(),
    title: (0, pg_core_1.varchar)("title", { length: 255 }).notNull(),
    body: (0, pg_core_1.text)("body").notNull(),
    mediaUrl: (0, pg_core_1.varchar)("media_url"),
    checklist: (0, pg_core_1.text)("checklist"), // JSON string of checklist items
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow(),
});
exports.tutorialProgress = (0, pg_core_1.pgTable)("tutorial_progress", {
    id: (0, pg_core_1.varchar)("id").primaryKey().default((0, drizzle_orm_1.sql) `gen_random_uuid()`),
    tutorialId: (0, pg_core_1.varchar)("tutorial_id").references(() => exports.tutorials.id, { onDelete: "cascade" }).notNull(),
    userId: (0, pg_core_1.varchar)("user_id").references(() => exports.users.id, { onDelete: "cascade" }).notNull(),
    completedStep: (0, pg_core_1.integer)("completed_step").default(0),
    startedAt: (0, pg_core_1.timestamp)("started_at").defaultNow(),
    completedAt: (0, pg_core_1.timestamp)("completed_at"),
});
// ====================================
// INFINITY SCROLL FEED SYSTEM
// ====================================
// Feed-specific enums
exports.postTypeEnum = (0, pg_core_1.pgEnum)("post_type", ["text", "image", "video", "mixed"]);
exports.postVisibilityEnum = (0, pg_core_1.pgEnum)("post_visibility", ["free", "subscriber", "paid", "followers"]);
exports.contentRatingEnum = (0, pg_core_1.pgEnum)("content_rating", ["safe", "suggestive", "explicit"]);
// Feed Posts
exports.feedPosts = (0, pg_core_1.pgTable)("feed_posts", {
    id: (0, pg_core_1.varchar)("id").primaryKey().default((0, drizzle_orm_1.sql) `gen_random_uuid()`),
    creatorId: (0, pg_core_1.varchar)("creator_id").references(() => exports.users.id, { onDelete: "cascade" }).notNull(),
    type: (0, exports.postTypeEnum)("type").default("text"),
    content: (0, pg_core_1.text)("content"), // Text content or caption
    visibility: (0, exports.postVisibilityEnum)("visibility").default("subscriber"),
    priceInCents: (0, pg_core_1.integer)("price_in_cents"), // For paid posts
    isFreePreview: (0, pg_core_1.boolean)("is_free_preview").default(false), // Creator allows free preview
    requiresAgeVerification: (0, pg_core_1.boolean)("requires_age_verification").default(true),
    contentRating: (0, exports.contentRatingEnum)("content_rating").default("explicit"),
    isPinned: (0, pg_core_1.boolean)("is_pinned").default(false),
    isPublished: (0, pg_core_1.boolean)("is_published").default(true),
    scheduledAt: (0, pg_core_1.timestamp)("scheduled_at"), // For scheduled posts
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)("updated_at").defaultNow(),
});
// Post Media (ordered media items)
exports.postMedia = (0, pg_core_1.pgTable)("post_media", {
    id: (0, pg_core_1.varchar)("id").primaryKey().default((0, drizzle_orm_1.sql) `gen_random_uuid()`),
    postId: (0, pg_core_1.varchar)("post_id").references(() => exports.feedPosts.id, { onDelete: "cascade" }).notNull(),
    mediaUrl: (0, pg_core_1.varchar)("media_url").notNull(),
    thumbnailUrl: (0, pg_core_1.varchar)("thumbnail_url"),
    mediaType: (0, pg_core_1.varchar)("media_type").notNull(), // image, video
    mimeType: (0, pg_core_1.varchar)("mime_type"),
    duration: (0, pg_core_1.integer)("duration"), // For videos (seconds)
    width: (0, pg_core_1.integer)("width"),
    height: (0, pg_core_1.integer)("height"),
    sortOrder: (0, pg_core_1.integer)("sort_order").default(0),
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow(),
});
// Post Engagement Metrics
exports.postEngagement = (0, pg_core_1.pgTable)("post_engagement", {
    id: (0, pg_core_1.varchar)("id").primaryKey().default((0, drizzle_orm_1.sql) `gen_random_uuid()`),
    postId: (0, pg_core_1.varchar)("post_id").references(() => exports.feedPosts.id, { onDelete: "cascade" }).notNull(),
    views: (0, pg_core_1.integer)("views").default(0),
    likes: (0, pg_core_1.integer)("likes").default(0),
    comments: (0, pg_core_1.integer)("comments").default(0),
    shares: (0, pg_core_1.integer)("shares").default(0),
    unlocks: (0, pg_core_1.integer)("unlocks").default(0), // For paid posts
    watchTimeSeconds: (0, pg_core_1.integer)("watch_time_seconds").default(0), // For videos
    updatedAt: (0, pg_core_1.timestamp)("updated_at").defaultNow(),
});
// User Follows (for following creators without subscribing)
exports.userFollows = (0, pg_core_1.pgTable)("user_follows", {
    id: (0, pg_core_1.varchar)("id").primaryKey().default((0, drizzle_orm_1.sql) `gen_random_uuid()`),
    followerId: (0, pg_core_1.varchar)("follower_id").references(() => exports.users.id, { onDelete: "cascade" }).notNull(),
    creatorId: (0, pg_core_1.varchar)("creator_id").references(() => exports.users.id, { onDelete: "cascade" }).notNull(),
    notificationsEnabled: (0, pg_core_1.boolean)("notifications_enabled").default(true),
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow(),
});
// Age Verifications (VerifyMy integration cache)
exports.ageVerifications = (0, pg_core_1.pgTable)("age_verifications", {
    id: (0, pg_core_1.varchar)("id").primaryKey().default((0, drizzle_orm_1.sql) `gen_random_uuid()`),
    userId: (0, pg_core_1.varchar)("user_id").references(() => exports.users.id, { onDelete: "cascade" }).notNull().unique(),
    provider: (0, pg_core_1.varchar)("provider").default("verifymyage"), // verifymyage, manual, etc.
    isVerified: (0, pg_core_1.boolean)("is_verified").default(false),
    verifiedAt: (0, pg_core_1.timestamp)("verified_at"),
    verificationToken: (0, pg_core_1.varchar)("verification_token"),
    dateOfBirth: (0, pg_core_1.timestamp)("date_of_birth"),
    documentType: (0, pg_core_1.varchar)("document_type"),
    expiresAt: (0, pg_core_1.timestamp)("expires_at"),
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)("updated_at").defaultNow(),
});
// Sponsored Posts / Ads
exports.sponsoredPosts = (0, pg_core_1.pgTable)("sponsored_posts", {
    id: (0, pg_core_1.varchar)("id").primaryKey().default((0, drizzle_orm_1.sql) `gen_random_uuid()`),
    title: (0, pg_core_1.varchar)("title").notNull(),
    description: (0, pg_core_1.text)("description"),
    mediaUrl: (0, pg_core_1.varchar)("media_url"),
    clickUrl: (0, pg_core_1.varchar)("click_url").notNull(),
    isActive: (0, pg_core_1.boolean)("is_active").default(true),
    impressions: (0, pg_core_1.integer)("impressions").default(0),
    clicks: (0, pg_core_1.integer)("clicks").default(0),
    budget: (0, pg_core_1.integer)("budget"), // in cents
    spent: (0, pg_core_1.integer)("spent").default(0), // in cents
    targetAudience: (0, pg_core_1.jsonb)("target_audience"), // Demographics, interests, etc.
    startDate: (0, pg_core_1.timestamp)("start_date"),
    endDate: (0, pg_core_1.timestamp)("end_date"),
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)("updated_at").defaultNow(),
});
// Post Likes (for tracking individual likes)
exports.postLikes = (0, pg_core_1.pgTable)("post_likes", {
    id: (0, pg_core_1.varchar)("id").primaryKey().default((0, drizzle_orm_1.sql) `gen_random_uuid()`),
    postId: (0, pg_core_1.varchar)("post_id").references(() => exports.feedPosts.id, { onDelete: "cascade" }).notNull(),
    userId: (0, pg_core_1.varchar)("user_id").references(() => exports.users.id, { onDelete: "cascade" }).notNull(),
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow(),
});
// Post Unlocks (tracking paid post purchases)
exports.postUnlocks = (0, pg_core_1.pgTable)("post_unlocks", {
    id: (0, pg_core_1.varchar)("id").primaryKey().default((0, drizzle_orm_1.sql) `gen_random_uuid()`),
    postId: (0, pg_core_1.varchar)("post_id").references(() => exports.feedPosts.id, { onDelete: "cascade" }).notNull(),
    userId: (0, pg_core_1.varchar)("user_id").references(() => exports.users.id, { onDelete: "cascade" }).notNull(),
    transactionId: (0, pg_core_1.varchar)("transaction_id").references(() => exports.transactions.id),
    paidAmount: (0, pg_core_1.integer)("paid_amount"), // in cents
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow(),
});
// Post Comments (threaded comments system)
exports.postComments = (0, pg_core_1.pgTable)("post_comments", {
    id: (0, pg_core_1.varchar)("id").primaryKey().default((0, drizzle_orm_1.sql) `gen_random_uuid()`),
    postId: (0, pg_core_1.varchar)("post_id").references(() => exports.feedPosts.id, { onDelete: "cascade" }).notNull(),
    userId: (0, pg_core_1.varchar)("user_id").references(() => exports.users.id, { onDelete: "cascade" }).notNull(),
    parentId: (0, pg_core_1.varchar)("parent_id"), // For threaded replies
    content: (0, pg_core_1.text)("content").notNull(),
    likes: (0, pg_core_1.integer)("likes").default(0),
    isEdited: (0, pg_core_1.boolean)("is_edited").default(false),
    isPinned: (0, pg_core_1.boolean)("is_pinned").default(false),
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)("updated_at").defaultNow(),
});
// Comment Likes
exports.commentLikes = (0, pg_core_1.pgTable)("comment_likes", {
    id: (0, pg_core_1.varchar)("id").primaryKey().default((0, drizzle_orm_1.sql) `gen_random_uuid()`),
    commentId: (0, pg_core_1.varchar)("comment_id").references(() => exports.postComments.id, { onDelete: "cascade" }).notNull(),
    userId: (0, pg_core_1.varchar)("user_id").references(() => exports.users.id, { onDelete: "cascade" }).notNull(),
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow(),
});
// Live Streams
exports.liveStreams = (0, pg_core_1.pgTable)("live_streams", {
    id: (0, pg_core_1.varchar)("id").primaryKey().default((0, drizzle_orm_1.sql) `gen_random_uuid()`),
    creatorId: (0, pg_core_1.varchar)("creator_id").references(() => exports.users.id, { onDelete: "cascade" }).notNull(),
    title: (0, pg_core_1.varchar)("title").notNull(),
    description: (0, pg_core_1.text)("description"),
    thumbnailUrl: (0, pg_core_1.varchar)("thumbnail_url"),
    streamKey: (0, pg_core_1.varchar)("stream_key").notNull().unique(),
    playbackUrl: (0, pg_core_1.varchar)("playback_url"),
    status: (0, pg_core_1.varchar)("status").default("scheduled"), // scheduled, live, ended
    visibility: (0, exports.postVisibilityEnum)("visibility").default("subscriber"),
    priceInCents: (0, pg_core_1.integer)("price_in_cents"),
    viewerCount: (0, pg_core_1.integer)("viewer_count").default(0),
    totalViews: (0, pg_core_1.integer)("total_views").default(0),
    scheduledAt: (0, pg_core_1.timestamp)("scheduled_at"),
    startedAt: (0, pg_core_1.timestamp)("started_at"),
    endedAt: (0, pg_core_1.timestamp)("ended_at"),
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)("updated_at").defaultNow(),
});
// Stream Views (tracking who watched)
exports.streamViews = (0, pg_core_1.pgTable)("stream_views", {
    id: (0, pg_core_1.varchar)("id").primaryKey().default((0, drizzle_orm_1.sql) `gen_random_uuid()`),
    streamId: (0, pg_core_1.varchar)("stream_id").references(() => exports.liveStreams.id, { onDelete: "cascade" }).notNull(),
    userId: (0, pg_core_1.varchar)("user_id").references(() => exports.users.id, { onDelete: "cascade" }).notNull(),
    watchTimeSeconds: (0, pg_core_1.integer)("watch_time_seconds").default(0),
    tippedAmount: (0, pg_core_1.integer)("tipped_amount").default(0),
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)("updated_at").defaultNow(),
});
// AI Recommendation Engine
exports.userPreferences = (0, pg_core_1.pgTable)("user_preferences", {
    id: (0, pg_core_1.varchar)("id").primaryKey().default((0, drizzle_orm_1.sql) `gen_random_uuid()`),
    userId: (0, pg_core_1.varchar)("user_id").references(() => exports.users.id, { onDelete: "cascade" }).notNull().unique(),
    preferredCategories: (0, pg_core_1.text)("preferred_categories").array(),
    blockedCreators: (0, pg_core_1.text)("blocked_creators").array(),
    blockedKeywords: (0, pg_core_1.text)("blocked_keywords").array(),
    contentPreferences: (0, pg_core_1.jsonb)("content_preferences"), // Detailed preferences JSON
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)("updated_at").defaultNow(),
});
// Content Interactions (for AI recommendations)
exports.contentInteractions = (0, pg_core_1.pgTable)("content_interactions", {
    id: (0, pg_core_1.varchar)("id").primaryKey().default((0, drizzle_orm_1.sql) `gen_random_uuid()`),
    userId: (0, pg_core_1.varchar)("user_id").references(() => exports.users.id, { onDelete: "cascade" }).notNull(),
    postId: (0, pg_core_1.varchar)("post_id").references(() => exports.feedPosts.id, { onDelete: "cascade" }),
    streamId: (0, pg_core_1.varchar)("stream_id").references(() => exports.liveStreams.id, { onDelete: "cascade" }),
    interactionType: (0, pg_core_1.varchar)("interaction_type").notNull(), // view, like, comment, share, skip, hide
    watchTimeSeconds: (0, pg_core_1.integer)("watch_time_seconds"),
    engagementScore: (0, pg_core_1.integer)("engagement_score"), // 0-100 calculated score
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow(),
});
// VR/AR Content Metadata
exports.vrContent = (0, pg_core_1.pgTable)("vr_content", {
    id: (0, pg_core_1.varchar)("id").primaryKey().default((0, drizzle_orm_1.sql) `gen_random_uuid()`),
    postId: (0, pg_core_1.varchar)("post_id").references(() => exports.feedPosts.id, { onDelete: "cascade" }),
    mediaId: (0, pg_core_1.varchar)("media_id").references(() => exports.mediaAssets.id, { onDelete: "cascade" }),
    vrType: (0, pg_core_1.varchar)("vr_type").notNull(), // 360_video, 180_video, 3d_model, ar_filter
    resolution: (0, pg_core_1.varchar)("resolution"), // 4K, 8K, etc.
    stereoscopicMode: (0, pg_core_1.varchar)("stereoscopic_mode"), // mono, stereo_lr, stereo_tb
    projectionType: (0, pg_core_1.varchar)("projection_type"), // equirectangular, cubemap
    modelFormat: (0, pg_core_1.varchar)("model_format"), // gltf, fbx, obj
    arTrackingType: (0, pg_core_1.varchar)("ar_tracking_type"), // face, world, image
    metadata: (0, pg_core_1.jsonb)("metadata"), // Additional VR/AR specific data
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow(),
});
// ====================================
// ENHANCED LIVE STREAMING SYSTEM
// ====================================
// Stream Participants (Co-stars)
exports.streamParticipants = (0, pg_core_1.pgTable)("stream_participants", {
    id: (0, pg_core_1.varchar)("id").primaryKey().default((0, drizzle_orm_1.sql) `gen_random_uuid()`),
    streamId: (0, pg_core_1.varchar)("stream_id").references(() => exports.liveStreams.id, { onDelete: "cascade" }).notNull(),
    userId: (0, pg_core_1.varchar)("user_id").references(() => exports.users.id, { onDelete: "cascade" }).notNull(),
    role: (0, pg_core_1.varchar)("role").notNull().default("co-star"), // host, co-star, moderator
    isVerified: (0, pg_core_1.boolean)("is_verified").default(false),
    verificationStatus: (0, pg_core_1.varchar)("verification_status").default("pending"), // pending, verified, failed
    verifiedAt: (0, pg_core_1.timestamp)("verified_at"),
    joinedAt: (0, pg_core_1.timestamp)("joined_at"),
    leftAt: (0, pg_core_1.timestamp)("left_at"),
    streamQuality: (0, pg_core_1.varchar)("stream_quality").default("720p"), // 360p, 720p, 1080p, 4K
    audioEnabled: (0, pg_core_1.boolean)("audio_enabled").default(true),
    videoEnabled: (0, pg_core_1.boolean)("video_enabled").default(true),
    screenPosition: (0, pg_core_1.jsonb)("screen_position"), // {x, y, width, height} for multi-person layout
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow(),
});
// Stream Chat Messages
exports.streamChatMessages = (0, pg_core_1.pgTable)("stream_chat_messages", {
    id: (0, pg_core_1.varchar)("id").primaryKey().default((0, drizzle_orm_1.sql) `gen_random_uuid()`),
    streamId: (0, pg_core_1.varchar)("stream_id").references(() => exports.liveStreams.id, { onDelete: "cascade" }).notNull(),
    userId: (0, pg_core_1.varchar)("user_id").references(() => exports.users.id, { onDelete: "cascade" }).notNull(),
    message: (0, pg_core_1.text)("message").notNull(),
    messageType: (0, pg_core_1.varchar)("message_type").default("text"), // text, emote, announcement, system
    isPinned: (0, pg_core_1.boolean)("is_pinned").default(false),
    isModerated: (0, pg_core_1.boolean)("is_moderated").default(false),
    moderatedBy: (0, pg_core_1.varchar)("moderated_by").references(() => exports.users.id),
    replyToId: (0, pg_core_1.varchar)("reply_to_id"), // For threaded messages
    metadata: (0, pg_core_1.jsonb)("metadata"), // emotes, mentions, etc.
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow(),
});
// Stream Gifts
exports.streamGifts = (0, pg_core_1.pgTable)("stream_gifts", {
    id: (0, pg_core_1.varchar)("id").primaryKey().default((0, drizzle_orm_1.sql) `gen_random_uuid()`),
    streamId: (0, pg_core_1.varchar)("stream_id").references(() => exports.liveStreams.id, { onDelete: "cascade" }).notNull(),
    senderId: (0, pg_core_1.varchar)("sender_id").references(() => exports.users.id, { onDelete: "cascade" }).notNull(),
    receiverId: (0, pg_core_1.varchar)("receiver_id").references(() => exports.users.id, { onDelete: "cascade" }).notNull(), // Can be host or co-star
    giftType: (0, pg_core_1.varchar)("gift_type").notNull(), // rose, heart, diamond, fireworks, etc.
    giftValue: (0, pg_core_1.integer)("gift_value").notNull(), // in cents
    quantity: (0, pg_core_1.integer)("quantity").default(1),
    animationType: (0, pg_core_1.varchar)("animation_type").default("floating"), // floating, explosion, rain
    message: (0, pg_core_1.text)("message"),
    isAnonymous: (0, pg_core_1.boolean)("is_anonymous").default(false),
    transactionId: (0, pg_core_1.varchar)("transaction_id").references(() => exports.transactions.id),
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow(),
});
// Stream Reactions (real-time reactions)
exports.streamReactions = (0, pg_core_1.pgTable)("stream_reactions", {
    id: (0, pg_core_1.varchar)("id").primaryKey().default((0, drizzle_orm_1.sql) `gen_random_uuid()`),
    streamId: (0, pg_core_1.varchar)("stream_id").references(() => exports.liveStreams.id, { onDelete: "cascade" }).notNull(),
    userId: (0, pg_core_1.varchar)("user_id").references(() => exports.users.id, { onDelete: "cascade" }).notNull(),
    reactionType: (0, pg_core_1.varchar)("reaction_type").notNull(), // heart, fire, laugh, wow, clap
    intensity: (0, pg_core_1.integer)("intensity").default(1), // 1-10 for reaction strength
    timestamp: (0, pg_core_1.integer)("timestamp"), // Stream timestamp in seconds
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow(),
});
// Stream Highlights (AI-detected or manual)
exports.streamHighlights = (0, pg_core_1.pgTable)("stream_highlights", {
    id: (0, pg_core_1.varchar)("id").primaryKey().default((0, drizzle_orm_1.sql) `gen_random_uuid()`),
    streamId: (0, pg_core_1.varchar)("stream_id").references(() => exports.liveStreams.id, { onDelete: "cascade" }).notNull(),
    title: (0, pg_core_1.varchar)("title"),
    startTime: (0, pg_core_1.integer)("start_time").notNull(), // seconds from stream start
    endTime: (0, pg_core_1.integer)("end_time").notNull(), // seconds from stream start
    clipUrl: (0, pg_core_1.varchar)("clip_url"),
    thumbnailUrl: (0, pg_core_1.varchar)("thumbnail_url"),
    highlightType: (0, pg_core_1.varchar)("highlight_type").notNull(), // ai_detected, manual, peak_viewers, peak_gifts
    score: (0, pg_core_1.integer)("score").default(0), // AI confidence score 0-100
    tags: (0, pg_core_1.text)("tags").array(),
    metadata: (0, pg_core_1.jsonb)("metadata"), // AI analysis data
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow(),
});
// Stream Recordings
exports.streamRecordings = (0, pg_core_1.pgTable)("stream_recordings", {
    id: (0, pg_core_1.varchar)("id").primaryKey().default((0, drizzle_orm_1.sql) `gen_random_uuid()`),
    streamId: (0, pg_core_1.varchar)("stream_id").references(() => exports.liveStreams.id, { onDelete: "cascade" }).notNull(),
    recordingUrl: (0, pg_core_1.varchar)("recording_url").notNull(),
    thumbnailUrl: (0, pg_core_1.varchar)("thumbnail_url"),
    duration: (0, pg_core_1.integer)("duration"), // in seconds
    fileSize: (0, pg_core_1.integer)("file_size"), // in bytes
    resolution: (0, pg_core_1.varchar)("resolution"), // 1080p, 720p, etc.
    format: (0, pg_core_1.varchar)("format").default("mp4"), // mp4, webm, etc.
    status: (0, pg_core_1.varchar)("status").default("processing"), // processing, ready, failed
    processedAt: (0, pg_core_1.timestamp)("processed_at"),
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow(),
});
// Stream Viewers (active viewer tracking)
exports.streamViewers = (0, pg_core_1.pgTable)("stream_viewers", {
    id: (0, pg_core_1.varchar)("id").primaryKey().default((0, drizzle_orm_1.sql) `gen_random_uuid()`),
    streamId: (0, pg_core_1.varchar)("stream_id").references(() => exports.liveStreams.id, { onDelete: "cascade" }).notNull(),
    userId: (0, pg_core_1.varchar)("user_id").references(() => exports.users.id, { onDelete: "cascade" }).notNull(),
    joinedAt: (0, pg_core_1.timestamp)("joined_at").defaultNow(),
    leftAt: (0, pg_core_1.timestamp)("left_at"),
    watchTimeSeconds: (0, pg_core_1.integer)("watch_time_seconds").default(0),
    peakQuality: (0, pg_core_1.varchar)("peak_quality"), // Highest quality watched
    deviceType: (0, pg_core_1.varchar)("device_type"), // mobile, desktop, tablet, tv
    location: (0, pg_core_1.varchar)("location"), // Country/region
    connectionQuality: (0, pg_core_1.varchar)("connection_quality"), // excellent, good, poor
    bufferingEvents: (0, pg_core_1.integer)("buffering_events").default(0),
    isActive: (0, pg_core_1.boolean)("is_active").default(true),
});
// Stream Analytics (aggregated metrics)
exports.streamAnalytics = (0, pg_core_1.pgTable)("stream_analytics", {
    id: (0, pg_core_1.varchar)("id").primaryKey().default((0, drizzle_orm_1.sql) `gen_random_uuid()`),
    streamId: (0, pg_core_1.varchar)("stream_id").references(() => exports.liveStreams.id, { onDelete: "cascade" }).notNull().unique(),
    peakViewers: (0, pg_core_1.integer)("peak_viewers").default(0),
    avgViewers: (0, pg_core_1.integer)("avg_viewers").default(0),
    totalViewers: (0, pg_core_1.integer)("total_viewers").default(0),
    totalWatchTimeMinutes: (0, pg_core_1.integer)("total_watch_time_minutes").default(0),
    totalGifts: (0, pg_core_1.integer)("total_gifts").default(0),
    totalGiftValue: (0, pg_core_1.integer)("total_gift_value").default(0), // in cents
    totalReactions: (0, pg_core_1.integer)("total_reactions").default(0),
    totalChatMessages: (0, pg_core_1.integer)("total_chat_messages").default(0),
    engagementScore: (0, pg_core_1.integer)("engagement_score").default(0), // 0-100
    viewerRetention: (0, pg_core_1.jsonb)("viewer_retention"), // {time: percentage} graph data
    demographicsData: (0, pg_core_1.jsonb)("demographics_data"),
    updatedAt: (0, pg_core_1.timestamp)("updated_at").defaultNow(),
});
// Relations
exports.usersRelations = (0, drizzle_orm_2.relations)(exports.users, ({ one, many }) => ({
    profile: one(exports.profiles, { fields: [exports.users.id], references: [exports.profiles.userId] }),
    mediaAssets: many(exports.mediaAssets),
    kycVerifications: many(exports.kycVerifications),
    payoutAccounts: many(exports.payoutAccounts),
    payoutRequests: many(exports.payoutRequests),
    subscriptionsAsFan: many(exports.subscriptions, { relationName: "subscriber" }),
    subscriptionsAsCreator: many(exports.subscriptions, { relationName: "creator" }),
    transactionsAsBuyer: many(exports.transactions, { relationName: "buyer" }),
    transactionsAsCreator: many(exports.transactions, { relationName: "creator" }),
    sentMessages: many(exports.messages, { relationName: "sender" }),
    receivedMessages: many(exports.messages, { relationName: "receiver" }),
}));
exports.profilesRelations = (0, drizzle_orm_2.relations)(exports.profiles, ({ one }) => ({
    user: one(exports.users, { fields: [exports.profiles.userId], references: [exports.users.id] }),
}));
exports.mediaAssetsRelations = (0, drizzle_orm_2.relations)(exports.mediaAssets, ({ one, many }) => ({
    owner: one(exports.users, { fields: [exports.mediaAssets.ownerId], references: [exports.users.id] }),
    moderationQueue: many(exports.moderationQueue),
}));
exports.moderationQueueRelations = (0, drizzle_orm_2.relations)(exports.moderationQueue, ({ one }) => ({
    media: one(exports.mediaAssets, { fields: [exports.moderationQueue.mediaId], references: [exports.mediaAssets.id] }),
    reviewer: one(exports.users, { fields: [exports.moderationQueue.reviewerId], references: [exports.users.id] }),
}));
exports.subscriptionsRelations = (0, drizzle_orm_2.relations)(exports.subscriptions, ({ one }) => ({
    subscriber: one(exports.users, { fields: [exports.subscriptions.userId], references: [exports.users.id], relationName: "subscriber" }),
    creator: one(exports.users, { fields: [exports.subscriptions.creatorId], references: [exports.users.id], relationName: "creator" }),
}));
exports.transactionsRelations = (0, drizzle_orm_2.relations)(exports.transactions, ({ one }) => ({
    buyer: one(exports.users, { fields: [exports.transactions.userId], references: [exports.users.id], relationName: "buyer" }),
    creator: one(exports.users, { fields: [exports.transactions.creatorId], references: [exports.users.id], relationName: "creator" }),
    media: one(exports.mediaAssets, { fields: [exports.transactions.mediaId], references: [exports.mediaAssets.id] }),
    subscription: one(exports.subscriptions, { fields: [exports.transactions.subscriptionId], references: [exports.subscriptions.id] }),
}));
exports.messagesRelations = (0, drizzle_orm_2.relations)(exports.messages, ({ one }) => ({
    sender: one(exports.users, { fields: [exports.messages.senderId], references: [exports.users.id], relationName: "sender" }),
    receiver: one(exports.users, { fields: [exports.messages.receiverId], references: [exports.users.id], relationName: "receiver" }),
}));
// Zod schemas for validation
exports.insertUserSchema = (0, drizzle_zod_1.createInsertSchema)(exports.users).pick({
    username: true,
    password: true,
    email: true,
});
exports.insertProfileSchema = (0, drizzle_zod_1.createInsertSchema)(exports.profiles).omit({
    id: true,
    createdAt: true,
    updatedAt: true,
});
exports.insertMediaAssetSchema = (0, drizzle_zod_1.createInsertSchema)(exports.mediaAssets).omit({
    id: true,
    createdAt: true,
    updatedAt: true,
    views: true,
    likes: true,
});
exports.insertMessageSchema = (0, drizzle_zod_1.createInsertSchema)(exports.messages).omit({
    id: true,
    createdAt: true,
    isRead: true,
});
exports.insertSubscriptionSchema = (0, drizzle_zod_1.createInsertSchema)(exports.subscriptions).omit({
    id: true,
    createdAt: true,
    updatedAt: true,
});
exports.insertTransactionSchema = (0, drizzle_zod_1.createInsertSchema)(exports.transactions).omit({
    id: true,
    createdAt: true,
    processedAt: true,
});
exports.insertSupportTicketSchema = (0, drizzle_zod_1.createInsertSchema)(exports.supportTickets).omit({
    id: true,
    createdAt: true,
    updatedAt: true,
});
exports.insertSupportMessageSchema = (0, drizzle_zod_1.createInsertSchema)(exports.supportMessages).omit({
    id: true,
    createdAt: true,
});
exports.insertKnowledgeArticleSchema = (0, drizzle_zod_1.createInsertSchema)(exports.knowledgeArticles).omit({
    id: true,
    createdAt: true,
    updatedAt: true,
    publishedAt: true,
});
exports.insertTutorialSchema = (0, drizzle_zod_1.createInsertSchema)(exports.tutorials).omit({
    id: true,
    createdAt: true,
    updatedAt: true,
});
// FanzTrust™ Payment & Refund System
exports.paymentGatewayEnum = (0, pg_core_1.pgEnum)("payment_gateway", [
    "metamask", "solana", "tronlink", // Crypto wallets
    "rocketgate", "segpay", "ccbill", // Adult-friendly processors
    "fanzpay", "fanztoken", "fanzcoin" // Fanz native systems
]);
exports.refundStatusEnum = (0, pg_core_1.pgEnum)("refund_status", [
    "pending", "auto_approved", "manual_review", "approved", "denied", "completed"
]);
exports.trustScoreEnum = (0, pg_core_1.pgEnum)("trust_level", [
    "new", "trusted", "verified", "flagged", "banned"
]);
// FanzTrust Transactions
exports.fanzTransactions = (0, pg_core_1.pgTable)("fanz_transactions", {
    id: (0, pg_core_1.varchar)("id").primaryKey().default((0, drizzle_orm_1.sql) `gen_random_uuid()`),
    fanId: (0, pg_core_1.varchar)("fan_id").references(() => exports.users.id, { onDelete: "cascade" }).notNull(),
    creatorId: (0, pg_core_1.varchar)("creator_id").references(() => exports.users.id, { onDelete: "cascade" }).notNull(),
    gateway: (0, exports.paymentGatewayEnum)("gateway").notNull(),
    txid: (0, pg_core_1.varchar)("txid"), // Transaction ID from gateway or blockchain
    amount: (0, pg_core_1.integer)("amount").notNull(), // in cents or smallest unit
    currency: (0, pg_core_1.varchar)("currency").default("USD"), // USD, SOL, TRX, FANZ, etc.
    walletAddress: (0, pg_core_1.varchar)("wallet_address"),
    email: (0, pg_core_1.varchar)("email"),
    last4: (0, pg_core_1.varchar)("last_4"), // Last 4 digits for card transactions
    status: (0, exports.transactionStatusEnum)("status").default("pending"),
    ipAddress: (0, pg_core_1.varchar)("ip_address"),
    deviceFingerprint: (0, pg_core_1.varchar)("device_fingerprint"),
    contentAccessed: (0, pg_core_1.boolean)("content_accessed").default(false),
    subscriptionId: (0, pg_core_1.varchar)("subscription_id"),
    metadata: (0, pg_core_1.jsonb)("metadata"), // Additional gateway-specific data
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow(),
    completedAt: (0, pg_core_1.timestamp)("completed_at"),
});
// Refund Requests
exports.refundRequests = (0, pg_core_1.pgTable)("refund_requests", {
    id: (0, pg_core_1.varchar)("id").primaryKey().default((0, drizzle_orm_1.sql) `gen_random_uuid()`),
    transactionId: (0, pg_core_1.varchar)("transaction_id").references(() => exports.fanzTransactions.id, { onDelete: "cascade" }).notNull(),
    fanId: (0, pg_core_1.varchar)("fan_id").references(() => exports.users.id, { onDelete: "cascade" }).notNull(),
    creatorId: (0, pg_core_1.varchar)("creator_id").references(() => exports.users.id, { onDelete: "cascade" }).notNull(),
    reason: (0, pg_core_1.text)("reason").notNull(),
    status: (0, exports.refundStatusEnum)("status").default("pending"),
    verificationResult: (0, pg_core_1.jsonb)("verification_result"), // Auto-verification data
    isAutoApproved: (0, pg_core_1.boolean)("is_auto_approved").default(false),
    reviewedBy: (0, pg_core_1.varchar)("reviewed_by").references(() => exports.users.id),
    reviewNotes: (0, pg_core_1.text)("review_notes"),
    amount: (0, pg_core_1.integer)("amount").notNull(),
    ipAddress: (0, pg_core_1.varchar)("ip_address"),
    deviceFingerprint: (0, pg_core_1.varchar)("device_fingerprint"),
    fraudScore: (0, pg_core_1.integer)("fraud_score").default(0), // 0-100
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow(),
    reviewedAt: (0, pg_core_1.timestamp)("reviewed_at"),
    completedAt: (0, pg_core_1.timestamp)("completed_at"),
});
// FanzPay/FanzToken System
exports.fanzWallets = (0, pg_core_1.pgTable)("fanz_wallets", {
    id: (0, pg_core_1.varchar)("id").primaryKey().default((0, drizzle_orm_1.sql) `gen_random_uuid()`),
    userId: (0, pg_core_1.varchar)("user_id").references(() => exports.users.id, { onDelete: "cascade" }).notNull().unique(),
    fanzTokenBalance: (0, pg_core_1.integer)("fanz_token_balance").default(0), // FanzToken balance
    fanzCoinBalance: (0, pg_core_1.integer)("fanz_coin_balance").default(0), // FanzCoin (rewards)
    fanzCreditBalance: (0, pg_core_1.integer)("fanz_credit_balance").default(0), // Store credit
    totalDeposited: (0, pg_core_1.integer)("total_deposited").default(0),
    totalSpent: (0, pg_core_1.integer)("total_spent").default(0),
    totalEarned: (0, pg_core_1.integer)("total_earned").default(0),
    walletAddress: (0, pg_core_1.varchar)("wallet_address").unique(), // For crypto withdrawals
    isVerified: (0, pg_core_1.boolean)("is_verified").default(false),
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)("updated_at").defaultNow(),
});
// FanzCard Virtual Cards
exports.fanzCards = (0, pg_core_1.pgTable)("fanz_cards", {
    id: (0, pg_core_1.varchar)("id").primaryKey().default((0, drizzle_orm_1.sql) `gen_random_uuid()`),
    userId: (0, pg_core_1.varchar)("user_id").references(() => exports.users.id, { onDelete: "cascade" }).notNull(),
    cardNumber: (0, pg_core_1.varchar)("card_number").notNull().unique(), // Encrypted/masked
    cardType: (0, pg_core_1.varchar)("card_type").default("virtual"), // virtual, physical
    balance: (0, pg_core_1.integer)("balance").default(0),
    currency: (0, pg_core_1.varchar)("currency").default("USD"),
    status: (0, pg_core_1.varchar)("status").default("active"), // active, frozen, cancelled
    expiryDate: (0, pg_core_1.varchar)("expiry_date"),
    cvv: (0, pg_core_1.varchar)("cvv"), // Encrypted
    isDefault: (0, pg_core_1.boolean)("is_default").default(false),
    metadata: (0, pg_core_1.jsonb)("metadata"),
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow(),
    lastUsedAt: (0, pg_core_1.timestamp)("last_used_at"),
});
// Wallet Transactions
exports.walletTransactions = (0, pg_core_1.pgTable)("wallet_transactions", {
    id: (0, pg_core_1.varchar)("id").primaryKey().default((0, drizzle_orm_1.sql) `gen_random_uuid()`),
    walletId: (0, pg_core_1.varchar)("wallet_id").references(() => exports.fanzWallets.id, { onDelete: "cascade" }).notNull(),
    type: (0, pg_core_1.varchar)("type").notNull(), // deposit, withdrawal, purchase, earning, refund, transfer
    amount: (0, pg_core_1.integer)("amount").notNull(),
    currency: (0, pg_core_1.varchar)("currency").default("FANZ"),
    fromUser: (0, pg_core_1.varchar)("from_user").references(() => exports.users.id),
    toUser: (0, pg_core_1.varchar)("to_user").references(() => exports.users.id),
    relatedTransactionId: (0, pg_core_1.varchar)("related_transaction_id"),
    description: (0, pg_core_1.text)("description"),
    status: (0, pg_core_1.varchar)("status").default("completed"), // pending, completed, failed
    metadata: (0, pg_core_1.jsonb)("metadata"),
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow(),
});
// Fan Trust Scores
exports.fanTrustScores = (0, pg_core_1.pgTable)("fan_trust_scores", {
    id: (0, pg_core_1.varchar)("id").primaryKey().default((0, drizzle_orm_1.sql) `gen_random_uuid()`),
    fanId: (0, pg_core_1.varchar)("fan_id").references(() => exports.users.id, { onDelete: "cascade" }).notNull().unique(),
    score: (0, pg_core_1.integer)("score").default(100), // 0-100
    level: (0, exports.trustScoreEnum)("level").default("new"),
    totalTransactions: (0, pg_core_1.integer)("total_transactions").default(0),
    totalRefunds: (0, pg_core_1.integer)("total_refunds").default(0),
    falseClaimsCount: (0, pg_core_1.integer)("false_claims_count").default(0),
    successfulPurchases: (0, pg_core_1.integer)("successful_purchases").default(0),
    accountAge: (0, pg_core_1.integer)("account_age").default(0), // days
    lastReviewedAt: (0, pg_core_1.timestamp)("last_reviewed_at"),
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)("updated_at").defaultNow(),
});
// Audit Logs for FanzTrust
exports.trustAuditLogs = (0, pg_core_1.pgTable)("trust_audit_logs", {
    id: (0, pg_core_1.varchar)("id").primaryKey().default((0, drizzle_orm_1.sql) `gen_random_uuid()`),
    action: (0, pg_core_1.varchar)("action").notNull(), // verify_transaction, request_refund, approve_refund, deny_refund, flag_user
    performedBy: (0, pg_core_1.varchar)("performed_by").references(() => exports.users.id),
    targetUserId: (0, pg_core_1.varchar)("target_user_id").references(() => exports.users.id),
    transactionId: (0, pg_core_1.varchar)("transaction_id").references(() => exports.fanzTransactions.id),
    refundId: (0, pg_core_1.varchar)("refund_id").references(() => exports.refundRequests.id),
    result: (0, pg_core_1.varchar)("result"), // success, failure, flagged
    details: (0, pg_core_1.jsonb)("details"),
    ipAddress: (0, pg_core_1.varchar)("ip_address"),
    userAgent: (0, pg_core_1.varchar)("user_agent"),
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow(),
});
// Creator Refund Policies
exports.creatorRefundPolicies = (0, pg_core_1.pgTable)("creator_refund_policies", {
    id: (0, pg_core_1.varchar)("id").primaryKey().default((0, drizzle_orm_1.sql) `gen_random_uuid()`),
    creatorId: (0, pg_core_1.varchar)("creator_id").references(() => exports.users.id, { onDelete: "cascade" }).notNull().unique(),
    autoApproveEnabled: (0, pg_core_1.boolean)("auto_approve_enabled").default(true),
    autoApproveTimeLimit: (0, pg_core_1.integer)("auto_approve_time_limit").default(60), // minutes
    requireContentAccess: (0, pg_core_1.boolean)("require_content_access").default(true),
    customMessage: (0, pg_core_1.text)("custom_message"),
    payoutDelayHours: (0, pg_core_1.integer)("payout_delay_hours").default(24), // Delay for high-risk purchases
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)("updated_at").defaultNow(),
});
// ====================================
// CONTENT CREATION & DISTRIBUTION SYSTEM
// ====================================
// Content Creation Sessions
exports.contentCreationSessions = (0, pg_core_1.pgTable)("content_creation_sessions", {
    id: (0, pg_core_1.varchar)("id").primaryKey().default((0, drizzle_orm_1.sql) `gen_random_uuid()`),
    creatorId: (0, pg_core_1.varchar)("creator_id").references(() => exports.users.id, { onDelete: "cascade" }).notNull(),
    title: (0, pg_core_1.varchar)("title"),
    description: (0, pg_core_1.text)("description"),
    type: (0, exports.contentTypeEnum)("type").notNull(),
    status: (0, exports.contentStatusEnum)("status").default("draft"),
    sourceType: (0, pg_core_1.varchar)("source_type").notNull(), // camera, upload, live_stream, screen_record
    originalFileUrl: (0, pg_core_1.varchar)("original_file_url"),
    originalFileSize: (0, pg_core_1.integer)("original_file_size"),
    originalDuration: (0, pg_core_1.integer)("original_duration"), // in seconds
    originalDimensions: (0, pg_core_1.jsonb)("original_dimensions"), // {width, height}
    metadata: (0, pg_core_1.jsonb)("metadata"), // camera settings, filters applied, etc.
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)("updated_at").defaultNow(),
});
// AI Editing Tasks
exports.editingTasks = (0, pg_core_1.pgTable)("editing_tasks", {
    id: (0, pg_core_1.varchar)("id").primaryKey().default((0, drizzle_orm_1.sql) `gen_random_uuid()`),
    sessionId: (0, pg_core_1.varchar)("session_id").references(() => exports.contentCreationSessions.id, { onDelete: "cascade" }).notNull(),
    creatorId: (0, pg_core_1.varchar)("creator_id").references(() => exports.users.id, { onDelete: "cascade" }).notNull(),
    status: (0, exports.editingStatusEnum)("status").default("pending"),
    editingOptions: (0, pg_core_1.jsonb)("editing_options"), // {autoCut, addBranding, addIntro, addOutro, stabilize, etc.}
    aiSuggestions: (0, pg_core_1.jsonb)("ai_suggestions"), // AI-suggested edits
    progress: (0, pg_core_1.integer)("progress").default(0), // 0-100
    errorMessage: (0, pg_core_1.text)("error_message"),
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow(),
    startedAt: (0, pg_core_1.timestamp)("started_at"),
    completedAt: (0, pg_core_1.timestamp)("completed_at"),
});
// Generated Content Versions (multiple aspect ratios, formats)
exports.contentVersions = (0, pg_core_1.pgTable)("content_versions", {
    id: (0, pg_core_1.varchar)("id").primaryKey().default((0, drizzle_orm_1.sql) `gen_random_uuid()`),
    sessionId: (0, pg_core_1.varchar)("session_id").references(() => exports.contentCreationSessions.id, { onDelete: "cascade" }).notNull(),
    editingTaskId: (0, pg_core_1.varchar)("editing_task_id").references(() => exports.editingTasks.id),
    aspectRatio: (0, exports.aspectRatioEnum)("aspect_ratio").notNull(),
    format: (0, pg_core_1.varchar)("format").notNull(), // mp4, webm, gif, jpg
    resolution: (0, pg_core_1.varchar)("resolution"), // 1080p, 720p, etc.
    fileUrl: (0, pg_core_1.varchar)("file_url").notNull(),
    thumbnailUrl: (0, pg_core_1.varchar)("thumbnail_url"),
    fileSize: (0, pg_core_1.integer)("file_size"),
    duration: (0, pg_core_1.integer)("duration"), // in seconds
    dimensions: (0, pg_core_1.jsonb)("dimensions"), // {width, height}
    isProcessed: (0, pg_core_1.boolean)("is_processed").default(false),
    metadata: (0, pg_core_1.jsonb)("metadata"), // encoding details, bitrate, etc.
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow(),
});
// Distribution Campaigns
exports.distributionCampaigns = (0, pg_core_1.pgTable)("distribution_campaigns", {
    id: (0, pg_core_1.varchar)("id").primaryKey().default((0, drizzle_orm_1.sql) `gen_random_uuid()`),
    sessionId: (0, pg_core_1.varchar)("session_id").references(() => exports.contentCreationSessions.id, { onDelete: "cascade" }).notNull(),
    creatorId: (0, pg_core_1.varchar)("creator_id").references(() => exports.users.id, { onDelete: "cascade" }).notNull(),
    name: (0, pg_core_1.varchar)("name"),
    status: (0, exports.distributionStatusEnum)("status").default("scheduled"),
    platforms: (0, pg_core_1.text)("platforms").array(), // ["instagram", "tiktok", "twitter"]
    publishSchedule: (0, pg_core_1.jsonb)("publish_schedule"), // {immediate: true, scheduledTime: date, timezone: string}
    distributionSettings: (0, pg_core_1.jsonb)("distribution_settings"), // {autoHashtags, captions, mentions, etc.}
    qrCodeUrl: (0, pg_core_1.varchar)("qr_code_url"),
    smartLinkUrl: (0, pg_core_1.varchar)("smart_link_url"),
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow(),
    scheduledAt: (0, pg_core_1.timestamp)("scheduled_at"),
    publishedAt: (0, pg_core_1.timestamp)("published_at"),
});
// Platform Distribution Tasks
exports.platformDistributions = (0, pg_core_1.pgTable)("platform_distributions", {
    id: (0, pg_core_1.varchar)("id").primaryKey().default((0, drizzle_orm_1.sql) `gen_random_uuid()`),
    campaignId: (0, pg_core_1.varchar)("campaign_id").references(() => exports.distributionCampaigns.id, { onDelete: "cascade" }).notNull(),
    contentVersionId: (0, pg_core_1.varchar)("content_version_id").references(() => exports.contentVersions.id).notNull(),
    platform: (0, exports.socialPlatformEnum)("platform").notNull(),
    status: (0, pg_core_1.varchar)("status").default("pending"), // pending, publishing, published, failed
    platformPostId: (0, pg_core_1.varchar)("platform_post_id"), // ID from the social platform
    platformUrl: (0, pg_core_1.varchar)("platform_url"), // Link to the post on the platform
    caption: (0, pg_core_1.text)("caption"),
    hashtags: (0, pg_core_1.text)("hashtags").array(),
    mentions: (0, pg_core_1.text)("mentions").array(),
    errorMessage: (0, pg_core_1.text)("error_message"),
    platformMetrics: (0, pg_core_1.jsonb)("platform_metrics"), // views, likes, shares from platform
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow(),
    publishedAt: (0, pg_core_1.timestamp)("published_at"),
});
// Content Analytics
exports.contentAnalytics = (0, pg_core_1.pgTable)("content_analytics", {
    id: (0, pg_core_1.varchar)("id").primaryKey().default((0, drizzle_orm_1.sql) `gen_random_uuid()`),
    sessionId: (0, pg_core_1.varchar)("session_id").references(() => exports.contentCreationSessions.id, { onDelete: "cascade" }).notNull(),
    creatorId: (0, pg_core_1.varchar)("creator_id").references(() => exports.users.id, { onDelete: "cascade" }).notNull(),
    totalViews: (0, pg_core_1.integer)("total_views").default(0),
    totalLikes: (0, pg_core_1.integer)("total_likes").default(0),
    totalShares: (0, pg_core_1.integer)("total_shares").default(0),
    totalComments: (0, pg_core_1.integer)("total_comments").default(0),
    totalRevenue: (0, pg_core_1.integer)("total_revenue").default(0), // in cents
    avgWatchTime: (0, pg_core_1.integer)("avg_watch_time").default(0), // in seconds
    clickThroughRate: (0, pg_core_1.integer)("click_through_rate").default(0), // percentage
    conversionRate: (0, pg_core_1.integer)("conversion_rate").default(0), // percentage
    demographicsData: (0, pg_core_1.jsonb)("demographics_data"), // age, gender, location breakdown
    platformBreakdown: (0, pg_core_1.jsonb)("platform_breakdown"), // metrics per platform
    updatedAt: (0, pg_core_1.timestamp)("updated_at").defaultNow(),
});
// AI-Generated Assets (trailers, GIFs, highlights)
exports.generatedAssets = (0, pg_core_1.pgTable)("generated_assets", {
    id: (0, pg_core_1.varchar)("id").primaryKey().default((0, drizzle_orm_1.sql) `gen_random_uuid()`),
    sessionId: (0, pg_core_1.varchar)("session_id").references(() => exports.contentCreationSessions.id, { onDelete: "cascade" }).notNull(),
    assetType: (0, pg_core_1.varchar)("asset_type").notNull(), // trailer, gif, highlight, thumbnail
    fileUrl: (0, pg_core_1.varchar)("file_url").notNull(),
    thumbnailUrl: (0, pg_core_1.varchar)("thumbnail_url"),
    duration: (0, pg_core_1.integer)("duration"), // in seconds for video assets
    fileSize: (0, pg_core_1.integer)("file_size"),
    metadata: (0, pg_core_1.jsonb)("metadata"), // generation settings, AI parameters
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow(),
});
// Creator Studio Settings
exports.creatorStudioSettings = (0, pg_core_1.pgTable)("creator_studio_settings", {
    id: (0, pg_core_1.varchar)("id").primaryKey().default((0, drizzle_orm_1.sql) `gen_random_uuid()`),
    creatorId: (0, pg_core_1.varchar)("creator_id").references(() => exports.users.id, { onDelete: "cascade" }).notNull().unique(),
    defaultBranding: (0, pg_core_1.jsonb)("default_branding"), // logo, watermark, brand colors
    defaultIntroUrl: (0, pg_core_1.varchar)("default_intro_url"),
    defaultOutroUrl: (0, pg_core_1.varchar)("default_outro_url"),
    autoEditingEnabled: (0, pg_core_1.boolean)("auto_editing_enabled").default(true),
    autoDistributionEnabled: (0, pg_core_1.boolean)("auto_distribution_enabled").default(false),
    preferredPlatforms: (0, pg_core_1.text)("preferred_platforms").array(),
    defaultHashtags: (0, pg_core_1.text)("default_hashtags").array(),
    aiPricingSuggestions: (0, pg_core_1.boolean)("ai_pricing_suggestions").default(true),
    defaultPricePerView: (0, pg_core_1.integer)("default_price_per_view"), // in cents
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)("updated_at").defaultNow(),
});
// Live Stream Co-Star Verification
exports.liveStreamCoStars = (0, pg_core_1.pgTable)("live_stream_co_stars", {
    id: (0, pg_core_1.varchar)("id").primaryKey().default((0, drizzle_orm_1.sql) `gen_random_uuid()`),
    streamId: (0, pg_core_1.varchar)("stream_id").references(() => exports.liveStreams.id, { onDelete: "cascade" }).notNull(),
    coStarId: (0, pg_core_1.varchar)("co_star_id").references(() => exports.users.id, { onDelete: "cascade" }).notNull(),
    verificationStatus: (0, exports.kycStatusEnum)("verification_status").default("pending"),
    verifiedAt: (0, pg_core_1.timestamp)("verified_at"),
    joinedAt: (0, pg_core_1.timestamp)("joined_at"),
    leftAt: (0, pg_core_1.timestamp)("left_at"),
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow(),
});
// Zod Schemas
exports.insertFanzTransactionSchema = (0, drizzle_zod_1.createInsertSchema)(exports.fanzTransactions).omit({
    id: true,
    createdAt: true,
    completedAt: true,
});
exports.insertRefundRequestSchema = (0, drizzle_zod_1.createInsertSchema)(exports.refundRequests).omit({
    id: true,
    createdAt: true,
    reviewedAt: true,
    completedAt: true,
});
exports.insertFanzWalletSchema = (0, drizzle_zod_1.createInsertSchema)(exports.fanzWallets).omit({
    id: true,
    createdAt: true,
    updatedAt: true,
});
exports.insertWalletTransactionSchema = (0, drizzle_zod_1.createInsertSchema)(exports.walletTransactions).omit({
    id: true,
    createdAt: true,
});
// ====================================
// INFINITY SCROLL FEED - Zod Schemas
// ====================================
exports.insertFeedPostSchema = (0, drizzle_zod_1.createInsertSchema)(exports.feedPosts).omit({
    id: true,
    createdAt: true,
    updatedAt: true,
});
exports.insertPostMediaSchema = (0, drizzle_zod_1.createInsertSchema)(exports.postMedia).omit({
    id: true,
    createdAt: true,
});
exports.insertSponsoredPostSchema = (0, drizzle_zod_1.createInsertSchema)(exports.sponsoredPosts).omit({
    id: true,
    createdAt: true,
    updatedAt: true,
    impressions: true,
    clicks: true,
    spent: true,
});
exports.insertUserFollowSchema = (0, drizzle_zod_1.createInsertSchema)(exports.userFollows).omit({
    id: true,
    createdAt: true,
});
exports.insertAgeVerificationSchema = (0, drizzle_zod_1.createInsertSchema)(exports.ageVerifications).omit({
    id: true,
    createdAt: true,
    updatedAt: true,
});
// Comments, Streams, AI, VR Zod Schemas
exports.insertPostCommentSchema = (0, drizzle_zod_1.createInsertSchema)(exports.postComments).omit({
    id: true,
    createdAt: true,
    updatedAt: true,
    likes: true,
    isEdited: true,
});
exports.insertLiveStreamSchema = (0, drizzle_zod_1.createInsertSchema)(exports.liveStreams).omit({
    id: true,
    createdAt: true,
    updatedAt: true,
    viewerCount: true,
    totalViews: true,
    streamKey: true,
    playbackUrl: true,
});
exports.insertUserPreferencesSchema = (0, drizzle_zod_1.createInsertSchema)(exports.userPreferences).omit({
    id: true,
    createdAt: true,
    updatedAt: true,
});
exports.insertContentInteractionSchema = (0, drizzle_zod_1.createInsertSchema)(exports.contentInteractions).omit({
    id: true,
    createdAt: true,
});
exports.insertVrContentSchema = (0, drizzle_zod_1.createInsertSchema)(exports.vrContent).omit({
    id: true,
    createdAt: true,
});
// ====================================
// CONTENT CREATION - Zod Schemas & Types
// ====================================
exports.insertContentCreationSessionSchema = (0, drizzle_zod_1.createInsertSchema)(exports.contentCreationSessions).omit({
    id: true,
    createdAt: true,
    updatedAt: true,
});
exports.insertEditingTaskSchema = (0, drizzle_zod_1.createInsertSchema)(exports.editingTasks).omit({
    id: true,
    createdAt: true,
    startedAt: true,
    completedAt: true,
    progress: true,
});
exports.insertContentVersionSchema = (0, drizzle_zod_1.createInsertSchema)(exports.contentVersions).omit({
    id: true,
    createdAt: true,
});
exports.insertDistributionCampaignSchema = (0, drizzle_zod_1.createInsertSchema)(exports.distributionCampaigns).omit({
    id: true,
    createdAt: true,
    publishedAt: true,
});
exports.insertPlatformDistributionSchema = (0, drizzle_zod_1.createInsertSchema)(exports.platformDistributions).omit({
    id: true,
    createdAt: true,
    publishedAt: true,
});
exports.insertCreatorStudioSettingsSchema = (0, drizzle_zod_1.createInsertSchema)(exports.creatorStudioSettings).omit({
    id: true,
    createdAt: true,
    updatedAt: true,
});
exports.insertGeneratedAssetSchema = (0, drizzle_zod_1.createInsertSchema)(exports.generatedAssets).omit({
    id: true,
    createdAt: true,
});
exports.insertContentAnalyticsSchema = (0, drizzle_zod_1.createInsertSchema)(exports.contentAnalytics).omit({
    id: true,
    updatedAt: true,
});
// ====================================
// FanzTrust™ API Response Types
// ====================================
// Wallet API Response
exports.walletResponseSchema = zod_1.z.object({
    id: zod_1.z.string(),
    userId: zod_1.z.string(),
    type: zod_1.z.string(),
    fanzCoin: zod_1.z.number().default(0),
    fanzToken: zod_1.z.number().default(0),
    fanzCredit: zod_1.z.number().default(0),
    walletAddress: zod_1.z.string().nullable().optional(),
    cryptoWallets: zod_1.z.array(zod_1.z.object({
        provider: zod_1.z.string(),
        walletAddress: zod_1.z.string(),
        network: zod_1.z.string(),
    })).optional(),
    createdAt: zod_1.z.date(),
    updatedAt: zod_1.z.date(),
});
// Trust Score API Response
exports.trustScoreResponseSchema = zod_1.z.object({
    id: zod_1.z.string(),
    fanId: zod_1.z.string(),
    score: zod_1.z.number(),
    level: zod_1.z.string(),
    successfulTransactions: zod_1.z.number(),
    refundsInitiated: zod_1.z.number(),
    fraudFlags: zod_1.z.number(),
    lastCalculated: zod_1.z.date(),
});
// Transaction List API Response
exports.transactionResponseSchema = zod_1.z.object({
    id: zod_1.z.string(),
    amount: zod_1.z.number(),
    currency: zod_1.z.string(),
    gateway: zod_1.z.string(),
    status: zod_1.z.string(),
    type: zod_1.z.enum(['deposit', 'withdrawal', 'purchase', 'refund']),
    createdAt: zod_1.z.date(),
    completedAt: zod_1.z.date().nullable().optional(),
});
