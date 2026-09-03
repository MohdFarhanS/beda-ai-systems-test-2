import type { AIAnalysis } from "../data/types";
import { aiAnalysisSchema } from "../ai/schema";

export function validateAIAnalysis(analysis: unknown): AIAnalysis {
  const result = aiAnalysisSchema.safeParse(analysis);

  if (!result.success) {
    throw new Error(
      `Invalid AI analysis: ${result.error.message}`,
    );
  }

  return result.data;
}