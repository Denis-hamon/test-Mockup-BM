import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { conversations as conversationsTable } from "@/lib/db/schema/messaging";
import { encryptionKeys } from "@/lib/db/schema/encryption";
import { eq } from "drizzle-orm";
import { getConversations } from "@/server/actions/messaging.actions";
import { MessagesView } from "./messages-view";

export const metadata = {
  title: "Messages - LegalConnect",
};

interface Props {
  searchParams: Promise<{ conversation?: string }>;
}

export default async function MessagesPage({ searchParams }: Props) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const params = await searchParams;
  const selectedId = params.conversation ?? null;

  // Fetch conversations list
  const result = await getConversations();
  const conversations = result.success ? (result.data ?? []) : [];

  // For the selected conversation, fetch the other party's public key + initiator info
  let otherUserPublicKey: string | null = null;
  let isInitiator = false;

  const selectedConversation =
    selectedId ? conversations.find((c) => c.id === selectedId) ?? null : null;

  if (selectedId && selectedConversation) {
    // Query raw conversation for clientId/avocatId
    const rawConv = await db.query.conversations.findFirst({
      where: eq(conversationsTable.id, selectedId),
    });

    if (rawConv) {
      isInitiator = rawConv.initiatorId === session.user.id;
      const otherPartyId =
        rawConv.clientId === session.user.id
          ? rawConv.avocatId
          : rawConv.clientId;

      const otherKeys = await db.query.encryptionKeys.findFirst({
        where: eq(encryptionKeys.userId, otherPartyId),
        columns: { publicKey: true },
      });

      otherUserPublicKey = otherKeys?.publicKey ?? null;
    }
  }

  return (
    <MessagesView
      conversations={conversations}
      selectedConversationId={selectedId}
      selectedConversation={selectedConversation}
      currentUserId={session.user.id}
      otherUserPublicKey={otherUserPublicKey}
      isInitiator={isInitiator}
    />
  );
}
