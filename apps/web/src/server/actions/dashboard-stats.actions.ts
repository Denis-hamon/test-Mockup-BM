"use server";

import { db } from "@/lib/db";
import { intakeSubmissions } from "@/lib/db/schema/intake";
import { auth } from "@/lib/auth";
import { sql, ne, eq, gte } from "drizzle-orm";

export interface DashboardStats {
  totalCases: number;
  newCases: number;
  inProgressCases: number;
  completedCases: number;
}

export async function getDashboardStats(): Promise<{
  success: boolean;
  data?: DashboardStats;
}> {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "avocat") {
    return { success: false };
  }

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const [counts] = await db
    .select({
      total: sql<number>`count(*) filter (where ${intakeSubmissions.status} != 'draft')`,
      new: sql<number>`count(*) filter (where ${intakeSubmissions.status} = 'submitted')`,
      inProgress: sql<number>`count(*) filter (where ${intakeSubmissions.status} = 'en_cours')`,
      completed: sql<number>`count(*) filter (where ${intakeSubmissions.status} = 'termine')`,
    })
    .from(intakeSubmissions);

  return {
    success: true,
    data: {
      totalCases: Number(counts.total),
      newCases: Number(counts.new),
      inProgressCases: Number(counts.inProgress),
      completedCases: Number(counts.completed),
    },
  };
}
