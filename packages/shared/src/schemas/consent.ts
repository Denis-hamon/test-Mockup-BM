import { z } from "zod";

export const consentUpdateSchema = z.object({
  type: z.enum(["essential", "analytics"]),
  granted: z.boolean(),
});

export const dataExportRequestSchema = z.object({
  format: z.enum(["json", "zip"]).default("zip"),
});

export type ConsentUpdateInput = z.infer<typeof consentUpdateSchema>;
export type DataExportRequestInput = z.infer<typeof dataExportRequestSchema>;
