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
export const userRoleEnum = pgEnum("user_role", ["fan", "creator", "admin"]);
export const userStatusEnum = pgEnum("user_status", ["active", "suspended", "banned"]);
export const authProviderEnum = pgEnum("auth_provider", ["replit", "local"]);
export const kycStatusEnum = pgEnum("kyc_status", ["pending", "verified", "rejected"]);
export const mediaStatusEnum = pgEnum("media_status", ["pending", "approved", "rejected"]);
export const payoutStatusEnum = pgEnum("payout_status", ["pending", "processing", "completed", "failed"]);
export const moderationStatusEnum = pgEnum("moderation_status", ["pending", "approved", "rejected", "flagged"]);

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

// Relations
export const usersRelations = relations(users, ({ one, many }) => ({
  profile: one(profiles, { fields: [users.id], references: [profiles.userId] }),
  mediaAssets: many(mediaAssets),
  kycVerifications: many(kycVerifications),
  payoutAccounts: many(payoutAccounts),
  payoutRequests: many(payoutRequests),
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
export type AuditLog = typeof auditLogs.$inferSelect;

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

export type InsertUser = z.infer<typeof insertUserSchema>;
