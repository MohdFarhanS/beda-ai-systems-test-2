import { z } from "zod";

import { CATEGORIES } from "../data/types";

const extractedFieldSchema = z.object({
  value: z.string().nullable(),
  source: z.enum(["email", "attachment", "crm", "not_provided"]),
});

export const aiAnalysisSchema = z.object({
  category: z.enum(CATEGORIES),
  confidence: z.number().min(0).max(1),
  reasoning: z.string(),

  contactName: extractedFieldSchema,
  company: extractedFieldSchema,
  email: extractedFieldSchema,
  phone: extractedFieldSchema,
  location: extractedFieldSchema,
  businessNeed: extractedFieldSchema,
  service: extractedFieldSchema,
  timeline: extractedFieldSchema,
  scale: extractedFieldSchema,

  missingFields: z.array(z.string()),
  uncertainties: z.array(z.string()),

  responseNeeded: z.boolean(),
  responseDraft: z.string().nullable(),
});

export type ValidatedAIAnalysis = z.infer<typeof aiAnalysisSchema>;