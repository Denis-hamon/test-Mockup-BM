"use server";

/**
 * Server actions for lawyer profile settings.
 *
 * Authorization: role === "avocat" only.
 *
 * Actions:
 * - getLawyerProfile: Get or create default profile
 * - updateLawyerProfile: Upsert profile data
 */

import { db } from "@/lib/db";
import { lawyerProfiles } from "@/lib/db/schema/lawyer";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";

// ---------------------------------------------------------------------------
// getLawyerProfile
// ---------------------------------------------------------------------------

export async function getLawyerProfile() {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "not_authenticated" };
  }
  if (session.user.role !== "avocat") {
    return { success: false, error: "unauthorized" };
  }

  try {
    let profile = await db.query.lawyerProfiles.findFirst({
      where: eq(lawyerProfiles.userId, session.user.id),
    });

    // Create default profile if none exists
    if (!profile) {
      const [created] = await db
        .insert(lawyerProfiles)
        .values({
          userId: session.user.id,
          specialties: "[]",
          notifyNewCase: 1,
          notifyNewMessage: 1,
        })
        .returning();
      profile = created;
    }

    return {
      success: true,
      profile: {
        id: profile.id,
        firmName: profile.firmName,
        phone: profile.phone,
        specialties: safeJsonParse<string[]>(profile.specialties, []),
        notifyNewCase: !!profile.notifyNewCase,
        notifyNewMessage: !!profile.notifyNewMessage,
      },
    };
  } catch (error) {
    console.error("[lawyer-settings] getLawyerProfile failed:", error);
    return { success: false, error: "retrieval_failed" };
  }
}

// ---------------------------------------------------------------------------
// updateLawyerProfile
// ---------------------------------------------------------------------------

export interface UpdateLawyerProfileData {
  firmName?: string;
  phone?: string;
  specialties?: string[];
  notifyNewCase?: boolean;
  notifyNewMessage?: boolean;
}

export async function updateLawyerProfile(data: UpdateLawyerProfileData) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "not_authenticated" };
  }
  if (session.user.role !== "avocat") {
    return { success: false, error: "unauthorized" };
  }

  try {
    // Build update set
    const updateSet: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (data.firmName !== undefined) updateSet.firmName = data.firmName;
    if (data.phone !== undefined) updateSet.phone = data.phone;
    if (data.specialties !== undefined) updateSet.specialties = JSON.stringify(data.specialties);
    if (data.notifyNewCase !== undefined) updateSet.notifyNewCase = data.notifyNewCase ? 1 : 0;
    if (data.notifyNewMessage !== undefined) updateSet.notifyNewMessage = data.notifyNewMessage ? 1 : 0;

    // Check if profile exists
    const existing = await db.query.lawyerProfiles.findFirst({
      where: eq(lawyerProfiles.userId, session.user.id),
    });

    if (existing) {
      await db
        .update(lawyerProfiles)
        .set(updateSet)
        .where(eq(lawyerProfiles.id, existing.id));
    } else {
      await db.insert(lawyerProfiles).values({
        userId: session.user.id,
        firmName: data.firmName ?? null,
        phone: data.phone ?? null,
        specialties: data.specialties ? JSON.stringify(data.specialties) : "[]",
        notifyNewCase: data.notifyNewCase === false ? 0 : 1,
        notifyNewMessage: data.notifyNewMessage === false ? 0 : 1,
      });
    }

    return { success: true };
  } catch (error) {
    console.error("[lawyer-settings] updateLawyerProfile failed:", error);
    return { success: false, error: "update_failed" };
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function safeJsonParse<T>(value: string | null | undefined, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}
