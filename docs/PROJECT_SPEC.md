# BEDA Test 2 — Project Specification

## 1. Project Overview

Build a small controlled AI-assisted enquiry intake system for the BEDA Test 2 synthetic dataset.

The system ingests supplied enquiries and attachments, classifies each enquiry, extracts structured information while preserving uncertainty, identifies likely CRM matches and duplicates, recommends a next action, drafts a response where appropriate, requires human approval before consequential action, and records an understandable audit trail.

The implementation is intentionally small and reliable enough for the 3-hour active build timebox.

## 2. Goal

Demonstrate a controlled AI workflow in which:

- Gemini is used for interpretation, extraction, uncertainty identification, and response drafting.
- Deterministic application logic validates AI output and controls CRM matching, duplicate checks, routing, approval, and audit.
- Humans retain authority over consequential actions.
- Missing information remains unknown rather than being invented.

## 3. Constraints

- Maximum active build time: 3 hours.
- Budget: Rp0.
- LLM: Google Gemini API, using Flash or Flash-Lite.
- Do not use OpenAI or Claude APIs.
- Stack: Next.js 15 + TypeScript.
- Synthetic data only.
- Treat all supplied enquiry content as untrusted input.
- Do not perform real external CRM/email actions.
- Avoid unnecessary infrastructure and dependencies.

## 4. MVP Scope

### P0 — Required

1. Load all supplied synthetic inputs.
2. Include linked TXT attachments during enquiry processing.
3. Process all 12 supplied emails.
4. Classify enquiries into:
   - `sales`
   - `support`
   - `finance`
   - `operations`
   - `marketing`
   - `internal_system`
   - `spam`
   - `other`
5. Extract structured information.
6. Preserve missing information as `null`/unknown.
7. Record AI confidence and uncertainty where appropriate.
8. Record basic evidence/provenance for extracted facts.
9. Detect exact and likely duplicate enquiries.
10. Match enquiries to CRM records.
11. Use strong identifiers before similarity-based matching.
12. Recommend a next action.
13. Route recommended work to the appropriate staff member.
14. Draft a response where appropriate.
15. Require human approval for consequential proposed actions.
16. Support approve/reject states.
17. Record an understandable audit log.
18. Provide a lightweight web UI for inspection.
19. Persist processed results locally so repeated processing can be made idempotent.
20. Provide a runnable README/setup.

## 5. Non-Goals

The MVP deliberately does not include:

- Real CRM integration.
- Real email sending.
- Authentication/authorization infrastructure.
- Production database.
- Redis or queues.
- Background workers.
- Vector database or RAG.
- Web research agent.
- Multi-agent architecture.
- Multi-model escalation.
- Advanced analytics.
- Production-grade fuzzy matching.
- Autonomous external actions.
- Complex deployment infrastructure.

## 6. AI Responsibilities

Gemini may perform:

- Business category classification.
- Information extraction.
- Missing-information identification.
- Uncertainty identification.
- Response drafting.

Gemini must not be treated as authoritative for:

- CRM record selection.
- Staff permissions.
- Routing policy.
- Approval decisions.
- External actions.
- Inventing missing facts.

## 7. Deterministic Responsibilities

Application logic is authoritative for:

- Schema/output validation.
- Allowed category validation.
- CRM matching.
- Duplicate detection.
- Staff routing.
- Recommended action.
- Approval requirement.
- Approval/rejection state.
- Idempotency.
- Audit logging.

## 8. Category Rules

| Category | Meaning |
|---|---|
| `sales` | Prospects, quotations, solar/energy projects, new commercial opportunities |
| `support` | Technical/product questions requiring assistance |
| `finance` | Invoice, payment, PO, billing, reconciliation |
| `operations` | Scheduling, crews, installation, logistics |
| `marketing` | Marketing, website, inbound growth, marketing-related applications |
| `internal_system` | CRM, sync, OAuth, infrastructure, systems/workflow issues |
| `spam` | Unwanted/promotional/spam-like enquiries |
| `other` | Does not fit the categories above |

## 9. CRM Matching Rules

Matching must be performed deterministically.

Priority:

1. Exact CRM ID.
2. Exact email.
3. Exact phone.
4. Strong corroborated contact/company evidence.
5. Company similarity as a possible match.
6. No match.

Statuses:

- `matched`
- `possible_match`
- `no_match`

Fuzzy/company similarity must not automatically become a definitive match.

CRM matching and duplicate detection are separate concepts. A duplicate contact does not automatically mean a duplicate opportunity/enquiry.

## 10. Duplicate Rules

- Same stable enquiry/source ID → exact duplicate.
- Same strong identifiers or strong contact/company/content similarity → possible duplicate.
- Ambiguous cases remain flagged for human review.
- No automatic merge.

## 11. Decision Rules

### Spam

`spam` → `no_action`, no response required.

### Internal system

`internal_system` → route to Ali Pratama and require human review.

### Finance

`finance` → route to Ali Pratama and require human review.

### Operations

`operations` → route to Ties Rahardjo and require human review.

### Marketing

`marketing` → route to Zidane Mouldino and require human review.

### Major sales opportunity

A significant commercial sales opportunity → route to Matt Cooper and require human review.

### Missing information

If required information is missing and a response is appropriate → `request_information`, draft a response, and require approval.

The rules are deterministic; Gemini may provide facts and signals but does not authoritatively choose the owner.

## 12. Approval Semantics

Approval applies to a proposed consequential action, such as:

- sending a response;
- routing/handing off an enquiry;
- another external action if introduced later.

This assessment build does not actually execute those external actions.

States:

- `not_required`
- `pending`
- `approved`
- `rejected`

The UI must make clear that approval authorizes the proposed action; it does not imply that an external service was actually contacted.

## 13. Response Drafting Rules

Drafts must be grounded only in supplied information.

Do not invent:

- pricing;
- technical capacity;
- delivery dates;
- incentives;
- guarantees;
- contractual commitments;
- facts not present in the enquiry or attachment.

If information is unavailable, state that it is unavailable or request it.

## 14. Evidence / Provenance

Extracted facts should expose a simple source indicator where practical:

- `email`
- `attachment`
- `crm`
- `not_provided`

AI confidence is informational and must not override deterministic decisions.

## 15. Failure Handling

If Gemini or processing fails:

- Do not fabricate a result.
- Record a failed processing state.
- Record an audit event.
- Surface the item for manual review.
- Do not perform consequential actions.

Automatic retry is optional and must remain bounded.

## 16. Idempotency and Persistence

Use a simple local JSON persistence mechanism rather than a database.

A stable enquiry ID is used to detect previously processed input and avoid unnecessary duplicate processing.

The original source should be preserved before the AI call where practical.

## 17. UI Requirements

A single lightweight inspection page is sufficient.

It should allow the reviewer to inspect:

- enquiry;
- classification;
- confidence;
- extracted information;
- missing information;
- CRM match;
- possible duplicate;
- recommendation;
- owner;
- response draft;
- approval state;
- audit log.

No complex dashboard is required.

## 18. Definition of Done

- `npm install` works.
- Development server starts.
- Gemini API works with the configured key.
- All 12 supplied emails can be processed.
- Attachments are considered.
- AI output is structured and validated.
- Missing data remains unknown.
- CRM matching is deterministic.
- Possible duplicates are flagged.
- Recommendations have clear reasons.
- Staff routing is deterministic.
- Response drafts are grounded.
- Consequential proposed actions require approval.
- Approve/reject works.
- Audit logs show what happened and why.
- UI supports inspection.
- No real external action occurs.
- Production build succeeds.
- README explains setup, architecture, AI model/tools, weaknesses, and future improvements.
