import type {
  AIAnalysis,
  CRMMatch,
  CRMRecord,
  NormalizedEnquiry,
} from "../data/types";

function normalize(value: string | null | undefined): string {
  return (value ?? "").trim().toLowerCase();
}

function normalizePhone(value: string | null | undefined): string {
  return (value ?? "").replace(/\D/g, "");
}

export function matchCRM(
  input: NormalizedEnquiry,
  analysis: AIAnalysis,
  records: CRMRecord[],
): CRMMatch {
  const email = normalize(analysis.email.value);
  const phone = normalizePhone(analysis.phone.value);

  if (email) {
    const exactEmailMatches = records.filter(
      (record) => normalize(record.email) === email,
    );

    if (exactEmailMatches.length === 1) {
      return {
        status: "matched",
        crmId: exactEmailMatches[0].id,
        matchMethod: "exact_email",
        candidates: [exactEmailMatches[0].id],
      };
    }

    if (exactEmailMatches.length > 1) {
      return {
        status: "possible_match",
        crmId: null,
        matchMethod: "multiple_exact_email_matches",
        candidates: exactEmailMatches.map((record) => record.id),
      };
    }
  }

  if (phone) {
    const exactPhoneMatches = records.filter(
      (record) => normalizePhone(record.phone) === phone,
    );

    if (exactPhoneMatches.length === 1) {
      return {
        status: "matched",
        crmId: exactPhoneMatches[0].id,
        matchMethod: "exact_phone",
        candidates: [exactPhoneMatches[0].id],
      };
    }

    if (exactPhoneMatches.length > 1) {
      return {
        status: "possible_match",
        crmId: null,
        matchMethod: "multiple_exact_phone_matches",
        candidates: exactPhoneMatches.map((record) => record.id),
      };
    }
  }

  return {
    status: "no_match",
    crmId: null,
    matchMethod: null,
    candidates: [],
  };
}