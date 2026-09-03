import type {
  DuplicateResult,
  Enquiry,
} from "../data/types";

function normalize(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

function normalizePhone(value: string): string {
  return value.replace(/\D/g, "");
}

function extractEmail(from: string): string | null {
  const match = from.match(
    /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i,
  );

  return match ? normalizeEmail(match[0]) : null;
}

function extractPhone(text: string): string | null {
  const match = text.match(
    /(?:\+?61\s?)?0?4\d{2}[\s-]?\d{3}[\s-]?\d{3}/,
  );

  return match ? normalizePhone(match[0]) : null;
}

function extractContactName(enquiry: Enquiry): string | null {
  const email = extractEmail(enquiry.from);

  if (email) {
    const displayName = enquiry.from
      .replace(email, "")
      .trim();

    if (displayName) {
      return displayName;
    }
  }

  const nameAfterComma = enquiry.body.match(
    /,\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\b/,
  );

  if (nameAfterComma) {
    return nameAfterComma[1].trim();
  }

  const nameMatch = enquiry.body.match(
    /\b(?:name is|I'm|I am)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\b/,
  );

  if (nameMatch) {
    return nameMatch[1].trim();
  }

  if (email) {
    const localPart = email.split("@")[0];

    if (localPart) {
      return localPart.split(/[._-]/)[0];
    }
  }

  return null;
}

function extractCompany(enquiry: Enquiry): string | null {
  const companyMatch = enquiry.body.match(
    /company\s*:\s*(.+)/i,
  );

  if (companyMatch) {
    return companyMatch[1].trim();
  }

  const email = extractEmail(enquiry.from);

  if (!email) {
    return null;
  }

  const domain = email.split("@")[1];

  if (!domain) {
    return null;
  }

  const companyPart = domain.split(".")[0];

  return companyPart || null;
}

function companyMatches(
  first: string | null,
  second: string | null,
): boolean {
  if (!first || !second) {
    return false;
  }

  const a = normalize(first);
  const b = normalize(second);

  return a === b || a.includes(b) || b.includes(a);
}

function contactMatches(
  first: string | null,
  second: string | null,
): boolean {
  if (!first || !second) {
    return false;
  }

  const a = normalize(first);
  const b = normalize(second);

  return a === b;
}

export function detectDuplicate(
  enquiry: Enquiry,
  existingEnquiries: Enquiry[],
): DuplicateResult {
  const enquiryEmail = extractEmail(enquiry.from);
  const enquiryPhone = extractPhone(
    `${enquiry.from} ${enquiry.body}`,
  );
  const enquiryContact = extractContactName(enquiry);
  const enquiryCompany = extractCompany(enquiry);

  const relatedEnquiryIds: string[] = [];

  for (const existing of existingEnquiries) {
    if (existing.id === enquiry.id) {
      continue;
    }

    const existingEmail = extractEmail(existing.from);
    const existingPhone = extractPhone(
      `${existing.from} ${existing.body}`,
    );
    const existingContact = extractContactName(existing);
    const existingCompany = extractCompany(existing);

    const emailMatches =
      Boolean(enquiryEmail) &&
      Boolean(existingEmail) &&
      enquiryEmail === existingEmail;

    const phoneMatches =
      Boolean(enquiryPhone) &&
      Boolean(existingPhone) &&
      enquiryPhone === existingPhone;

    const contactAndCompanyMatch =
      contactMatches(enquiryContact, existingContact) &&
      companyMatches(enquiryCompany, existingCompany);

    if (
      emailMatches ||
      phoneMatches ||
      contactAndCompanyMatch
    ) {
      relatedEnquiryIds.push(existing.id);
    }
  }

  if (relatedEnquiryIds.length > 0) {
    return {
      status: "possible_duplicate",
      relatedEnquiryIds,
      reason:
        "The enquiry shares strong contact identifiers or corroborated contact/company evidence with an existing enquiry.",
    };
  }

  return {
    status: "none",
    relatedEnquiryIds: [],
    reason: "No strong duplicate evidence was found.",
  };
}