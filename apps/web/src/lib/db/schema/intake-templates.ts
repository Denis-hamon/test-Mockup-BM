import {
  pgTable,
  text,
  timestamp,
  integer,
  jsonb,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { users } from "./auth";
import { intakeSubmissions } from "./intake";

// ---------------------------------------------------------------------------
// Intake templates — lawyer-customizable form schemas
// ---------------------------------------------------------------------------

export const intakeTemplates = pgTable("intake_templates", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  lawyerId: text("lawyer_id")
    .notNull()
    .references(() => users.id),
  specialty: text("specialty").notNull(),
  schema: jsonb("schema").notNull(), // IntakeTemplate JSON
  logoUrl: text("logo_url"),
  accentColor: text("accent_color"),
  welcomeText: text("welcome_text"),
  slug: text("slug").unique(),
  isActive: integer("is_active").default(1).notNull(),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
});

// ---------------------------------------------------------------------------
// Template snapshots — frozen copy at submission time (D-03)
// ---------------------------------------------------------------------------

export const intakeTemplateSnapshots = pgTable("intake_template_snapshots", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  templateId: text("template_id")
    .notNull()
    .references(() => intakeTemplates.id),
  schema: jsonb("schema").notNull(), // Frozen IntakeTemplate JSON
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
});

// ---------------------------------------------------------------------------
// Relations
// ---------------------------------------------------------------------------

export const intakeTemplatesRelations = relations(
  intakeTemplates,
  ({ one, many }) => ({
    lawyer: one(users, {
      fields: [intakeTemplates.lawyerId],
      references: [users.id],
    }),
    snapshots: many(intakeTemplateSnapshots),
  })
);

export const intakeTemplateSnapshotsRelations = relations(
  intakeTemplateSnapshots,
  ({ one }) => ({
    template: one(intakeTemplates, {
      fields: [intakeTemplateSnapshots.templateId],
      references: [intakeTemplates.id],
    }),
  })
);
