import { drizzle } from "drizzle-orm/node-postgres";
import * as authSchema from "./schema/auth";
import * as encryptionSchema from "./schema/encryption";
import * as consentSchema from "./schema/consent";
import * as intakeSchema from "./schema/intake";

export const db = drizzle(process.env.DATABASE_URL!, {
  schema: { ...authSchema, ...encryptionSchema, ...consentSchema, ...intakeSchema },
});
