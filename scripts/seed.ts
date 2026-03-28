/**
 * LegalConnect — Seed script
 *
 * Applies the Drizzle schema (via drizzle-kit push) then inserts test data:
 *   - 1 avocat (Me Sophie Martin)
 *   - 1 client (Jean Dupont)
 *   - 3 intake templates (famille, travail, penal)
 *   - 1 submitted dossier (divorce amiable)
 *   - 1 AI case summary
 *
 * Usage: npx tsx scripts/seed.ts
 * Requires: DATABASE_URL in .env or environment
 */

import { execSync } from "node:child_process";
import { drizzle } from "drizzle-orm/node-postgres";
import { eq, sql } from "drizzle-orm";
import { hashSync } from "bcryptjs";

import {
  users,
  lawyerProfiles,
  intakeTemplates,
  intakeSubmissions,
  caseSummaries,
} from "../apps/web/src/lib/db/schema";

import {
  seedTemplates,
} from "../apps/web/src/lib/db/seed/intake-templates";

// ---------------------------------------------------------------------------
// 1. Apply schema via drizzle-kit push
// ---------------------------------------------------------------------------

console.log("[seed] Applying schema with drizzle-kit push...");
execSync("cd apps/web && npx drizzle-kit push --force", {
  stdio: "inherit",
  env: { ...process.env },
});
console.log("[seed] Schema applied.\n");

// ---------------------------------------------------------------------------
// 2. Connect to database
// ---------------------------------------------------------------------------

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("[seed] ERROR: DATABASE_URL is not set. Check your .env file.");
  process.exit(1);
}

const db = drizzle(DATABASE_URL);

async function main() {
  // Check if already seeded
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(users);

  if (count > 0) {
    console.log(`[seed] Database already has ${count} user(s). Skipping seed.`);
    process.exit(0);
  }

  console.log("[seed] Seeding database...\n");

  const passwordHash = hashSync("Test1234!", 10);
  const now = new Date();

  // -------------------------------------------------------------------------
  // 3. Create avocat user
  // -------------------------------------------------------------------------

  const [avocat] = await db
    .insert(users)
    .values({
      email: "avocat@test.legalconnect.fr",
      name: "Me Sophie Martin",
      role: "avocat",
      passwordHash,
      emailVerified: now,
    })
    .returning();

  console.log(`[seed] Avocat created: ${avocat.email} (id: ${avocat.id})`);

  // -------------------------------------------------------------------------
  // 4. Create lawyer profile
  // -------------------------------------------------------------------------

  await db.insert(lawyerProfiles).values({
    userId: avocat.id,
    firmName: "Cabinet Martin & Associes",
    specialties: JSON.stringify(["famille", "travail", "penal"]),
    phone: "+33 1 23 45 67 89",
  });

  console.log("[seed] Lawyer profile created.");

  // -------------------------------------------------------------------------
  // 5. Create client user
  // -------------------------------------------------------------------------

  const [client] = await db
    .insert(users)
    .values({
      email: "client@test.legalconnect.fr",
      name: "Jean Dupont",
      role: "client",
      passwordHash,
      emailVerified: now,
    })
    .returning();

  console.log(`[seed] Client created: ${client.email} (id: ${client.id})`);

  // -------------------------------------------------------------------------
  // 6. Create 3 intake templates
  // -------------------------------------------------------------------------

  const templateIds: Record<string, string> = {};

  for (const { specialty, template } of seedTemplates) {
    const slug = `me-sophie-martin-${specialty}`;
    const [row] = await db
      .insert(intakeTemplates)
      .values({
        lawyerId: avocat.id,
        specialty,
        schema: template,
        slug,
        isActive: 1,
      })
      .returning();

    templateIds[specialty] = row.id;
    console.log(`[seed] Template created: ${specialty} (slug: ${slug})`);
  }

  // -------------------------------------------------------------------------
  // 7. Create 1 intake submission (test dossier)
  // -------------------------------------------------------------------------

  const [submission] = await db
    .insert(intakeSubmissions)
    .values({
      userId: client.id,
      problemType: "famille",
      description:
        "Mon conjoint et moi souhaitons divorcer a l'amiable. Nous avons 2 enfants (6 et 9 ans) et un bien immobilier commun. Nous sommes d'accord sur la garde alternee mais pas sur la repartition du bien.",
      fullName: "Jean Dupont",
      phone: "+33 6 12 34 56 78",
      status: "submitted",
      templateId: templateIds["famille"],
    })
    .returning();

  console.log(`[seed] Submission created: ${submission.id}`);

  // -------------------------------------------------------------------------
  // 8. Create 1 case summary (AI intelligence)
  // -------------------------------------------------------------------------

  await db.insert(caseSummaries).values({
    submissionId: submission.id,
    summary:
      "Dossier de divorce amiable avec deux points de negociation : la garde des enfants (accord sur alternance) et la repartition d'un bien immobilier commun. Situation relativement favorable a une resolution rapide par consentement mutuel.",
    keyFacts: JSON.stringify([
      "Divorce amiable",
      "2 enfants (6 et 9 ans)",
      "Bien immobilier commun",
      "Accord garde alternee",
      "Desaccord repartition bien",
    ]),
    legalDomain: "famille",
    parties: JSON.stringify([
      { name: "Jean Dupont", role: "Demandeur" },
      { name: "Conjoint(e) Dupont", role: "Partie adverse" },
    ]),
    urgencyAssessment: "low",
    aiModel: "seed-data",
    aiTokensUsed: 0,
  });

  console.log("[seed] Case summary created.\n");

  // -------------------------------------------------------------------------
  // Done
  // -------------------------------------------------------------------------

  console.log("[seed] Seed complete!");
  console.log("[seed] Test accounts:");
  console.log("  - avocat@test.legalconnect.fr / Test1234!");
  console.log("  - client@test.legalconnect.fr / Test1234!");

  process.exit(0);
}

main().catch((err) => {
  console.error("[seed] ERROR:", err);
  process.exit(1);
});
