import { EventEmitter } from "events";

// Singleton emitter for the process.
// In production with multiple workers, replace with Valkey pub/sub.
export const messageEmitter = new EventEmitter();
messageEmitter.setMaxListeners(1000); // Support many concurrent SSE connections

export type SSEEvent =
  | {
      type: "new_message";
      conversationId: string;
      messageId: string;
      senderId: string;
      encryptedContent: string;
      nonce: string;
      attachmentId?: string;
      clientMessageId?: string;
      createdAt: string;
    }
  | {
      type: "typing";
      conversationId: string;
      userId: string;
      name: string;
    }
  | {
      type: "read_receipt";
      conversationId: string;
      messageId: string;
      readBy: string;
    }
  | {
      type: "unread_count";
      count: number;
    };
