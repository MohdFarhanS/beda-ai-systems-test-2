import type { NormalizedEnquiry } from "../data/types";

const LEGAL_COMPLIANCE_SIGNALS = [
  "legal",
  "compliance",
  "regulatory",
  "regulation",
  "regulator",
  "lawsuit",
  "litigation",
  "contract dispute",
  "breach of contract",
  "terms and conditions",
  "terms of service",
  "data protection",
  "data privacy",
  "privacy law",
  "gdpr",
  "audit",
  "licensing",
  "license requirement",
  "permit",
  "legal notice",
];

export function detectLegalCompliance(
  input: NormalizedEnquiry,
): boolean {
  const text = [
    input.enquiry.subject,
    input.enquiry.body,
    input.attachment?.content ?? "",
  ]
    .join(" ")
    .toLowerCase();

  return LEGAL_COMPLIANCE_SIGNALS.some((signal) =>
    text.includes(signal),
  );
}
