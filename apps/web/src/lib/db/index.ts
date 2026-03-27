import { drizzle } from "drizzle-orm/node-postgres";
import * as authSchema from "./schema/auth";
import * as encryptionSchema from "./schema/encryption";
import * as consentSchema from "./schema/consent";
import * as intakeSchema from "./schema/intake";
import * as caseIntelligenceSchema from "./schema/case-intelligence";
import * as lawyerSchema from "./schema/lawyer";
import * as messagingSchema from "./schema/messaging";
import * as appointmentsSchema from "./schema/appointments";
import * as intakeTemplatesSchema from "./schema/intake-templates";

export const db = drizzle(process.env.DATABASE_URL!, {
  schema: { ...authSchema, ...encryptionSchema, ...consentSchema, ...intakeSchema, ...caseIntelligenceSchema, ...lawyerSchema, ...messagingSchema, ...appointmentsSchema, ...intakeTemplatesSchema },
});
