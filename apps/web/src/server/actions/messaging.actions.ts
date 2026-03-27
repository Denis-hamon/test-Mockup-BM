"use server";

/**
 * Server actions for E2E encrypted messaging.
 *
 * Authorization: requireAuth() — both avocat and client access messaging.
 *
 * CRITICAL: Server NEVER sees plaintext. Only ciphertext + nonce are stored.
 * Email notifications say "Vous avez un nouveau message" — NEVER include content.
 *
 * Actions:
 * - getConversations: List conversations with last message preview
 * - getOrCreateConversation: Find or create conversation for a submission
 * - getMessages: Cursor-based paginated messages
 * - sendMessage: Insert message + SSE push + email notification
 * - markAsRead: Mark unread messages as read + SSE read receipt
 * - sendTypingIndicator: SSE typing event (no DB write)
 * - getUnreadCount: Total unread across all conversations
 */

import { db } from "@/lib/db";
import { users } from "@/lib/db/schema/auth";
import { intakeSubmissions } from "@/lib/db/schema/intake";
import { conversations, messages } from "@/lib/db/schema/messaging";
import { lawyerProfiles } from "@/lib/db/schema/lawyer";
import { messageEmitter, type SSEEvent } from "@/lib/sse/message-emitter";
import { requireAuth } from "./portal.actions";
import { sendEmail } from "@legalconnect/email";
import { eq, and, sql, desc, lt, ne, isNull, or } from "drizzle-orm";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const MESSAGE_PAGE_SIZE = 50;

// ---------------------------------------------------------------------------
// getConversations
// ---------------------------------------------------------------------------

export async function getConversations() {
  const authResult = await requireAuth();
  if (!authResult.authorized) {
    return { success: false as const, error: authResult.error };
  }

  const userId = authResult.userId;

  try {
    // Find conversations where user is client or avocat
    const convos = await db
      .select({
        id: conversations.id,
        submissionId: conversations.submissionId,
        clientId: conversations.clientId,
        avocatId: conversations.avocatId,
        initiatorId: conversations.initiatorId,
        lastMessageAt: conversations.lastMessageAt,
        createdAt: conversations.createdAt,
        problemType: intakeSubmissions.problemType,
      })
      .from(conversations)
      .innerJoin(
        intakeSubmissions,
        eq(conversations.submissionId, intakeSubmissions.id),
      )
      .where(
        or(
          eq(conversations.clientId, userId),
          eq(conversations.avocatId, userId),
        ),
      )
      .orderBy(desc(conversations.lastMessageAt));

    // For each conversation, get last message preview + unread count + other party name
    const enriched = await Promise.all(
      convos.map(async (conv) => {
        const otherUserId =
          conv.clientId === userId ? conv.avocatId : conv.clientId;

        const [lastMessage, unreadResult, otherUser] = await Promise.all([
          db
            .select({
              encryptedContent: messages.encryptedContent,
              nonce: messages.nonce,
              senderId: messages.senderId,
              createdAt: messages.createdAt,
            })
            .from(messages)
            .where(eq(messages.conversationId, conv.id))
            .orderBy(desc(messages.createdAt))
            .limit(1),
          db
            .select({ count: sql<number>`count(*)` })
            .from(messages)
            .where(
              and(
                eq(messages.conversationId, conv.id),
                ne(messages.senderId, userId),
                isNull(messages.readAt),
              ),
            ),
          db.query.users.findFirst({
            where: eq(users.id, otherUserId),
            columns: { name: true, email: true },
          }),
        ]);

        return {
          id: conv.id,
          submissionId: conv.submissionId,
          initiatorId: conv.initiatorId,
          problemType: conv.problemType,
          lastMessageAt: conv.lastMessageAt,
          otherPartyName: otherUser?.name ?? otherUser?.email ?? "Inconnu",
          unreadCount: Number(unreadResult[0]?.count ?? 0),
          lastMessage: lastMessage[0]
            ? {
                encryptedContent: lastMessage[0].encryptedContent,
                nonce: lastMessage[0].nonce,
                senderId: lastMessage[0].senderId,
                createdAt: lastMessage[0].createdAt,
              }
            : null,
        };
      }),
    );

    return { success: true as const, data: enriched };
  } catch (error) {
    console.error("[messaging] getConversations failed:", error);
    return { success: false as const, error: "query_failed" };
  }
}

// ---------------------------------------------------------------------------
// getOrCreateConversation
// ---------------------------------------------------------------------------

export async function getOrCreateConversation(submissionId: string) {
  const authResult = await requireAuth();
  if (!authResult.authorized) {
    return { success: false as const, error: authResult.error };
  }

  const userId = authResult.userId;

  try {
    // Check for existing conversation
    const existing = await db.query.conversations.findFirst({
      where: and(
        eq(conversations.submissionId, submissionId),
        or(
          eq(conversations.clientId, userId),
          eq(conversations.avocatId, userId),
        ),
      ),
    });

    if (existing) {
      return { success: true as const, data: existing };
    }

    // Get submission to determine client and find avocat
    const submission = await db.query.intakeSubmissions.findFirst({
      where: eq(intakeSubmissions.id, submissionId),
    });

    if (!submission) {
      return { success: false as const, error: "submission_not_found" };
    }

    // Determine roles
    const clientId = submission.userId;
    if (!clientId) {
      return { success: false as const, error: "submission_has_no_client" };
    }

    // For now, find the first avocat user to assign (in a real system,
    // this would be the avocat who accepted the case)
    const avocat = await db.query.users.findFirst({
      where: eq(users.role, "avocat"),
    });

    if (!avocat) {
      return { success: false as const, error: "no_avocat_available" };
    }

    const avocatId = avocat.id;

    // The user who creates the conversation is the initiator (crypto_kx "client" role)
    const [conversation] = await db
      .insert(conversations)
      .values({
        submissionId,
        clientId,
        avocatId,
        initiatorId: userId,
      })
      .returning();

    return { success: true as const, data: conversation };
  } catch (error) {
    console.error("[messaging] getOrCreateConversation failed:", error);
    return { success: false as const, error: "create_failed" };
  }
}

// ---------------------------------------------------------------------------
// getMessages (cursor-based pagination)
// ---------------------------------------------------------------------------

export async function getMessages(conversationId: string, cursor?: string) {
  const authResult = await requireAuth();
  if (!authResult.authorized) {
    return { success: false as const, error: authResult.error };
  }

  const userId = authResult.userId;

  try {
    // Verify user is a participant
    const conversation = await db.query.conversations.findFirst({
      where: and(
        eq(conversations.id, conversationId),
        or(
          eq(conversations.clientId, userId),
          eq(conversations.avocatId, userId),
        ),
      ),
    });

    if (!conversation) {
      return { success: false as const, error: "conversation_not_found" };
    }

    // Build query conditions
    const conditions = [eq(messages.conversationId, conversationId)];
    if (cursor) {
      conditions.push(lt(messages.createdAt, new Date(cursor)));
    }

    const msgs = await db
      .select({
        id: messages.id,
        conversationId: messages.conversationId,
        senderId: messages.senderId,
        encryptedContent: messages.encryptedContent,
        nonce: messages.nonce,
        attachmentId: messages.attachmentId,
        clientMessageId: messages.clientMessageId,
        readAt: messages.readAt,
        createdAt: messages.createdAt,
      })
      .from(messages)
      .where(and(...conditions))
      .orderBy(desc(messages.createdAt))
      .limit(MESSAGE_PAGE_SIZE + 1); // Fetch one extra to detect hasMore

    const hasMore = msgs.length > MESSAGE_PAGE_SIZE;
    const data = hasMore ? msgs.slice(0, MESSAGE_PAGE_SIZE) : msgs;
    const nextCursor = hasMore
      ? data[data.length - 1].createdAt.toISOString()
      : null;

    return {
      success: true as const,
      data,
      nextCursor,
      hasMore,
    };
  } catch (error) {
    console.error("[messaging] getMessages failed:", error);
    return { success: false as const, error: "query_failed" };
  }
}

// ---------------------------------------------------------------------------
// sendMessage
// ---------------------------------------------------------------------------

export async function sendMessage(
  conversationId: string,
  encryptedContent: string,
  nonce: string,
  clientMessageId?: string,
  attachmentId?: string,
) {
  const authResult = await requireAuth();
  if (!authResult.authorized) {
    return { success: false as const, error: authResult.error };
  }

  const userId = authResult.userId;

  try {
    // Verify user is a participant
    const conversation = await db.query.conversations.findFirst({
      where: and(
        eq(conversations.id, conversationId),
        or(
          eq(conversations.clientId, userId),
          eq(conversations.avocatId, userId),
        ),
      ),
    });

    if (!conversation) {
      return { success: false as const, error: "conversation_not_found" };
    }

    const now = new Date();

    // Insert message
    const [message] = await db
      .insert(messages)
      .values({
        conversationId,
        senderId: userId,
        encryptedContent,
        nonce,
        clientMessageId: clientMessageId ?? null,
        attachmentId: attachmentId ?? null,
        createdAt: now,
      })
      .returning();

    // Update conversation lastMessageAt
    await db
      .update(conversations)
      .set({ lastMessageAt: now })
      .where(eq(conversations.id, conversationId));

    // Determine the other participant
    const otherUserId =
      conversation.clientId === userId
        ? conversation.avocatId
        : conversation.clientId;

    // Emit SSE event to the other participant
    const sseEvent: SSEEvent = {
      type: "new_message",
      conversationId,
      messageId: message.id,
      senderId: userId,
      encryptedContent,
      nonce,
      attachmentId: attachmentId ?? undefined,
      clientMessageId: clientMessageId ?? undefined,
      createdAt: now.toISOString(),
    };
    messageEmitter.emit(`user:${otherUserId}`, sseEvent);

    // Fire-and-forget email notification (D-05: NEVER include message content)
    void (async () => {
      try {
        const otherUser = await db.query.users.findFirst({
          where: eq(users.id, otherUserId),
          columns: { email: true, name: true },
        });
        if (otherUser?.email) {
          await sendEmail({
            to: otherUser.email,
            subject: "Nouveau message - LegalConnect",
            text: `Bonjour${otherUser.name ? ` ${otherUser.name}` : ""},\n\nVous avez recu un nouveau message sur LegalConnect.\n\nConnectez-vous pour le consulter.\n\nCordialement,\nL'equipe LegalConnect`,
          });
        }
      } catch (emailError) {
        console.error("[messaging] email notification failed:", emailError);
      }
    })();

    return { success: true as const, data: message };
  } catch (error) {
    console.error("[messaging] sendMessage failed:", error);
    return { success: false as const, error: "send_failed" };
  }
}

// ---------------------------------------------------------------------------
// markAsRead (D-03: check readReceiptsEnabled)
// ---------------------------------------------------------------------------

export async function markAsRead(conversationId: string) {
  const authResult = await requireAuth();
  if (!authResult.authorized) {
    return { success: false as const, error: authResult.error };
  }

  const userId = authResult.userId;

  try {
    // Verify user is a participant
    const conversation = await db.query.conversations.findFirst({
      where: and(
        eq(conversations.id, conversationId),
        or(
          eq(conversations.clientId, userId),
          eq(conversations.avocatId, userId),
        ),
      ),
    });

    if (!conversation) {
      return { success: false as const, error: "conversation_not_found" };
    }

    const now = new Date();

    // Mark all unread messages from the other party as read
    const updated = await db
      .update(messages)
      .set({ readAt: now })
      .where(
        and(
          eq(messages.conversationId, conversationId),
          ne(messages.senderId, userId),
          isNull(messages.readAt),
        ),
      )
      .returning({ id: messages.id });

    // Check if the other party (if lawyer) has read receipts enabled
    const otherUserId =
      conversation.clientId === userId
        ? conversation.avocatId
        : conversation.clientId;

    // Check read receipt settings for the lawyer in this conversation
    const lawyerProfile = await db.query.lawyerProfiles.findFirst({
      where: eq(lawyerProfiles.userId, conversation.avocatId),
      columns: { readReceiptsEnabled: true },
    });

    const readReceiptsEnabled = lawyerProfile?.readReceiptsEnabled !== 0;

    // Emit SSE read receipt if enabled and there were messages to mark
    if (readReceiptsEnabled && updated.length > 0) {
      for (const msg of updated) {
        const readReceiptEvent: SSEEvent = {
          type: "read_receipt",
          conversationId,
          messageId: msg.id,
          readBy: userId,
        };
        messageEmitter.emit(`user:${otherUserId}`, readReceiptEvent);
      }
    }

    return { success: true as const, markedCount: updated.length };
  } catch (error) {
    console.error("[messaging] markAsRead failed:", error);
    return { success: false as const, error: "update_failed" };
  }
}

// ---------------------------------------------------------------------------
// sendTypingIndicator (no DB write, SSE only)
// ---------------------------------------------------------------------------

export async function sendTypingIndicator(conversationId: string) {
  const authResult = await requireAuth();
  if (!authResult.authorized) {
    return { success: false as const, error: authResult.error };
  }

  const userId = authResult.userId;

  try {
    const conversation = await db.query.conversations.findFirst({
      where: and(
        eq(conversations.id, conversationId),
        or(
          eq(conversations.clientId, userId),
          eq(conversations.avocatId, userId),
        ),
      ),
    });

    if (!conversation) {
      return { success: false as const, error: "conversation_not_found" };
    }

    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: { name: true },
    });

    const otherUserId =
      conversation.clientId === userId
        ? conversation.avocatId
        : conversation.clientId;

    const typingEvent: SSEEvent = {
      type: "typing",
      conversationId,
      userId,
      name: user?.name ?? "Utilisateur",
    };
    messageEmitter.emit(`user:${otherUserId}`, typingEvent);

    return { success: true as const };
  } catch (error) {
    console.error("[messaging] sendTypingIndicator failed:", error);
    return { success: false as const, error: "typing_failed" };
  }
}

// ---------------------------------------------------------------------------
// getUnreadCount
// ---------------------------------------------------------------------------

export async function getUnreadCount() {
  const authResult = await requireAuth();
  if (!authResult.authorized) {
    return { success: false as const, error: authResult.error };
  }

  const userId = authResult.userId;

  try {
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(messages)
      .innerJoin(conversations, eq(messages.conversationId, conversations.id))
      .where(
        and(
          or(
            eq(conversations.clientId, userId),
            eq(conversations.avocatId, userId),
          ),
          ne(messages.senderId, userId),
          isNull(messages.readAt),
        ),
      );

    return {
      success: true as const,
      data: { count: Number(result[0]?.count ?? 0) },
    };
  } catch (error) {
    console.error("[messaging] getUnreadCount failed:", error);
    return { success: false as const, error: "query_failed" };
  }
}
