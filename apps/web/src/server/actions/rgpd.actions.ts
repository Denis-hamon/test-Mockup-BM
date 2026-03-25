"use server";

import { db } from "@/lib/db";
import { consents } from "@/lib/db/schema/consent";
import { users, sessions } from "@/lib/db/schema/auth";
import { auth } from "@/lib/auth";
import { consentUpdateSchema } from "@legalconnect/shared";
import { eq, and } from "drizzle-orm";
import { headers } from "next/headers";
import { sendDeletionConfirmationEmail } from "@legalconnect/email";

export async function getConsents() {
  const session = await auth();
  if (!session?.user?.id) return { error: "Non authentifie" };

  const userConsents = await db.query.consents.findMany({
    where: eq(consents.userId, session.user.id),
  });

  return userConsents.map((c) => ({
    type: c.type,
    granted: c.granted,
    grantedAt: c.grantedAt,
    revokedAt: c.revokedAt,
  }));
}

export async function updateConsent(data: {
  type: "essential" | "analytics";
  granted: boolean;
}) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Non authentifie" };

  // Validate input
  const parsed = consentUpdateSchema.parse(data);

  // D-09: Essential consent cannot be revoked
  if (parsed.type === "essential" && !parsed.granted) {
    return { error: "Le consentement essentiel ne peut pas etre revoque." };
  }

  const headersList = await headers();
  const ipAddress = headersList.get("x-forwarded-for") || headersList.get("x-real-ip") || "unknown";
  const userAgent = headersList.get("user-agent") || "unknown";

  if (parsed.granted) {
    // Grant: insert new consent record
    await db.insert(consents).values({
      userId: session.user.id,
      type: parsed.type,
      granted: true,
      grantedAt: new Date(),
      ipAddress,
      userAgent,
    });
  } else {
    // Revoke: update existing consent to set revokedAt
    const existing = await db.query.consents.findFirst({
      where: and(
        eq(consents.userId, session.user.id),
        eq(consents.type, parsed.type),
      ),
    });

    if (existing) {
      await db
        .update(consents)
        .set({ granted: false, revokedAt: new Date() })
        .where(eq(consents.id, existing.id));
    }
  }

  // Return updated consents
  return getConsents();
}

export async function requestDataExport() {
  const session = await auth();
  if (!session?.user?.id) return { error: "Non authentifie" };

  // D-10: Collect user data for export
  // Note: ZIP export with files is deferred to Phase 2 when file uploads exist.
  // Phase 1 returns JSON-only since there are no uploaded files yet.

  // Get user profile (without sensitive fields)
  const user = await db.query.users.findFirst({
    where: eq(users.id, session.user.id),
  });

  if (!user) return { error: "Utilisateur introuvable" };

  // Get consents
  const userConsents = await db.query.consents.findMany({
    where: eq(consents.userId, session.user.id),
  });

  // Build export data (exclude private keys for security)
  const exportData = {
    exportedAt: new Date().toISOString(),
    profile: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      emailVerified: user.emailVerified,
      createdAt: user.createdAt,
    },
    consents: userConsents.map((c) => ({
      type: c.type,
      granted: c.granted,
      grantedAt: c.grantedAt,
      revokedAt: c.revokedAt,
    })),
  };

  return { data: JSON.stringify(exportData, null, 2) };
}

export async function requestAccountDeletion() {
  const session = await auth();
  if (!session?.user?.id) return { error: "Non authentifie" };

  // D-11: Soft delete with 30-day grace period
  const now = new Date();
  const scheduledPurgeDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // now + 30 days

  // Set deletion timestamps
  await db
    .update(users)
    .set({
      deletedAt: now,
      deletionScheduledAt: scheduledPurgeDate,
      updatedAt: now,
    })
    .where(eq(users.id, session.user.id));

  // Invalidate all sessions for this user
  await db.delete(sessions).where(eq(sessions.userId, session.user.id));

  // D-12: Send deletion confirmation email with warm French tone
  const user = await db.query.users.findFirst({
    where: eq(users.id, session.user.id),
  });

  if (user?.email) {
    await sendDeletionConfirmationEmail(
      user.email,
      scheduledPurgeDate.toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }),
    );
  }

  return {
    success: true,
    scheduledPurgeDate: scheduledPurgeDate.toISOString(),
  };
}

export async function cancelAccountDeletion() {
  const session = await auth();
  if (!session?.user?.id) return { error: "Non authentifie" };

  // D-11: Cancellation possible during 30-day grace period
  await db
    .update(users)
    .set({
      deletedAt: null,
      deletionScheduledAt: null,
      updatedAt: new Date(),
    })
    .where(eq(users.id, session.user.id));

  return { success: true };
}
