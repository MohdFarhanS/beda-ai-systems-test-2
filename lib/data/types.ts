export const CATEGORIES = [
    "sales",
    "support",
    "finance",
    "operations",
    "marketing",
    "internal_system",
    "spam",
    "other",
] as const;

export type Category = (typeof CATEGORIES)[number];

export type EvidenceSource = 
    | "email"
    | "attachment"
    | "crm"
    | "not_provided";

export type CRMMatchStatus = 
    | "matched"
    | "possible_match"
    | "no_match";

export type DuplicateStatus = 
    | "none"
    | "exact_duplicate"
    | "possible_duplicate"
    | "human_review";

export type ApprovalStatus = 
    | "not_required"
    | "pending"
    | "approved"
    | "rejected";

export type Enquiry = {
    id: string;
    from: string;
    subject: string;
    body: string;
    attachment?: string | null;
};

export type Attachment = {
    filename: string;
    content: string;
}

export type NormalizedEnquiry = {
    enquiry: Enquiry;
    attachment: Attachment | null;
};

export type ExtractedField<T = string> = {
    value: T | null;
    source: EvidenceSource;
};

export type AIAnalysis = {
    category: Category;
    confidence: number;
    reasoning: string;

    contactName: ExtractedField;
    company: ExtractedField;
    email: ExtractedField;
    phone: ExtractedField;
    location: ExtractedField;
    businessNeed: ExtractedField;
    service: ExtractedField;
    timeline: ExtractedField;
    scale: ExtractedField;

    missingFields: string[];
    uncertainties: string[];

    responseNeeded: boolean;
    responseDraft: string | null;
};

export type CRMRecord = {
    id: string;
    company: string;
    contact: string;
    email: string;
    phone: string;
    location: string;
    status: string;
    service: string;
    state: string;
};

export type StaffMember = {
    name: string;
    role: string;
    owns: string;
};

export type CRMMatch = {
    status: CRMMatchStatus;
    crmId: string | null;
    matchMethod: string | null;
    candidates: string[];
};

export type DuplicateResult = {
    status: DuplicateStatus;
    relatedEnquiryIds: string[];
    reason: string;
};

export type Recommendation = {
    action: string;
    owner: string | null;
    reason: string;
    requiresApproval: boolean;
};

export type ResponseDraft = {
    needed: boolean;
    draft: string | null;
    requiresApproval: boolean;
};

export type Approval = {
    status: ApprovalStatus;
    approvedBy: string | null;
    approvedAt: string | null;
};

export type AuditEvent = {
    timestamp: string;
    event: string;
    summary: string;
};

export type ProcessedEnquiry = {
    source: Enquiry;
    classification: AIAnalysis | null;
    crmMatch: CRMMatch;
    duplicate: DuplicateResult;
    recommendation: Recommendation;
    response: ResponseDraft;
    approval: Approval;
    audit: AuditEvent[];
    status: "processed" | "failed";
    error?: string;
};