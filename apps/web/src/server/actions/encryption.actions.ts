"use server";

import { db } from "@/lib/db";
import { encryptionKeys } from "@/lib/db/schema/encryption";
import { auth } from "@/lib/auth";
import { eq } from "drizzle-orm";

export async function storeEncryptionKeys(data: {
  publicKey: string;
  encryptedPrivateKey: string;
  recoverySalt: string;
  recoveryNonce: string;
  recoveryParams: string;
}) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Non authentifie" };

  // Upsert: insert or update if exists
  const existing = await db.query.encryptionKeys.findFirst({
    where: eq(encryptionKeys.userId, session.user.id),
  });

  if (existing) {
    await db
      .update(encryptionKeys)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(encryptionKeys.userId, session.user.id));
  } else {
    await db.insert(encryptionKeys).values({
      userId: session.user.id,
      ...data,
    });
  }

  return { success: true };
}

export async function getEncryptionKeys() {
  const session = await auth();
  if (!session?.user?.id) return { error: "Non authentifie" };

  const keys = await db.query.encryptionKeys.findFirst({
    where: eq(encryptionKeys.userId, session.user.id),
  });

  if (!keys) return { error: "Aucune cle trouvee" };

  return {
    publicKey: keys.publicKey,
    encryptedPrivateKey: keys.encryptedPrivateKey,
    recoverySalt: keys.recoverySalt,
    recoveryNonce: keys.recoveryNonce,
    recoveryParams: keys.recoveryParams,
  };
}
