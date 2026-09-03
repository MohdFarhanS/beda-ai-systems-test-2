import { GoogleGenAI } from "@google/genai";

import { buildAnalysisPrompt } from "./prompts";
import { aiAnalysisSchema } from "./schema";
import type { NormalizedEnquiry } from "../data/types";

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  throw new Error("GEMINI_API_KEY is not configured");
}

const ai = new GoogleGenAI({
  apiKey,
});

const MODEL = "gemini-3.6-flash";

export type GeminiErrorCode =
  | "GEMINI_SERVICE_UNAVAILABLE"
  | "GEMINI_RATE_LIMITED"
  | "GEMINI_AUTH_ERROR"
  | "GEMINI_REQUEST_FAILED";

export class GeminiError extends Error {
  code: GeminiErrorCode;
  cause?: unknown;

  constructor(
    code: GeminiErrorCode,
    message: string,
    cause?: unknown,
  ) {
    super(message);
    this.name = "GeminiError";
    this.code = code;
    this.cause = cause;
  }
}

function getStatus(error: unknown): number | null {
  if (
    typeof error === "object" &&
    error !== null &&
    "status" in error &&
    typeof error.status === "number"
  ) {
    return error.status;
  }

  return null;
}

function classifyGeminiError(error: unknown): GeminiError {
  const status = getStatus(error);
  const errorText =
    error instanceof Error ? error.message : String(error);

  if (
    errorText.includes("API_KEY_INVALID") ||
    errorText.includes("API key not valid")
  ) {
    return new GeminiError(
      "GEMINI_AUTH_ERROR",
      "Gemini API key is invalid or rejected.",
      error,
    );
  }

  if (status === 401 || status === 403) {
    return new GeminiError(
      "GEMINI_AUTH_ERROR",
      "Gemini authentication or authorization failed.",
      error,
    );
  }

  if (status === 429) {
    return new GeminiError(
      "GEMINI_RATE_LIMITED",
      "Gemini API rate limit was reached.",
      error,
    );
  }

  if (status === 500 || status === 502 || status === 503 || status === 504) {
    return new GeminiError(
      "GEMINI_SERVICE_UNAVAILABLE",
      `Gemini service is currently unavailable (HTTP ${status}).`,
      error,
    );
  }

  return new GeminiError(
    "GEMINI_REQUEST_FAILED",
    "The Gemini API request failed due to an external dependency error.",
    error,
  );
}

export async function analyzeWithGemini(
  input: NormalizedEnquiry,
) {
  let response;

  try {
    response = await ai.models.generateContent({
      model: MODEL,
      contents: buildAnalysisPrompt(input),
      config: {
        responseMimeType: "application/json",
      },
    });
  } catch (error) {
    throw classifyGeminiError(error);
  }

  const text = response.text;

  if (!text) {
    throw new Error("Gemini returned an empty response");
  }

  let parsed: unknown;

  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error("Gemini returned invalid JSON");
  }

  return aiAnalysisSchema.parse(parsed);
}