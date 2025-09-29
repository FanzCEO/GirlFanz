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

// User storage table (required for Replit Auth)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  username: varchar("username").unique(),
  password: varchar("password"), // For local auth
  role: userRoleEnum("role").default("fan"),
  status: userStatusEnum("status").default("active"),
  authProvider: authProviderEnum("auth_provider").default("replit"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Creator/Fan profiles
export const profiles = pgTable("profiles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  displayName: varchar("display_name"),
  bio: text("bio"),
  avatarUrl: varchar("avatar_url"),
  bannerUrl: varchar("banner_url"),
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

export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertSupportTicketForm = z.infer<typeof insertSupportTicketSchema>;
export type InsertKnowledgeArticleForm = z.infer<typeof insertKnowledgeArticleSchema>;
export type InsertTutorialForm = z.infer<typeof insertTutorialSchema>;
