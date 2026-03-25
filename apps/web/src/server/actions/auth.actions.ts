"use server";

import { db } from "@/lib/db";
import {
  users,
  emailVerificationTokens,
  passwordResetTokens,
} from "@/lib/db/schema/auth";
import {
  registerSchema,
  resetPasswordRequestSchema,
  resetPasswordSchema,
} from "@legalconnect/shared";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { eq, and, isNull } from "drizzle-orm";
import {
  sendVerificationEmail,
  sendPasswordResetEmail,
} from "@legalconnect/email";

export async function registerUser(formData: FormData) {
  const data = registerSchema.parse({
    email: formData.get("email"),
    password: formData.get("password"),
    role: formData.get("role"),
  });

  // Check if user exists
  const existing = await db.query.users.findFirst({
    where: eq(users.email, data.email),
  });
  if (existing) {
    return { error: "Un compte avec cet email existe deja." };
  }

  // Hash password with bcrypt cost 12 (D-08: min 8 chars enforced by Zod schema)
  const passwordHash = await bcrypt.hash(data.password, 12);

  // Create user
  const [user] = await db
    .insert(users)
    .values({
      email: data.email,
      passwordHash,
      role: data.role,
    })
    .returning();

  // Create verification token (D-14: 24h expiry)
  const token = crypto.randomBytes(32).toString("hex");
  await db.insert(emailVerificationTokens).values({
    userId: user.id,
    token,
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
  });

  // Send verification email (D-12: warm tone, D-13: noreply@legalconnect.fr)
  await sendVerificationEmail(data.email, token);

  return { success: true };
}

export async function verifyEmail(token: string) {
  if (!token) {
    return { error: "Token de verification manquant." };
  }

  // Find token
  const verificationToken = await db.query.emailVerificationTokens.findFirst({
    where: eq(emailVerificationTokens.token, token),
  });

  if (!verificationToken) {
    return { error: "Lien de verification invalide." };
  }

  // Check not expired (24h per D-14)
  if (verificationToken.expiresAt < new Date()) {
    return { error: "Lien de verification expire. Veuillez en demander un nouveau." };
  }

  // Check not already used
  if (verificationToken.usedAt) {
    return { error: "Ce lien de verification a deja ete utilise." };
  }

  // Mark user as verified
  await db
    .update(users)
    .set({ emailVerified: new Date() })
    .where(eq(users.id, verificationToken.userId));

  // Mark token as used
  await db
    .update(emailVerificationTokens)
    .set({ usedAt: new Date() })
    .where(eq(emailVerificationTokens.id, verificationToken.id));

  return { success: true };
}

export async function requestPasswordReset(formData: FormData) {
  const data = resetPasswordRequestSchema.parse({
    email: formData.get("email"),
  });

  // Find user - always return success to not reveal if email exists
  const user = await db.query.users.findFirst({
    where: eq(users.email, data.email),
  });

  if (user) {
    // Create reset token (D-14: 1h expiry)
    const token = crypto.randomBytes(32).toString("hex");
    await db.insert(passwordResetTokens).values({
      userId: user.id,
      token,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
    });

    // Send reset email
    await sendPasswordResetEmail(data.email, token);
  }

  // Always return success (don't reveal if email exists)
  return { success: true };
}

export async function resetPassword(formData: FormData) {
  const data = resetPasswordSchema.parse({
    token: formData.get("token"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  // Find token
  const resetToken = await db.query.passwordResetTokens.findFirst({
    where: eq(passwordResetTokens.token, data.token),
  });

  if (!resetToken) {
    return { error: "Lien de reinitialisation invalide." };
  }

  // Check not expired (1h per D-14)
  if (resetToken.expiresAt < new Date()) {
    return { error: "Lien de reinitialisation expire. Veuillez en demander un nouveau." };
  }

  // Check not already used
  if (resetToken.usedAt) {
    return { error: "Ce lien de reinitialisation a deja ete utilise." };
  }

  // Hash new password with bcrypt cost 12
  const passwordHash = await bcrypt.hash(data.password, 12);

  // Update user password
  await db
    .update(users)
    .set({ passwordHash, updatedAt: new Date() })
    .where(eq(users.id, resetToken.userId));

  // Mark token as used
  await db
    .update(passwordResetTokens)
    .set({ usedAt: new Date() })
    .where(eq(passwordResetTokens.id, resetToken.id));

  return { success: true };
}
