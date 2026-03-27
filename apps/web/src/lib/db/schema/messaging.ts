import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { users } from "./auth";
import { intakeSubmissions } from "./intake";

export const conversations = pgTable("conversations", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  submissionId: text("submission_id")
    .notNull()
    .references(() => intakeSubmissions.id),
  clientId: text("client_id")
    .notNull()
    .references(() => users.id),
  avocatId: text("avocat_id")
    .notNull()
    .references(() => users.id),
  // Who initiated the conversation (determines crypto_kx role)
  initiatorId: text("initiator_id")
    .notNull()
    .references(() => users.id),
  lastMessageAt: timestamp("last_message_at", { mode: "date" }),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
});

export const messages = pgTable("messages", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  conversationId: text("conversation_id")
    .notNull()
    .references(() => conversations.id),
  senderId: text("sender_id")
    .notNull()
    .references(() => users.id),
  // Encrypted content (ciphertext as base64) — server NEVER sees plaintext
  encryptedContent: text("encrypted_content").notNull(),
  nonce: text("nonce").notNull(), // base64-encoded nonce
  // Optional file attachment
  attachmentId: text("attachment_id"), // references intake_documents.id
  // Client-generated UUID for optimistic UI dedup
  clientMessageId: text("client_message_id"),
  // Read tracking
  readAt: timestamp("read_at", { mode: "date" }),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
});

// Relations
export const conversationsRelations = relations(conversations, ({ one, many }) => ({
  submission: one(intakeSubmissions, {
    fields: [conversations.submissionId],
    references: [intakeSubmissions.id],
  }),
  client: one(users, {
    fields: [conversations.clientId],
    references: [users.id],
    relationName: "conversationClient",
  }),
  avocat: one(users, {
    fields: [conversations.avocatId],
    references: [users.id],
    relationName: "conversationAvocat",
  }),
  initiator: one(users, {
    fields: [conversations.initiatorId],
    references: [users.id],
    relationName: "conversationInitiator",
  }),
  messages: many(messages),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  conversation: one(conversations, {
    fields: [messages.conversationId],
    references: [conversations.id],
  }),
  sender: one(users, {
    fields: [messages.senderId],
    references: [users.id],
  }),
}));
