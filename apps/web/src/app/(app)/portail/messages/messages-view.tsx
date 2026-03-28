"use client";

import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { ArrowLeft, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ChatContainer } from "@/components/chat/chat-container";
import { UnreadBadge } from "@/components/chat/unread-badge";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Types (matching getConversations return shape)
// ---------------------------------------------------------------------------

interface ConversationSummary {
  id: string;
  submissionId: string;
  initiatorId: string;
  problemType: string | null;
  lastMessageAt: Date | null;
  otherPartyName: string;
  unreadCount: number;
  lastMessage: {
    encryptedContent: string;
    nonce: string;
    senderId: string;
    createdAt: Date;
  } | null;
}

interface MessagesViewProps {
  conversations: ConversationSummary[];
  selectedConversationId: string | null;
  selectedConversation: ConversationSummary | null;
  currentUserId: string;
  otherUserPublicKey: string | null;
  isInitiator: boolean;
}

// ---------------------------------------------------------------------------
// Conversation list item
// ---------------------------------------------------------------------------

function ConversationItem({
  conversation,
  isSelected,
  onClick,
}: {
  conversation: ConversationSummary;
  isSelected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-start gap-3 rounded-lg px-3 py-3 text-left transition-colors hover:bg-muted",
        isSelected && "bg-muted",
      )}
    >
      {/* Avatar placeholder */}
      <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
        <span className="text-sm font-semibold text-primary">
          {conversation.otherPartyName.charAt(0).toUpperCase()}
        </span>
      </div>

      {/* Content */}
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <div className="flex items-center justify-between gap-2">
          <span className="truncate text-sm font-semibold">
            {conversation.otherPartyName}
          </span>
          {conversation.lastMessage?.createdAt && (
            <span className="shrink-0 text-xs text-muted-foreground">
              {formatDistanceToNow(conversation.lastMessage.createdAt, {
                addSuffix: true,
                locale: fr,
              })}
            </span>
          )}
        </div>

        {conversation.problemType && (
          <span className="truncate text-xs text-muted-foreground">
            {conversation.problemType}
          </span>
        )}

        <div className="flex items-center justify-between gap-2">
          <span className="truncate text-xs text-muted-foreground">
            {conversation.lastMessage
              ? "Message chiffre"
              : "Aucun message"}
          </span>
          <UnreadBadge count={conversation.unreadCount} />
        </div>
      </div>
    </button>
  );
}

// ---------------------------------------------------------------------------
// MessagesView
// ---------------------------------------------------------------------------

export function MessagesView({
  conversations,
  selectedConversationId,
  selectedConversation,
  currentUserId,
  otherUserPublicKey,
  isInitiator,
}: MessagesViewProps) {
  const router = useRouter();

  const selectConversation = (id: string) => {
    router.push(`/portail/messages?conversation=${id}`);
  };

  const goBack = () => {
    router.push("/portail/messages");
  };

  const hasSelection = !!selectedConversationId && !!selectedConversation;

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col">
      <h1 className="mb-4 text-xl font-semibold lg:mb-0 lg:sr-only">
        Messages
      </h1>

      <div className="flex min-h-0 flex-1 overflow-hidden rounded-lg border">
        {/* Conversation list - hidden on mobile when a conversation is selected */}
        <div
          className={cn(
            "flex w-full flex-col border-r lg:w-[280px] lg:shrink-0",
            hasSelection && "hidden lg:flex",
          )}
        >
          <div className="border-b px-4 py-3">
            <h2 className="text-sm font-semibold">Conversations</h2>
          </div>

          <div className="flex-1 overflow-y-auto">
            {conversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 p-8">
                <MessageSquare className="size-8 text-muted-foreground" />
                <p className="text-center text-sm text-muted-foreground">
                  Aucun message pour le moment
                </p>
                <p className="text-center text-xs text-muted-foreground">
                  Les messages apparaîtront ici une fois que votre avocat aura
                  pris en charge votre dossier.
                </p>
              </div>
            ) : (
              <div className="flex flex-col p-2">
                {conversations.map((conv) => (
                  <ConversationItem
                    key={conv.id}
                    conversation={conv}
                    isSelected={conv.id === selectedConversationId}
                    onClick={() => selectConversation(conv.id)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Chat area */}
        <div
          className={cn(
            "relative flex flex-1 flex-col",
            !hasSelection && "hidden lg:flex",
          )}
        >
          {hasSelection && selectedConversation && otherUserPublicKey ? (
            <>
              {/* Mobile back button */}
              <div className="flex items-center border-b px-2 py-1 lg:hidden">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={goBack}
                  className="gap-1"
                >
                  <ArrowLeft className="size-4" data-icon />
                  Retour
                </Button>
              </div>

              <ChatContainer
                conversationId={selectedConversationId!}
                currentUserId={currentUserId}
                otherUserName={selectedConversation.otherPartyName}
                isInitiator={isInitiator}
                otherUserPublicKey={otherUserPublicKey}
                problemType={selectedConversation.problemType ?? undefined}
              />
            </>
          ) : hasSelection && !otherUserPublicKey ? (
            <div className="flex flex-1 items-center justify-center p-8">
              <p className="text-center text-sm text-muted-foreground">
                Cle de chiffrement de votre correspondant introuvable.
              </p>
            </div>
          ) : (
            <div className="flex flex-1 items-center justify-center p-8">
              <div className="flex flex-col items-center gap-2">
                <MessageSquare className="size-8 text-muted-foreground" />
                <p className="text-center text-sm text-muted-foreground">
                  Selectionnez une conversation
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
