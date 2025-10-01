import { sql } from 'drizzle-orm';
import { relations } from 'drizzle-orm';
import {
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table (required for Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// Enums
export const userRoleEnum = pgEnum("user_role", ["fan", "creator", "admin", "support"]);
export const userStatusEnum = pgEnum("user_status", ["active", "suspended", "banned"]);
export const authProviderEnum = pgEnum("auth_provider", ["replit", "local"]);
export const kycStatusEnum = pgEnum("kyc_status", ["pending", "verified", "rejected"]);
export const mediaStatusEnum = pgEnum("media_status", ["pending", "approved", "rejected"]);
export const payoutStatusEnum = pgEnum("payout_status", ["pending", "processing", "completed", "failed"]);
export const moderationStatusEnum = pgEnum("moderation_status", ["pending", "approved", "rejected", "flagged"]);
export const subscriptionStatusEnum = pgEnum("subscription_status", ["active", "cancelled", "expired", "suspended"]);
export const transactionStatusEnum = pgEnum("transaction_status", ["pending", "completed", "failed", "refunded", "chargeback"]);
export const paymentProviderEnum = pgEnum("payment_provider", ["ccbill", "segpay", "stripe"]);
export const contentStatusEnum = pgEnum("content_status", ["draft", "processing", "ready", "published", "archived"]);
export const contentTypeEnum = pgEnum("content_type", ["video", "image", "live_stream", "audio", "gif"]);
export const editingStatusEnum = pgEnum("editing_status", ["pending", "processing", "completed", "failed"]);
export const distributionStatusEnum = pgEnum("distribution_status", ["scheduled", "publishing", "published", "failed", "cancelled"]);
export const socialPlatformEnum = pgEnum("social_platform", ["instagram", "tiktok", "twitter", "snapchat", "youtube"]);
export const aspectRatioEnum = pgEnum("aspect_ratio", ["9:16", "16:9", "1:1", "4:5"]);

// User storage table
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique().notNull(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  username: varchar("username").unique(),
  password: varchar("password").notNull(), // Bcrypt hashed password
  role: userRoleEnum("role").default("fan"),
  status: userStatusEnum("status").default("active"),
  authProvider: authProviderEnum("auth_provider").default("local"),
  isCreator: boolean("is_creator").default(false),
  ageVerified: boolean("age_verified").default(false),
  emailVerified: boolean("email_verified").default(false),
  securityQuestion: varchar("security_question"), // For email recovery
  securityAnswer: varchar("security_answer"), // Hashed answer
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Password reset tokens
export const passwordResetTokens = pgTable("password_reset_tokens", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  token: varchar("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  used: boolean("used").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Email verification tokens
export const emailVerificationTokens = pgTable("email_verification_tokens", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  token: varchar("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  used: boolean("used").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Creator/Fan profiles
export const profiles = pgTable("profiles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  displayName: varchar("display_name"),
  bio: text("bio"),
  avatarUrl: varchar("avatar_url"),
  bannerUrl: varchar("banner_url"),
  pronouns: varchar("pronouns"),
  niches: text("niches").array(),
  interests: text("interests").array(),
  kycStatus: kycStatusEnum("kyc_status").default("pending"),
  ageVerified: boolean("age_verified").default(false),
  subscriptionPrice: integer("subscription_price"), // in cents
  totalEarnings: integer("total_earnings").default(0),
  fanCount: integer("fan_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Media assets (content management)
export const mediaAssets = pgTable("media_assets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  ownerId: varchar("owner_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  title: varchar("title"),
  description: text("description"),
  filename: varchar("filename").notNull(),
  s3Key: varchar("s3_key").notNull(),
  mimeType: varchar("mime_type").notNull(),
  fileSize: integer("file_size"),
  status: mediaStatusEnum("status").default("pending"),
  isPublic: boolean("is_public").default(false),
  price: integer("price"), // in cents, null for free content
  forensicSignature: varchar("forensic_signature"),
  views: integer("views").default(0),
  likes: integer("likes").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// KYC Verifications (compliance)
export const kycVerifications = pgTable("kyc_verifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  provider: varchar("provider").notNull(),
  status: kycStatusEnum("status").default("pending"),
  documentType: varchar("document_type"),
  dataJson: jsonb("data_json"),
  verifiedAt: timestamp("verified_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// 2257 Records (adult industry compliance)
export const records2257 = pgTable("records_2257", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  docType: varchar("doc_type").notNull(),
  s3Key: varchar("s3_key").notNull(),
  checksum: varchar("checksum").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Moderation Queue
export const moderationQueue = pgTable("moderation_queue", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  mediaId: varchar("media_id").references(() => mediaAssets.id, { onDelete: "cascade" }).notNull(),
  status: moderationStatusEnum("status").default("pending"),
  reviewerId: varchar("reviewer_id").references(() => users.id),
  notes: text("notes"),
  priority: integer("priority").default(1),
  aiConfidence: integer("ai_confidence"), // 0-100
  reportCount: integer("report_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  reviewedAt: timestamp("reviewed_at"),
});

// Payout Accounts (adult-friendly providers only)
export const payoutAccounts = pgTable("payout_accounts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  provider: varchar("provider").notNull(), // Paxum, ePayService, etc.
  accountRef: varchar("account_ref").notNull(),
  status: varchar("status").default("active"),
  isDefault: boolean("is_default").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Payout Requests
export const payoutRequests = pgTable("payout_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  accountId: varchar("account_id").references(() => payoutAccounts.id).notNull(),
  amountCents: integer("amount_cents").notNull(),
  currency: varchar("currency").default("USD"),
  status: payoutStatusEnum("status").default("pending"),
  providerRef: varchar("provider_ref"),
  processingFee: integer("processing_fee"),
  createdAt: timestamp("created_at").defaultNow(),
  processedAt: timestamp("processed_at"),
});

// Webhooks (payment notifications)
export const webhooks = pgTable("webhooks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  url: varchar("url").notNull(),
  secret: varchar("secret").notNull(),
  eventsJson: jsonb("events_json"),
  status: varchar("status").default("active"),
  lastPing: timestamp("last_ping"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Subscriptions (for creator tiers, content access)
export const subscriptions = pgTable("subscriptions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  creatorId: varchar("creator_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  provider: paymentProviderEnum("provider").notNull(),
  providerSubscriptionId: varchar("provider_subscription_id").unique(),
  status: subscriptionStatusEnum("status").default("active"),
  pricePerMonth: integer("price_per_month").notNull(), // in cents
  currency: varchar("currency").default("USD"),
  billingCycle: varchar("billing_cycle").default("monthly"),
  nextBillingDate: timestamp("next_billing_date"),
  cancelledAt: timestamp("cancelled_at"),
  expiredAt: timestamp("expired_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Transactions (one-time purchases, tips, subscription payments)  
export const transactions = pgTable("transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  creatorId: varchar("creator_id").references(() => users.id, { onDelete: "cascade" }),
  mediaId: varchar("media_id").references(() => mediaAssets.id),
  subscriptionId: varchar("subscription_id").references(() => subscriptions.id),
  provider: paymentProviderEnum("provider").notNull(),
  providerTransactionId: varchar("provider_transaction_id").unique(),
  type: varchar("type").notNull(), // subscription, purchase, tip, refund
  status: transactionStatusEnum("status").default("pending"),
  amountCents: integer("amount_cents").notNull(),
  currency: varchar("currency").default("USD"),
  providerFee: integer("provider_fee"),
  platformFee: integer("platform_fee"),
  creatorEarnings: integer("creator_earnings"),
  metadata: jsonb("metadata"), // provider-specific data
  ipAddress: varchar("ip_address"),
  userAgent: varchar("user_agent"),
  createdAt: timestamp("created_at").defaultNow(),
  processedAt: timestamp("processed_at"),
});

// Messages
export const messages = pgTable("messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  senderId: varchar("sender_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  receiverId: varchar("receiver_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  content: text("content").notNull(),
  mediaUrl: varchar("media_url"),
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Audit Logs (compliance tracking)
export const auditLogs = pgTable("audit_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  actorId: varchar("actor_id").references(() => users.id),
  action: varchar("action").notNull(),
  targetType: varchar("target_type").notNull(),
  targetId: varchar("target_id"),
  metadata: jsonb("metadata"),
  ipAddress: varchar("ip_address"),
  userAgent: varchar("user_agent"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Support Tickets System
export const supportTickets = pgTable("support_tickets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  subject: varchar("subject", { length: 255 }).notNull(),
  category: varchar("category").notNull().default("tech"), // tech, billing, moderation, feature, other
  priority: varchar("priority").notNull().default("normal"), // low, normal, high, critical
  status: varchar("status").notNull().default("open"), // open, in_progress, resolved, closed
  assignedTo: varchar("assigned_to").references(() => users.id),
  source: varchar("source").notNull().default("web"), // web, ws, email
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const supportMessages = pgTable("support_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  ticketId: varchar("ticket_id").references(() => supportTickets.id, { onDelete: "cascade" }).notNull(),
  senderId: varchar("sender_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  body: text("body").notNull(),
  attachments: text("attachments").array(),
  isInternalNote: boolean("is_internal_note").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Knowledge Base / AI Wiki
export const knowledgeArticles = pgTable("knowledge_articles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: varchar("title", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  summary: text("summary"),
  content: text("content").notNull(),
  tags: text("tags").array(),
  status: varchar("status").notNull().default("draft"), // draft, published, archived
  createdBy: varchar("created_by").references(() => users.id, { onDelete: "cascade" }).notNull(),
  updatedBy: varchar("updated_by").references(() => users.id),
  publishedAt: timestamp("published_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const knowledgeEmbeddings = pgTable("knowledge_embeddings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  articleId: varchar("article_id").references(() => knowledgeArticles.id, { onDelete: "cascade" }).notNull(),
  embedding: text("embedding").notNull(), // JSON string of vector embedding
  chunkIndex: integer("chunk_index").notNull(),
  chunkContent: text("chunk_content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Tutorials System
export const tutorials = pgTable("tutorials", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: varchar("title", { length: 255 }).notNull(),
  roleTarget: varchar("role_target").notNull().default("all"), // fan, creator, admin, all
  difficulty: varchar("difficulty").notNull().default("beginner"), // beginner, intermediate, advanced
  estimatedMinutes: integer("estimated_minutes").default(10),
  coverImageUrl: varchar("cover_image_url"),
  summary: text("summary"),
  status: varchar("status").notNull().default("draft"), // draft, published, archived
  createdBy: varchar("created_by").references(() => users.id, { onDelete: "cascade" }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const tutorialSteps = pgTable("tutorial_steps", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tutorialId: varchar("tutorial_id").references(() => tutorials.id, { onDelete: "cascade" }).notNull(),
  stepNumber: integer("step_number").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  body: text("body").notNull(),
  mediaUrl: varchar("media_url"),
  checklist: text("checklist"), // JSON string of checklist items
  createdAt: timestamp("created_at").defaultNow(),
});

export const tutorialProgress = pgTable("tutorial_progress", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tutorialId: varchar("tutorial_id").references(() => tutorials.id, { onDelete: "cascade" }).notNull(),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  completedStep: integer("completed_step").default(0),
  startedAt: timestamp("started_at").defaultNow(),
  completedAt: timestamp("completed_at"),
});

// ====================================
// INFINITY SCROLL FEED SYSTEM
// ====================================

// Feed-specific enums
export const postTypeEnum = pgEnum("post_type", ["text", "image", "video", "mixed"]);
export const postVisibilityEnum = pgEnum("post_visibility", ["free", "subscriber", "paid", "followers"]);
export const contentRatingEnum = pgEnum("content_rating", ["safe", "suggestive", "explicit"]);

// Feed Posts
export const feedPosts = pgTable("feed_posts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  creatorId: varchar("creator_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  type: postTypeEnum("type").default("text"),
  content: text("content"), // Text content or caption
  visibility: postVisibilityEnum("visibility").default("subscriber"),
  priceInCents: integer("price_in_cents"), // For paid posts
  isFreePreview: boolean("is_free_preview").default(false), // Creator allows free preview
  requiresAgeVerification: boolean("requires_age_verification").default(true),
  contentRating: contentRatingEnum("content_rating").default("explicit"),
  isPinned: boolean("is_pinned").default(false),
  isPublished: boolean("is_published").default(true),
  scheduledAt: timestamp("scheduled_at"), // For scheduled posts
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Post Media (ordered media items)
export const postMedia = pgTable("post_media", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  postId: varchar("post_id").references(() => feedPosts.id, { onDelete: "cascade" }).notNull(),
  mediaUrl: varchar("media_url").notNull(),
  thumbnailUrl: varchar("thumbnail_url"),
  mediaType: varchar("media_type").notNull(), // image, video
  mimeType: varchar("mime_type"),
  duration: integer("duration"), // For videos (seconds)
  width: integer("width"),
  height: integer("height"),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

// Post Engagement Metrics
export const postEngagement = pgTable("post_engagement", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  postId: varchar("post_id").references(() => feedPosts.id, { onDelete: "cascade" }).notNull(),
  views: integer("views").default(0),
  likes: integer("likes").default(0),
  comments: integer("comments").default(0),
  shares: integer("shares").default(0),
  unlocks: integer("unlocks").default(0), // For paid posts
  watchTimeSeconds: integer("watch_time_seconds").default(0), // For videos
  updatedAt: timestamp("updated_at").defaultNow(),
});

// User Follows (for following creators without subscribing)
export const userFollows = pgTable("user_follows", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  followerId: varchar("follower_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  creatorId: varchar("creator_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  notificationsEnabled: boolean("notifications_enabled").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Age Verifications (VerifyMy integration cache)
export const ageVerifications = pgTable("age_verifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull().unique(),
  provider: varchar("provider").default("verifymyage"), // verifymyage, manual, etc.
  isVerified: boolean("is_verified").default(false),
  verifiedAt: timestamp("verified_at"),
  verificationToken: varchar("verification_token"),
  dateOfBirth: timestamp("date_of_birth"),
  documentType: varchar("document_type"),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Sponsored Posts / Ads
export const sponsoredPosts = pgTable("sponsored_posts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: varchar("title").notNull(),
  description: text("description"),
  mediaUrl: varchar("media_url"),
  clickUrl: varchar("click_url").notNull(),
  isActive: boolean("is_active").default(true),
  impressions: integer("impressions").default(0),
  clicks: integer("clicks").default(0),
  budget: integer("budget"), // in cents
  spent: integer("spent").default(0), // in cents
  targetAudience: jsonb("target_audience"), // Demographics, interests, etc.
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Post Likes (for tracking individual likes)
export const postLikes = pgTable("post_likes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  postId: varchar("post_id").references(() => feedPosts.id, { onDelete: "cascade" }).notNull(),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Post Unlocks (tracking paid post purchases)
export const postUnlocks = pgTable("post_unlocks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  postId: varchar("post_id").references(() => feedPosts.id, { onDelete: "cascade" }).notNull(),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  transactionId: varchar("transaction_id").references(() => transactions.id),
  paidAmount: integer("paid_amount"), // in cents
  createdAt: timestamp("created_at").defaultNow(),
});

// Post Comments (threaded comments system)
export const postComments = pgTable("post_comments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  postId: varchar("post_id").references(() => feedPosts.id, { onDelete: "cascade" }).notNull(),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  parentId: varchar("parent_id"), // For threaded replies
  content: text("content").notNull(),
  likes: integer("likes").default(0),
  isEdited: boolean("is_edited").default(false),
  isPinned: boolean("is_pinned").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Comment Likes
export const commentLikes = pgTable("comment_likes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  commentId: varchar("comment_id").references(() => postComments.id, { onDelete: "cascade" }).notNull(),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Live Streams
export const liveStreams = pgTable("live_streams", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  creatorId: varchar("creator_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  title: varchar("title").notNull(),
  description: text("description"),
  thumbnailUrl: varchar("thumbnail_url"),
  streamKey: varchar("stream_key").notNull().unique(),
  playbackUrl: varchar("playback_url"),
  status: varchar("status").default("scheduled"), // scheduled, live, ended
  visibility: postVisibilityEnum("visibility").default("subscriber"),
  priceInCents: integer("price_in_cents"),
  viewerCount: integer("viewer_count").default(0),
  totalViews: integer("total_views").default(0),
  scheduledAt: timestamp("scheduled_at"),
  startedAt: timestamp("started_at"),
  endedAt: timestamp("ended_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Stream Views (tracking who watched)
export const streamViews = pgTable("stream_views", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  streamId: varchar("stream_id").references(() => liveStreams.id, { onDelete: "cascade" }).notNull(),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  watchTimeSeconds: integer("watch_time_seconds").default(0),
  tippedAmount: integer("tipped_amount").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// AI Recommendation Engine
export const userPreferences = pgTable("user_preferences", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull().unique(),
  preferredCategories: text("preferred_categories").array(),
  blockedCreators: text("blocked_creators").array(),
  blockedKeywords: text("blocked_keywords").array(),
  contentPreferences: jsonb("content_preferences"), // Detailed preferences JSON
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Content Interactions (for AI recommendations)
export const contentInteractions = pgTable("content_interactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  postId: varchar("post_id").references(() => feedPosts.id, { onDelete: "cascade" }),
  streamId: varchar("stream_id").references(() => liveStreams.id, { onDelete: "cascade" }),
  interactionType: varchar("interaction_type").notNull(), // view, like, comment, share, skip, hide
  watchTimeSeconds: integer("watch_time_seconds"),
  engagementScore: integer("engagement_score"), // 0-100 calculated score
  createdAt: timestamp("created_at").defaultNow(),
});

// VR/AR Content Metadata
export const vrContent = pgTable("vr_content", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  postId: varchar("post_id").references(() => feedPosts.id, { onDelete: "cascade" }),
  mediaId: varchar("media_id").references(() => mediaAssets.id, { onDelete: "cascade" }),
  vrType: varchar("vr_type").notNull(), // 360_video, 180_video, 3d_model, ar_filter
  resolution: varchar("resolution"), // 4K, 8K, etc.
  stereoscopicMode: varchar("stereoscopic_mode"), // mono, stereo_lr, stereo_tb
  projectionType: varchar("projection_type"), // equirectangular, cubemap
  modelFormat: varchar("model_format"), // gltf, fbx, obj
  arTrackingType: varchar("ar_tracking_type"), // face, world, image
  metadata: jsonb("metadata"), // Additional VR/AR specific data
  createdAt: timestamp("created_at").defaultNow(),
});

// ====================================
// ENHANCED LIVE STREAMING SYSTEM
// ====================================

// Stream Participants (Co-stars)
export const streamParticipants = pgTable("stream_participants", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  streamId: varchar("stream_id").references(() => liveStreams.id, { onDelete: "cascade" }).notNull(),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  role: varchar("role").notNull().default("co-star"), // host, co-star, moderator
  isVerified: boolean("is_verified").default(false),
  verificationStatus: varchar("verification_status").default("pending"), // pending, verified, failed
  verifiedAt: timestamp("verified_at"),
  joinedAt: timestamp("joined_at"),
  leftAt: timestamp("left_at"),
  streamQuality: varchar("stream_quality").default("720p"), // 360p, 720p, 1080p, 4K
  audioEnabled: boolean("audio_enabled").default(true),
  videoEnabled: boolean("video_enabled").default(true),
  screenPosition: jsonb("screen_position"), // {x, y, width, height} for multi-person layout
  createdAt: timestamp("created_at").defaultNow(),
});

// Stream Chat Messages
export const streamChatMessages = pgTable("stream_chat_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  streamId: varchar("stream_id").references(() => liveStreams.id, { onDelete: "cascade" }).notNull(),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  message: text("message").notNull(),
  messageType: varchar("message_type").default("text"), // text, emote, announcement, system
  isPinned: boolean("is_pinned").default(false),
  isModerated: boolean("is_moderated").default(false),
  moderatedBy: varchar("moderated_by").references(() => users.id),
  replyToId: varchar("reply_to_id"), // For threaded messages
  metadata: jsonb("metadata"), // emotes, mentions, etc.
  createdAt: timestamp("created_at").defaultNow(),
});

// Stream Gifts
export const streamGifts = pgTable("stream_gifts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  streamId: varchar("stream_id").references(() => liveStreams.id, { onDelete: "cascade" }).notNull(),
  senderId: varchar("sender_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  receiverId: varchar("receiver_id").references(() => users.id, { onDelete: "cascade" }).notNull(), // Can be host or co-star
  giftType: varchar("gift_type").notNull(), // rose, heart, diamond, fireworks, etc.
  giftValue: integer("gift_value").notNull(), // in cents
  quantity: integer("quantity").default(1),
  animationType: varchar("animation_type").default("floating"), // floating, explosion, rain
  message: text("message"),
  isAnonymous: boolean("is_anonymous").default(false),
  transactionId: varchar("transaction_id").references(() => transactions.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Stream Reactions (real-time reactions)
export const streamReactions = pgTable("stream_reactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  streamId: varchar("stream_id").references(() => liveStreams.id, { onDelete: "cascade" }).notNull(),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  reactionType: varchar("reaction_type").notNull(), // heart, fire, laugh, wow, clap
  intensity: integer("intensity").default(1), // 1-10 for reaction strength
  timestamp: integer("timestamp"), // Stream timestamp in seconds
  createdAt: timestamp("created_at").defaultNow(),
});

// Stream Highlights (AI-detected or manual)
export const streamHighlights = pgTable("stream_highlights", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  streamId: varchar("stream_id").references(() => liveStreams.id, { onDelete: "cascade" }).notNull(),
  title: varchar("title"),
  startTime: integer("start_time").notNull(), // seconds from stream start
  endTime: integer("end_time").notNull(), // seconds from stream start
  clipUrl: varchar("clip_url"),
  thumbnailUrl: varchar("thumbnail_url"),
  highlightType: varchar("highlight_type").notNull(), // ai_detected, manual, peak_viewers, peak_gifts
  score: integer("score").default(0), // AI confidence score 0-100
  tags: text("tags").array(),
  metadata: jsonb("metadata"), // AI analysis data
  createdAt: timestamp("created_at").defaultNow(),
});

// Stream Recordings
export const streamRecordings = pgTable("stream_recordings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  streamId: varchar("stream_id").references(() => liveStreams.id, { onDelete: "cascade" }).notNull(),
  recordingUrl: varchar("recording_url").notNull(),
  thumbnailUrl: varchar("thumbnail_url"),
  duration: integer("duration"), // in seconds
  fileSize: integer("file_size"), // in bytes
  resolution: varchar("resolution"), // 1080p, 720p, etc.
  format: varchar("format").default("mp4"), // mp4, webm, etc.
  status: varchar("status").default("processing"), // processing, ready, failed
  processedAt: timestamp("processed_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Stream Viewers (active viewer tracking)
export const streamViewers = pgTable("stream_viewers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  streamId: varchar("stream_id").references(() => liveStreams.id, { onDelete: "cascade" }).notNull(),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  joinedAt: timestamp("joined_at").defaultNow(),
  leftAt: timestamp("left_at"),
  watchTimeSeconds: integer("watch_time_seconds").default(0),
  peakQuality: varchar("peak_quality"), // Highest quality watched
  deviceType: varchar("device_type"), // mobile, desktop, tablet, tv
  location: varchar("location"), // Country/region
  connectionQuality: varchar("connection_quality"), // excellent, good, poor
  bufferingEvents: integer("buffering_events").default(0),
  isActive: boolean("is_active").default(true),
});

// Stream Analytics (aggregated metrics)
export const streamAnalytics = pgTable("stream_analytics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  streamId: varchar("stream_id").references(() => liveStreams.id, { onDelete: "cascade" }).notNull().unique(),
  peakViewers: integer("peak_viewers").default(0),
  avgViewers: integer("avg_viewers").default(0),
  totalViewers: integer("total_viewers").default(0),
  totalWatchTimeMinutes: integer("total_watch_time_minutes").default(0),
  totalGifts: integer("total_gifts").default(0),
  totalGiftValue: integer("total_gift_value").default(0), // in cents
  totalReactions: integer("total_reactions").default(0),
  totalChatMessages: integer("total_chat_messages").default(0),
  engagementScore: integer("engagement_score").default(0), // 0-100
  viewerRetention: jsonb("viewer_retention"), // {time: percentage} graph data
  demographicsData: jsonb("demographics_data"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ one, many }) => ({
  profile: one(profiles, { fields: [users.id], references: [profiles.userId] }),
  mediaAssets: many(mediaAssets),
  kycVerifications: many(kycVerifications),
  payoutAccounts: many(payoutAccounts),
  payoutRequests: many(payoutRequests),
  subscriptionsAsFan: many(subscriptions, { relationName: "subscriber" }),
  subscriptionsAsCreator: many(subscriptions, { relationName: "creator" }),
  transactionsAsBuyer: many(transactions, { relationName: "buyer" }),
  transactionsAsCreator: many(transactions, { relationName: "creator" }),
  sentMessages: many(messages, { relationName: "sender" }),
  receivedMessages: many(messages, { relationName: "receiver" }),
}));

export const profilesRelations = relations(profiles, ({ one }) => ({
  user: one(users, { fields: [profiles.userId], references: [users.id] }),
}));

export const mediaAssetsRelations = relations(mediaAssets, ({ one, many }) => ({
  owner: one(users, { fields: [mediaAssets.ownerId], references: [users.id] }),
  moderationQueue: many(moderationQueue),
}));

export const moderationQueueRelations = relations(moderationQueue, ({ one }) => ({
  media: one(mediaAssets, { fields: [moderationQueue.mediaId], references: [mediaAssets.id] }),
  reviewer: one(users, { fields: [moderationQueue.reviewerId], references: [users.id] }),
}));

export const subscriptionsRelations = relations(subscriptions, ({ one }) => ({
  subscriber: one(users, { fields: [subscriptions.userId], references: [users.id], relationName: "subscriber" }),
  creator: one(users, { fields: [subscriptions.creatorId], references: [users.id], relationName: "creator" }),
}));

export const transactionsRelations = relations(transactions, ({ one }) => ({
  buyer: one(users, { fields: [transactions.userId], references: [users.id], relationName: "buyer" }),
  creator: one(users, { fields: [transactions.creatorId], references: [users.id], relationName: "creator" }),
  media: one(mediaAssets, { fields: [transactions.mediaId], references: [mediaAssets.id] }),
  subscription: one(subscriptions, { fields: [transactions.subscriptionId], references: [subscriptions.id] }),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  sender: one(users, { fields: [messages.senderId], references: [users.id], relationName: "sender" }),
  receiver: one(users, { fields: [messages.receiverId], references: [users.id], relationName: "receiver" }),
}));

// Schema types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type Profile = typeof profiles.$inferSelect;
export type InsertProfile = typeof profiles.$inferInsert;
export type MediaAsset = typeof mediaAssets.$inferSelect;
export type InsertMediaAsset = typeof mediaAssets.$inferInsert;
export type ModerationItem = typeof moderationQueue.$inferSelect;
export type Message = typeof messages.$inferSelect;
export type InsertMessage = typeof messages.$inferInsert;
export type PayoutAccount = typeof payoutAccounts.$inferSelect;
export type PayoutRequest = typeof payoutRequests.$inferSelect;
export type Subscription = typeof subscriptions.$inferSelect;
export type InsertSubscription = typeof subscriptions.$inferInsert;
export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = typeof transactions.$inferInsert;
export type AuditLog = typeof auditLogs.$inferSelect;

// New table types
export type SupportTicket = typeof supportTickets.$inferSelect;
export type InsertSupportTicket = typeof supportTickets.$inferInsert;
export type SupportMessage = typeof supportMessages.$inferSelect;
export type InsertSupportMessage = typeof supportMessages.$inferInsert;
export type KnowledgeArticle = typeof knowledgeArticles.$inferSelect;
export type InsertKnowledgeArticle = typeof knowledgeArticles.$inferInsert;
export type Tutorial = typeof tutorials.$inferSelect;
export type InsertTutorial = typeof tutorials.$inferInsert;
export type TutorialStep = typeof tutorialSteps.$inferSelect;
export type TutorialProgress = typeof tutorialProgress.$inferSelect;
export type KycVerification = typeof kycVerifications.$inferSelect;
export type InsertKycVerification = typeof kycVerifications.$inferInsert;

// Zod schemas for validation
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
});

export const insertProfileSchema = createInsertSchema(profiles).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertMediaAssetSchema = createInsertSchema(mediaAssets).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  views: true,
  likes: true,
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  createdAt: true,
  isRead: true,
});

export const insertSubscriptionSchema = createInsertSchema(subscriptions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTransactionSchema = createInsertSchema(transactions).omit({
  id: true,
  createdAt: true,
  processedAt: true,
});

export const insertSupportTicketSchema = createInsertSchema(supportTickets).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSupportMessageSchema = createInsertSchema(supportMessages).omit({
  id: true,
  createdAt: true,
});

export const insertKnowledgeArticleSchema = createInsertSchema(knowledgeArticles).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  publishedAt: true,
});

export const insertTutorialSchema = createInsertSchema(tutorials).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// FanzTrust™ Payment & Refund System
export const paymentGatewayEnum = pgEnum("payment_gateway", [
  "metamask", "solana", "tronlink",  // Crypto wallets
  "rocketgate", "segpay", "ccbill",   // Adult-friendly processors
  "fanzpay", "fanztoken", "fanzcoin"  // Fanz native systems
]);

export const refundStatusEnum = pgEnum("refund_status", [
  "pending", "auto_approved", "manual_review", "approved", "denied", "completed"
]);

export const trustScoreEnum = pgEnum("trust_level", [
  "new", "trusted", "verified", "flagged", "banned"
]);

// FanzTrust Transactions
export const fanzTransactions = pgTable("fanz_transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  fanId: varchar("fan_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  creatorId: varchar("creator_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  gateway: paymentGatewayEnum("gateway").notNull(),
  txid: varchar("txid"), // Transaction ID from gateway or blockchain
  amount: integer("amount").notNull(), // in cents or smallest unit
  currency: varchar("currency").default("USD"), // USD, SOL, TRX, FANZ, etc.
  walletAddress: varchar("wallet_address"),
  email: varchar("email"),
  last4: varchar("last_4"), // Last 4 digits for card transactions
  status: transactionStatusEnum("status").default("pending"),
  ipAddress: varchar("ip_address"),
  deviceFingerprint: varchar("device_fingerprint"),
  contentAccessed: boolean("content_accessed").default(false),
  subscriptionId: varchar("subscription_id"),
  metadata: jsonb("metadata"), // Additional gateway-specific data
  createdAt: timestamp("created_at").defaultNow(),
  completedAt: timestamp("completed_at"),
});

// Refund Requests
export const refundRequests = pgTable("refund_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  transactionId: varchar("transaction_id").references(() => fanzTransactions.id, { onDelete: "cascade" }).notNull(),
  fanId: varchar("fan_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  creatorId: varchar("creator_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  reason: text("reason").notNull(),
  status: refundStatusEnum("status").default("pending"),
  verificationResult: jsonb("verification_result"), // Auto-verification data
  isAutoApproved: boolean("is_auto_approved").default(false),
  reviewedBy: varchar("reviewed_by").references(() => users.id),
  reviewNotes: text("review_notes"),
  amount: integer("amount").notNull(),
  ipAddress: varchar("ip_address"),
  deviceFingerprint: varchar("device_fingerprint"),
  fraudScore: integer("fraud_score").default(0), // 0-100
  createdAt: timestamp("created_at").defaultNow(),
  reviewedAt: timestamp("reviewed_at"),
  completedAt: timestamp("completed_at"),
});

// FanzPay/FanzToken System
export const fanzWallets = pgTable("fanz_wallets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull().unique(),
  fanzTokenBalance: integer("fanz_token_balance").default(0), // FanzToken balance
  fanzCoinBalance: integer("fanz_coin_balance").default(0), // FanzCoin (rewards)
  fanzCreditBalance: integer("fanz_credit_balance").default(0), // Store credit
  totalDeposited: integer("total_deposited").default(0),
  totalSpent: integer("total_spent").default(0),
  totalEarned: integer("total_earned").default(0),
  walletAddress: varchar("wallet_address").unique(), // For crypto withdrawals
  isVerified: boolean("is_verified").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// FanzCard Virtual Cards
export const fanzCards = pgTable("fanz_cards", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  cardNumber: varchar("card_number").notNull().unique(), // Encrypted/masked
  cardType: varchar("card_type").default("virtual"), // virtual, physical
  balance: integer("balance").default(0),
  currency: varchar("currency").default("USD"),
  status: varchar("status").default("active"), // active, frozen, cancelled
  expiryDate: varchar("expiry_date"),
  cvv: varchar("cvv"), // Encrypted
  isDefault: boolean("is_default").default(false),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
  lastUsedAt: timestamp("last_used_at"),
});

// Wallet Transactions
export const walletTransactions = pgTable("wallet_transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  walletId: varchar("wallet_id").references(() => fanzWallets.id, { onDelete: "cascade" }).notNull(),
  type: varchar("type").notNull(), // deposit, withdrawal, purchase, earning, refund, transfer
  amount: integer("amount").notNull(),
  currency: varchar("currency").default("FANZ"),
  fromUser: varchar("from_user").references(() => users.id),
  toUser: varchar("to_user").references(() => users.id),
  relatedTransactionId: varchar("related_transaction_id"),
  description: text("description"),
  status: varchar("status").default("completed"), // pending, completed, failed
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Fan Trust Scores
export const fanTrustScores = pgTable("fan_trust_scores", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  fanId: varchar("fan_id").references(() => users.id, { onDelete: "cascade" }).notNull().unique(),
  score: integer("score").default(100), // 0-100
  level: trustScoreEnum("level").default("new"),
  totalTransactions: integer("total_transactions").default(0),
  totalRefunds: integer("total_refunds").default(0),
  falseClaimsCount: integer("false_claims_count").default(0),
  successfulPurchases: integer("successful_purchases").default(0),
  accountAge: integer("account_age").default(0), // days
  lastReviewedAt: timestamp("last_reviewed_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Audit Logs for FanzTrust
export const trustAuditLogs = pgTable("trust_audit_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  action: varchar("action").notNull(), // verify_transaction, request_refund, approve_refund, deny_refund, flag_user
  performedBy: varchar("performed_by").references(() => users.id),
  targetUserId: varchar("target_user_id").references(() => users.id),
  transactionId: varchar("transaction_id").references(() => fanzTransactions.id),
  refundId: varchar("refund_id").references(() => refundRequests.id),
  result: varchar("result"), // success, failure, flagged
  details: jsonb("details"),
  ipAddress: varchar("ip_address"),
  userAgent: varchar("user_agent"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Creator Refund Policies
export const creatorRefundPolicies = pgTable("creator_refund_policies", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  creatorId: varchar("creator_id").references(() => users.id, { onDelete: "cascade" }).notNull().unique(),
  autoApproveEnabled: boolean("auto_approve_enabled").default(true),
  autoApproveTimeLimit: integer("auto_approve_time_limit").default(60), // minutes
  requireContentAccess: boolean("require_content_access").default(true),
  customMessage: text("custom_message"),
  payoutDelayHours: integer("payout_delay_hours").default(24), // Delay for high-risk purchases
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ====================================
// CONTENT CREATION & DISTRIBUTION SYSTEM
// ====================================

// Content Creation Sessions
export const contentCreationSessions = pgTable("content_creation_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  creatorId: varchar("creator_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  title: varchar("title"),
  description: text("description"),
  type: contentTypeEnum("type").notNull(),
  status: contentStatusEnum("status").default("draft"),
  sourceType: varchar("source_type").notNull(), // camera, upload, live_stream, screen_record
  originalFileUrl: varchar("original_file_url"),
  originalFileSize: integer("original_file_size"),
  originalDuration: integer("original_duration"), // in seconds
  originalDimensions: jsonb("original_dimensions"), // {width, height}
  metadata: jsonb("metadata"), // camera settings, filters applied, etc.
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// AI Editing Tasks
export const editingTasks = pgTable("editing_tasks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: varchar("session_id").references(() => contentCreationSessions.id, { onDelete: "cascade" }).notNull(),
  creatorId: varchar("creator_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  status: editingStatusEnum("status").default("pending"),
  editingOptions: jsonb("editing_options"), // {autoCut, addBranding, addIntro, addOutro, stabilize, etc.}
  aiSuggestions: jsonb("ai_suggestions"), // AI-suggested edits
  progress: integer("progress").default(0), // 0-100
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at").defaultNow(),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
});

// Generated Content Versions (multiple aspect ratios, formats)
export const contentVersions = pgTable("content_versions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: varchar("session_id").references(() => contentCreationSessions.id, { onDelete: "cascade" }).notNull(),
  editingTaskId: varchar("editing_task_id").references(() => editingTasks.id),
  aspectRatio: aspectRatioEnum("aspect_ratio").notNull(),
  format: varchar("format").notNull(), // mp4, webm, gif, jpg
  resolution: varchar("resolution"), // 1080p, 720p, etc.
  fileUrl: varchar("file_url").notNull(),
  thumbnailUrl: varchar("thumbnail_url"),
  fileSize: integer("file_size"),
  duration: integer("duration"), // in seconds
  dimensions: jsonb("dimensions"), // {width, height}
  isProcessed: boolean("is_processed").default(false),
  metadata: jsonb("metadata"), // encoding details, bitrate, etc.
  createdAt: timestamp("created_at").defaultNow(),
});

// Distribution Campaigns
export const distributionCampaigns = pgTable("distribution_campaigns", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: varchar("session_id").references(() => contentCreationSessions.id, { onDelete: "cascade" }).notNull(),
  creatorId: varchar("creator_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  name: varchar("name"),
  status: distributionStatusEnum("status").default("scheduled"),
  platforms: text("platforms").array(), // ["instagram", "tiktok", "twitter"]
  publishSchedule: jsonb("publish_schedule"), // {immediate: true, scheduledTime: date, timezone: string}
  distributionSettings: jsonb("distribution_settings"), // {autoHashtags, captions, mentions, etc.}
  qrCodeUrl: varchar("qr_code_url"),
  smartLinkUrl: varchar("smart_link_url"),
  createdAt: timestamp("created_at").defaultNow(),
  scheduledAt: timestamp("scheduled_at"),
  publishedAt: timestamp("published_at"),
});

// Platform Distribution Tasks
export const platformDistributions = pgTable("platform_distributions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  campaignId: varchar("campaign_id").references(() => distributionCampaigns.id, { onDelete: "cascade" }).notNull(),
  contentVersionId: varchar("content_version_id").references(() => contentVersions.id).notNull(),
  platform: socialPlatformEnum("platform").notNull(),
  status: varchar("status").default("pending"), // pending, publishing, published, failed
  platformPostId: varchar("platform_post_id"), // ID from the social platform
  platformUrl: varchar("platform_url"), // Link to the post on the platform
  caption: text("caption"),
  hashtags: text("hashtags").array(),
  mentions: text("mentions").array(),
  errorMessage: text("error_message"),
  platformMetrics: jsonb("platform_metrics"), // views, likes, shares from platform
  createdAt: timestamp("created_at").defaultNow(),
  publishedAt: timestamp("published_at"),
});

// Content Analytics
export const contentAnalytics = pgTable("content_analytics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: varchar("session_id").references(() => contentCreationSessions.id, { onDelete: "cascade" }).notNull(),
  creatorId: varchar("creator_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  totalViews: integer("total_views").default(0),
  totalLikes: integer("total_likes").default(0),
  totalShares: integer("total_shares").default(0),
  totalComments: integer("total_comments").default(0),
  totalRevenue: integer("total_revenue").default(0), // in cents
  avgWatchTime: integer("avg_watch_time").default(0), // in seconds
  clickThroughRate: integer("click_through_rate").default(0), // percentage
  conversionRate: integer("conversion_rate").default(0), // percentage
  demographicsData: jsonb("demographics_data"), // age, gender, location breakdown
  platformBreakdown: jsonb("platform_breakdown"), // metrics per platform
  updatedAt: timestamp("updated_at").defaultNow(),
});

// AI-Generated Assets (trailers, GIFs, highlights)
export const generatedAssets = pgTable("generated_assets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: varchar("session_id").references(() => contentCreationSessions.id, { onDelete: "cascade" }).notNull(),
  assetType: varchar("asset_type").notNull(), // trailer, gif, highlight, thumbnail
  fileUrl: varchar("file_url").notNull(),
  thumbnailUrl: varchar("thumbnail_url"),
  duration: integer("duration"), // in seconds for video assets
  fileSize: integer("file_size"),
  metadata: jsonb("metadata"), // generation settings, AI parameters
  createdAt: timestamp("created_at").defaultNow(),
});

// Creator Studio Settings
export const creatorStudioSettings = pgTable("creator_studio_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  creatorId: varchar("creator_id").references(() => users.id, { onDelete: "cascade" }).notNull().unique(),
  defaultBranding: jsonb("default_branding"), // logo, watermark, brand colors
  defaultIntroUrl: varchar("default_intro_url"),
  defaultOutroUrl: varchar("default_outro_url"),
  autoEditingEnabled: boolean("auto_editing_enabled").default(true),
  autoDistributionEnabled: boolean("auto_distribution_enabled").default(false),
  preferredPlatforms: text("preferred_platforms").array(),
  defaultHashtags: text("default_hashtags").array(),
  aiPricingSuggestions: boolean("ai_pricing_suggestions").default(true),
  defaultPricePerView: integer("default_price_per_view"), // in cents
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Live Stream Co-Star Verification
export const liveStreamCoStars = pgTable("live_stream_co_stars", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  streamId: varchar("stream_id").references(() => liveStreams.id, { onDelete: "cascade" }).notNull(),
  coStarId: varchar("co_star_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  verificationStatus: kycStatusEnum("verification_status").default("pending"),
  verifiedAt: timestamp("verified_at"),
  joinedAt: timestamp("joined_at"),
  leftAt: timestamp("left_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Zod Schemas
export const insertFanzTransactionSchema = createInsertSchema(fanzTransactions).omit({
  id: true,
  createdAt: true,
  completedAt: true,
});

export const insertRefundRequestSchema = createInsertSchema(refundRequests).omit({
  id: true,
  createdAt: true,
  reviewedAt: true,
  completedAt: true,
});

export const insertFanzWalletSchema = createInsertSchema(fanzWallets).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertWalletTransactionSchema = createInsertSchema(walletTransactions).omit({
  id: true,
  createdAt: true,
});

// Type Exports
export type FanzTransaction = typeof fanzTransactions.$inferSelect;
export type InsertFanzTransaction = z.infer<typeof insertFanzTransactionSchema>;
export type RefundRequest = typeof refundRequests.$inferSelect;
export type InsertRefundRequest = z.infer<typeof insertRefundRequestSchema>;
export type FanzWallet = typeof fanzWallets.$inferSelect;
export type FanTrustScore = typeof fanTrustScores.$inferSelect;
export type WalletTransaction = typeof walletTransactions.$inferSelect;

export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertSupportTicketForm = z.infer<typeof insertSupportTicketSchema>;
export type InsertKnowledgeArticleForm = z.infer<typeof insertKnowledgeArticleSchema>;
export type InsertTutorialForm = z.infer<typeof insertTutorialSchema>;

// ====================================
// INFINITY SCROLL FEED - Zod Schemas
// ====================================

export const insertFeedPostSchema = createInsertSchema(feedPosts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPostMediaSchema = createInsertSchema(postMedia).omit({
  id: true,
  createdAt: true,
});

export const insertSponsoredPostSchema = createInsertSchema(sponsoredPosts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  impressions: true,
  clicks: true,
  spent: true,
});

export const insertUserFollowSchema = createInsertSchema(userFollows).omit({
  id: true,
  createdAt: true,
});

export const insertAgeVerificationSchema = createInsertSchema(ageVerifications).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Feed Type Exports
export type FeedPost = typeof feedPosts.$inferSelect;
export type InsertFeedPost = z.infer<typeof insertFeedPostSchema>;
export type PostMedia = typeof postMedia.$inferSelect;
export type InsertPostMedia = z.infer<typeof insertPostMediaSchema>;
export type PostEngagement = typeof postEngagement.$inferSelect;
export type SponsoredPost = typeof sponsoredPosts.$inferSelect;
export type InsertSponsoredPost = z.infer<typeof insertSponsoredPostSchema>;
export type UserFollow = typeof userFollows.$inferSelect;
export type InsertUserFollow = z.infer<typeof insertUserFollowSchema>;
export type AgeVerification = typeof ageVerifications.$inferSelect;
export type InsertAgeVerification = z.infer<typeof insertAgeVerificationSchema>;
export type PostLike = typeof postLikes.$inferSelect;
export type PostUnlock = typeof postUnlocks.$inferSelect;

// Comments, Streams, AI, VR Zod Schemas
export const insertPostCommentSchema = createInsertSchema(postComments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  likes: true,
  isEdited: true,
});

export const insertLiveStreamSchema = createInsertSchema(liveStreams).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  viewerCount: true,
  totalViews: true,
  streamKey: true,
  playbackUrl: true,
});

export const insertUserPreferencesSchema = createInsertSchema(userPreferences).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertContentInteractionSchema = createInsertSchema(contentInteractions).omit({
  id: true,
  createdAt: true,
});

export const insertVrContentSchema = createInsertSchema(vrContent).omit({
  id: true,
  createdAt: true,
});

// Extended Type Exports
export type PostComment = typeof postComments.$inferSelect;
export type InsertPostComment = z.infer<typeof insertPostCommentSchema>;
export type CommentLike = typeof commentLikes.$inferSelect;
export type LiveStream = typeof liveStreams.$inferSelect;
export type InsertLiveStream = z.infer<typeof insertLiveStreamSchema>;
export type StreamView = typeof streamViews.$inferSelect;
export type UserPreferences = typeof userPreferences.$inferSelect;
export type InsertUserPreferences = z.infer<typeof insertUserPreferencesSchema>;
export type ContentInteraction = typeof contentInteractions.$inferSelect;
export type VrContent = typeof vrContent.$inferSelect;
export type InsertVrContent = z.infer<typeof insertVrContentSchema>;

// ====================================
// CONTENT CREATION - Zod Schemas & Types
// ====================================

export const insertContentCreationSessionSchema = createInsertSchema(contentCreationSessions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertEditingTaskSchema = createInsertSchema(editingTasks).omit({
  id: true,
  createdAt: true,
  startedAt: true,
  completedAt: true,
  progress: true,
});

export const insertContentVersionSchema = createInsertSchema(contentVersions).omit({
  id: true,
  createdAt: true,
});

export const insertDistributionCampaignSchema = createInsertSchema(distributionCampaigns).omit({
  id: true,
  createdAt: true,
  publishedAt: true,
});

export const insertPlatformDistributionSchema = createInsertSchema(platformDistributions).omit({
  id: true,
  createdAt: true,
  publishedAt: true,
});

export const insertCreatorStudioSettingsSchema = createInsertSchema(creatorStudioSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertGeneratedAssetSchema = createInsertSchema(generatedAssets).omit({
  id: true,
  createdAt: true,
});

export const insertContentAnalyticsSchema = createInsertSchema(contentAnalytics).omit({
  id: true,
  updatedAt: true,
});

// Content Creation Type Exports
export type ContentCreationSession = typeof contentCreationSessions.$inferSelect;
export type InsertContentCreationSession = z.infer<typeof insertContentCreationSessionSchema>;
export type EditingTask = typeof editingTasks.$inferSelect;
export type InsertEditingTask = z.infer<typeof insertEditingTaskSchema>;
export type ContentVersion = typeof contentVersions.$inferSelect;
export type InsertContentVersion = z.infer<typeof insertContentVersionSchema>;
export type DistributionCampaign = typeof distributionCampaigns.$inferSelect;
export type InsertDistributionCampaign = z.infer<typeof insertDistributionCampaignSchema>;
export type PlatformDistribution = typeof platformDistributions.$inferSelect;
export type InsertPlatformDistribution = z.infer<typeof insertPlatformDistributionSchema>;
export type CreatorStudioSettings = typeof creatorStudioSettings.$inferSelect;
export type InsertCreatorStudioSettings = z.infer<typeof insertCreatorStudioSettingsSchema>;
export type GeneratedAsset = typeof generatedAssets.$inferSelect;
export type InsertGeneratedAsset = z.infer<typeof insertGeneratedAssetSchema>;
export type ContentAnalytics = typeof contentAnalytics.$inferSelect;
export type InsertContentAnalytics = z.infer<typeof insertContentAnalyticsSchema>;

// ====================================
// FanzTrust™ API Response Types
// ====================================

// Wallet API Response
export const walletResponseSchema = z.object({
  id: z.string(),
  userId: z.string(),
  type: z.string(),
  fanzCoin: z.number().default(0),
  fanzToken: z.number().default(0),
  fanzCredit: z.number().default(0),
  walletAddress: z.string().nullable().optional(),
  cryptoWallets: z.array(z.object({
    provider: z.string(),
    walletAddress: z.string(),
    network: z.string(),
  })).optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type WalletResponse = z.infer<typeof walletResponseSchema>;

// Trust Score API Response
export const trustScoreResponseSchema = z.object({
  id: z.string(),
  fanId: z.string(),
  score: z.number(),
  level: z.string(),
  successfulTransactions: z.number(),
  refundsInitiated: z.number(),
  fraudFlags: z.number(),
  lastCalculated: z.date(),
});

export type TrustScoreResponse = z.infer<typeof trustScoreResponseSchema>;

// Transaction List API Response
export const transactionResponseSchema = z.object({
  id: z.string(),
  amount: z.number(),
  currency: z.string(),
  gateway: z.string(),
  status: z.string(),
  type: z.enum(['deposit', 'withdrawal', 'purchase', 'refund']),
  createdAt: z.date(),
  completedAt: z.date().nullable().optional(),
});

export type TransactionResponse = z.infer<typeof transactionResponseSchema>;
