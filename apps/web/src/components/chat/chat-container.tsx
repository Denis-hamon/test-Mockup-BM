"use client";

import {
  useState,
  useEffect,
  useRef,
  useCallback,
  type UIEvent,
} from "react";
import sodium from "libsodium-wrappers-sumo";
import {
  deriveClientKeys,
  deriveServerKeys,
  base64ToKey,
  type ConversationKeys,
} from "@legalconnect/crypto";
import { useSSEMessages } from "@/hooks/use-sse-messages";
import {
  getMessages,
  sendMessage,
  markAsRead,
  sendTypingIndicator,
} from "@/server/actions/messaging.actions";
import type { SSEEvent } from "@/lib/sse/message-emitter";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ChatBubble, DateSeparator, type ChatBubbleMessage } from "./chat-bubble";
import { ChatInput } from "./chat-input";
import { TypingIndicator } from "./typing-indicator";
import { EncryptionBadge } from "./encryption-badge";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ChatContainerProps {
  conversationId: string;
  currentUserId: string;
  otherUserName: string;
  isInitiator: boolean;
  otherUserPublicKey: string; // base64
  problemType?: string;
  className?: string;
}

interface DecryptedMessage {
  id: string;
  senderId: string;
  content: string;
  timestamp: Date;
  readAt: Date | null;
  clientMessageId: string | null;
  attachmentId: string | null;
  optimistic?: boolean;
  failed?: boolean;
}

// ---------------------------------------------------------------------------
// IndexedDB helper
// ---------------------------------------------------------------------------

async function getPrivateKeyFromIndexedDB(): Promise<Uint8Array | null> {
  return new Promise((resolve) => {
    const request = indexedDB.open("legalconnect_keys", 1);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains("keys")) {
        db.createObjectStore("keys");
      }
    };

    request.onsuccess = () => {
      const db = request.result;
      const tx = db.transaction("keys", "readonly");
      const store = tx.objectStore("keys");
      const getReq = store.get("legalconnect_private_key");
      getReq.onsuccess = () => {
        if (getReq.result) {
          resolve(new Uint8Array(getReq.result));
        } else {
          resolve(null);
        }
      };
      getReq.onerror = () => resolve(null);
    };

    request.onerror = () => resolve(null);
  });
}

// ---------------------------------------------------------------------------
// Encryption helpers
// ---------------------------------------------------------------------------

async function encryptText(
  plaintext: string,
  txKey: Uint8Array,
): Promise<{ ciphertext: string; nonce: string }> {
  await sodium.ready;
  const plaintextBytes = sodium.from_string(plaintext);
  const nonce = sodium.randombytes_buf(sodium.crypto_secretbox_NONCEBYTES);
  const ciphertext = sodium.crypto_secretbox_easy(plaintextBytes, nonce, txKey);
  return {
    ciphertext: sodium.to_base64(ciphertext, sodium.base64_variants.ORIGINAL),
    nonce: sodium.to_base64(nonce, sodium.base64_variants.ORIGINAL),
  };
}

async function decryptText(
  ciphertextB64: string,
  nonceB64: string,
  key: Uint8Array,
): Promise<string> {
  await sodium.ready;
  const ciphertext = sodium.from_base64(
    ciphertextB64,
    sodium.base64_variants.ORIGINAL,
  );
  const nonce = sodium.from_base64(
    nonceB64,
    sodium.base64_variants.ORIGINAL,
  );
  const plaintext = sodium.crypto_secretbox_open_easy(ciphertext, nonce, key);
  return sodium.to_string(plaintext);
}

// ---------------------------------------------------------------------------
// ChatContainer
// ---------------------------------------------------------------------------

export function ChatContainer({
  conversationId,
  currentUserId,
  otherUserName,
  isInitiator,
  otherUserPublicKey,
  problemType,
  className,
}: ChatContainerProps) {
  const [messages, setMessages] = useState<DecryptedMessage[]>([]);
  const [keys, setKeys] = useState<ConversationKeys | null>(null);
  const [loading, setLoading] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [typingName, setTypingName] = useState("");
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [showNewMessage, setShowNewMessage] = useState(false);
  const [keyError, setKeyError] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isAtBottomRef = useRef(true);
  const cursorRef = useRef<string | null>(null);

  // -------------------------------------------------------------------------
  // Key derivation on mount
  // -------------------------------------------------------------------------

  useEffect(() => {
    async function deriveKeys() {
      try {
        const privateKey = await getPrivateKeyFromIndexedDB();
        if (!privateKey) {
          setKeyError(true);
          setLoading(false);
          return;
        }

        await sodium.ready;
        const myPublicKey = sodium.crypto_scalarmult_base(privateKey);
        const theirPublicKey = await base64ToKey(otherUserPublicKey);

        const derived = isInitiator
          ? await deriveClientKeys(myPublicKey, privateKey, theirPublicKey)
          : await deriveServerKeys(myPublicKey, privateKey, theirPublicKey);

        setKeys(derived);
      } catch (err) {
        console.error("[chat] key derivation failed:", err);
        setKeyError(true);
        setLoading(false);
      }
    }

    deriveKeys();
  }, [isInitiator, otherUserPublicKey]);

  // -------------------------------------------------------------------------
  // Load initial messages
  // -------------------------------------------------------------------------

  useEffect(() => {
    if (!keys) return;
    const derivedKeys = keys; // local const for TS narrowing in async closures

    async function loadMessages() {
      setLoading(true);
      try {
        const result = await getMessages(conversationId);
        if (!result.success || !result.data) {
          setLoading(false);
          return;
        }

        // Messages come newest-first from server, reverse for display
        const serverMessages = [...result.data].reverse();

        const decrypted = await Promise.all(
          serverMessages.map(async (msg) => {
            try {
              // Determine which key to use for decryption
              // If I sent it, I encrypted with tx, so decrypt with tx
              // If they sent it, they encrypted with their tx = my rx
              const decryptKey =
                msg.senderId === currentUserId ? derivedKeys.tx : derivedKeys.rx;
              const content = await decryptText(
                msg.encryptedContent,
                msg.nonce,
                decryptKey,
              );
              return {
                id: msg.id,
                senderId: msg.senderId,
                content,
                timestamp: msg.createdAt,
                readAt: msg.readAt,
                clientMessageId: msg.clientMessageId,
                attachmentId: msg.attachmentId,
              };
            } catch {
              return {
                id: msg.id,
                senderId: msg.senderId,
                content: "[Message indechiffrable]",
                timestamp: msg.createdAt,
                readAt: msg.readAt,
                clientMessageId: msg.clientMessageId,
                attachmentId: msg.attachmentId,
              };
            }
          }),
        );

        setMessages(decrypted);
        setHasMore(result.hasMore ?? false);
        cursorRef.current = result.nextCursor ?? null;

        // Mark as read
        void markAsRead(conversationId);
      } catch (err) {
        console.error("[chat] load messages failed:", err);
      } finally {
        setLoading(false);
      }
    }

    loadMessages();
  }, [keys, conversationId, currentUserId]);

  // Scroll to bottom on initial load
  useEffect(() => {
    if (!loading && messages.length > 0) {
      bottomRef.current?.scrollIntoView({ behavior: "instant" });
    }
  }, [loading, messages.length === 0]); // eslint-disable-line react-hooks/exhaustive-deps

  // -------------------------------------------------------------------------
  // SSE integration
  // -------------------------------------------------------------------------

  const handleSSE = useCallback(
    async (event: SSEEvent) => {
      if (!keys) return;

      if (
        event.type === "new_message" &&
        event.conversationId === conversationId
      ) {
        // Decrypt the incoming message
        try {
          const decryptKey =
            event.senderId === currentUserId ? keys.tx : keys.rx;
          const content = await decryptText(
            event.encryptedContent,
            event.nonce,
            decryptKey,
          );

          setMessages((prev) => {
            // Check if this is an optimistic message confirmation
            if (event.clientMessageId) {
              const optimisticIdx = prev.findIndex(
                (m) => m.clientMessageId === event.clientMessageId && m.optimistic,
              );
              if (optimisticIdx >= 0) {
                const updated = [...prev];
                updated[optimisticIdx] = {
                  ...updated[optimisticIdx],
                  id: event.messageId,
                  optimistic: false,
                  failed: false,
                };
                return updated;
              }
            }

            // New message from other party
            return [
              ...prev,
              {
                id: event.messageId,
                senderId: event.senderId,
                content,
                timestamp: new Date(event.createdAt),
                readAt: null,
                clientMessageId: event.clientMessageId ?? null,
                attachmentId: event.attachmentId ?? null,
              },
            ];
          });

          // Auto-scroll or show "new message" button
          if (isAtBottomRef.current) {
            setTimeout(() => {
              bottomRef.current?.scrollIntoView({ behavior: "smooth" });
            }, 50);
          } else if (event.senderId !== currentUserId) {
            setShowNewMessage(true);
          }

          // Mark as read if from other party
          if (event.senderId !== currentUserId) {
            void markAsRead(conversationId);
          }
        } catch (err) {
          console.error("[chat] decrypt SSE message failed:", err);
        }
      }

      if (
        event.type === "typing" &&
        event.conversationId === conversationId &&
        event.userId !== currentUserId
      ) {
        setIsTyping(true);
        setTypingName(event.name);
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }
        typingTimeoutRef.current = setTimeout(() => {
          setIsTyping(false);
          typingTimeoutRef.current = null;
        }, 5000);
      }

      if (
        event.type === "read_receipt" &&
        event.conversationId === conversationId
      ) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === event.messageId
              ? { ...m, readAt: new Date() }
              : m,
          ),
        );
      }
    },
    [keys, conversationId, currentUserId],
  );

  useSSEMessages(handleSSE);

  // -------------------------------------------------------------------------
  // Send flow
  // -------------------------------------------------------------------------

  const handleSend = useCallback(
    async (plaintext: string) => {
      if (!keys) return;

      const clientMessageId = crypto.randomUUID();

      // Optimistic insert
      const optimisticMsg: DecryptedMessage = {
        id: `optimistic-${clientMessageId}`,
        senderId: currentUserId,
        content: plaintext,
        timestamp: new Date(),
        readAt: null,
        clientMessageId,
        attachmentId: null,
        optimistic: true,
      };

      setMessages((prev) => [...prev, optimisticMsg]);

      // Scroll to bottom
      setTimeout(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 50);

      try {
        const { ciphertext, nonce } = await encryptText(plaintext, keys.tx);
        const result = await sendMessage(
          conversationId,
          ciphertext,
          nonce,
          clientMessageId,
        );

        if (!result.success) {
          // Mark as failed
          setMessages((prev) =>
            prev.map((m) =>
              m.clientMessageId === clientMessageId
                ? { ...m, optimistic: false, failed: true }
                : m,
            ),
          );
        }
      } catch {
        setMessages((prev) =>
          prev.map((m) =>
            m.clientMessageId === clientMessageId
              ? { ...m, optimistic: false, failed: true }
              : m,
          ),
        );
      }
    },
    [keys, conversationId, currentUserId],
  );

  // -------------------------------------------------------------------------
  // Typing indicator
  // -------------------------------------------------------------------------

  const handleTyping = useCallback(() => {
    void sendTypingIndicator(conversationId);
  }, [conversationId]);

  // -------------------------------------------------------------------------
  // Scroll handling
  // -------------------------------------------------------------------------

  const handleScroll = useCallback(
    (e: UIEvent<HTMLDivElement>) => {
      const el = e.currentTarget;
      const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 50;
      isAtBottomRef.current = atBottom;

      if (atBottom) {
        setShowNewMessage(false);
      }

      // Load more on scroll to top
      if (el.scrollTop < 100 && hasMore && !loadingMore && cursorRef.current) {
        setLoadingMore(true);
        void (async () => {
          try {
            const result = await getMessages(conversationId, cursorRef.current!);
            if (!result.success || !result.data || !keys) return;
            const scrollKeys = keys; // local const for TS narrowing

            const olderMessages = [...result.data].reverse();
            const decrypted = await Promise.all(
              olderMessages.map(async (msg) => {
                try {
                  const decryptKey =
                    msg.senderId === currentUserId ? scrollKeys.tx : scrollKeys.rx;
                  const content = await decryptText(
                    msg.encryptedContent,
                    msg.nonce,
                    decryptKey,
                  );
                  return {
                    id: msg.id,
                    senderId: msg.senderId,
                    content,
                    timestamp: msg.createdAt,
                    readAt: msg.readAt,
                    clientMessageId: msg.clientMessageId,
                    attachmentId: msg.attachmentId,
                  };
                } catch {
                  return {
                    id: msg.id,
                    senderId: msg.senderId,
                    content: "[Message indechiffrable]",
                    timestamp: msg.createdAt,
                    readAt: msg.readAt,
                    clientMessageId: msg.clientMessageId,
                    attachmentId: msg.attachmentId,
                  };
                }
              }),
            );

            setMessages((prev) => [...decrypted, ...prev]);
            setHasMore(result.hasMore ?? false);
            cursorRef.current = result.nextCursor ?? null;
          } finally {
            setLoadingMore(false);
          }
        })();
      }
    },
    [hasMore, loadingMore, conversationId, currentUserId, keys],
  );

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    setShowNewMessage(false);
  };

  // -------------------------------------------------------------------------
  // Retry
  // -------------------------------------------------------------------------

  const handleRetry = useCallback(
    (messageId: string) => {
      const msg = messages.find((m) => m.id === messageId);
      if (!msg) return;
      // Remove the failed message and re-send
      setMessages((prev) => prev.filter((m) => m.id !== messageId));
      handleSend(msg.content);
    },
    [messages, handleSend],
  );

  // -------------------------------------------------------------------------
  // Group messages by date
  // -------------------------------------------------------------------------

  function getDateKey(date: Date): string {
    return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
  }

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  if (keyError) {
    return (
      <div className={cn("flex flex-1 flex-col items-center justify-center gap-4 p-8", className)}>
        <p className="text-center text-muted-foreground">
          Clé de chiffrement introuvable. Veuillez restaurer votre phrase de récupération.
        </p>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-1 flex-col", className)}>
      {/* Header */}
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div className="flex flex-col">
          <h2 className="text-lg font-semibold">{otherUserName}</h2>
          {problemType && (
            <span className="text-xs text-muted-foreground">{problemType}</span>
          )}
        </div>
        <EncryptionBadge variant="header" />
      </div>

      {/* Messages area */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto"
        role="log"
        aria-live="polite"
        aria-label="Messages"
      >
        {loading ? (
          <div className="flex flex-col gap-4 p-4">
            <Skeleton className="ml-auto h-10 w-48 rounded-2xl" />
            <Skeleton className="mr-auto h-10 w-56 rounded-2xl" />
            <Skeleton className="ml-auto h-10 w-40 rounded-2xl" />
            <Skeleton className="mr-auto h-10 w-52 rounded-2xl" />
            <Skeleton className="ml-auto h-10 w-44 rounded-2xl" />
            <Skeleton className="mr-auto h-10 w-48 rounded-2xl" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center p-8">
            <p className="text-center text-muted-foreground">
              Aucun message pour le moment
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2 p-4">
            {loadingMore && (
              <div className="flex justify-center py-2">
                <Skeleton className="h-8 w-32 rounded-full" />
              </div>
            )}
            {messages.map((msg, idx) => {
              const prevMsg = idx > 0 ? messages[idx - 1] : null;
              const showDateSep =
                !prevMsg ||
                getDateKey(msg.timestamp) !== getDateKey(prevMsg.timestamp);

              return (
                <div key={msg.id}>
                  {showDateSep && <DateSeparator date={msg.timestamp} />}
                  <ChatBubble
                    message={{
                      id: msg.id,
                      content: msg.content,
                      isSent: msg.senderId === currentUserId,
                      timestamp: msg.timestamp,
                      readAt: msg.readAt,
                      showReadReceipt: msg.senderId === currentUserId,
                      optimistic: msg.optimistic,
                      failed: msg.failed,
                      attachment: null, // TODO: wire attachment details
                    }}
                    onRetry={handleRetry}
                  />
                </div>
              );
            })}
            {isTyping && <TypingIndicator name={typingName} />}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* New message floating button */}
      {showNewMessage && (
        <div className="absolute bottom-20 left-1/2 z-10 -translate-x-1/2">
          <Button
            variant="secondary"
            size="sm"
            onClick={scrollToBottom}
            className="shadow-lg"
          >
            Nouveau message
          </Button>
        </div>
      )}

      {/* Input */}
      <ChatInput
        onSend={handleSend}
        onTyping={handleTyping}
        disabled={!keys || loading}
      />
    </div>
  );
}
