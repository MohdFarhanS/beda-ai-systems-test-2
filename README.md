# BEDA Test 2 — Controlled AI Enquiry Intake

A small controlled AI-assisted enquiry intake system built for the BEDA AI Systems Technical Assessment — Test 2.

The system processes synthetic enquiries and attachments, uses Google Gemini for interpretation, then applies deterministic application rules for CRM matching, duplicate detection, routing, recommendations, approval, and audit logging.

The core principle is:

> AI interprets and recommends; deterministic application logic controls what is allowed to happen; humans retain authority over consequential actions.

## Overview

The system follows this workflow:

```text
Incoming Enquiry
       ↓
AI Interpretation
       ↓
Structured Validation
       ↓
CRM Match + Duplicate Detection
       ↓
Deterministic Recommendation
       ↓
Proposed Action
       ↓
Human Approval
       ↓
Audit Trail
````

The MVP uses only the supplied synthetic dataset. It does not send real emails, modify a real CRM, or execute autonomous external actions.

## Key Capabilities

* Load synthetic email enquiries and linked TXT attachments.
* Classify enquiries into business categories.
* Extract structured information.
* Preserve missing information as `null` / unknown.
* Record AI confidence and uncertainty.
* Record basic evidence/provenance for extracted information.
* Match enquiries against the supplied CRM using deterministic rules.
* Detect likely duplicate enquiries separately from CRM matching.
* Recommend a next action and route it to the appropriate staff member.
* Draft grounded responses where appropriate.
* Require human approval for consequential proposed actions.
* Support approve/reject states.
* Persist processed results locally.
* Maintain an understandable audit trail.
* Provide a lightweight web interface for inspection.
* Handle Gemini failures without fabricating results.

## Architecture

The project uses a small modular monolith implemented with Next.js 15 and TypeScript.

```text
Synthetic Inputs
      ↓
Ingestion
      ↓
Source / Idempotency Check
      ↓
Gemini Interpretation
      ↓
Structured Output Validation
      ↓
 ┌───────────────┬────────────────┐
 ↓               ↓                ↓
Duplicate     CRM Matcher      Decision Rules
Detection     (deterministic)  (deterministic)
 └───────────────┴────────────────┘
                  ↓
           Human Approval
                  ↓
             Audit Log
                  ↓
              Next.js UI
```

### AI responsibilities

Gemini is used for:

* business category classification;
* information extraction;
* missing-information identification;
* uncertainty identification;
* response drafting.

### Deterministic responsibilities

Application logic controls:

* schema and output validation;
* allowed categories;
* CRM matching;
* duplicate detection;
* staff routing;
* recommendation rules;
* approval requirements;
* approval/rejection state;
* idempotency;
* audit logging.

Gemini does not select the authoritative CRM record, owner, approval state, permissions, or external action.

## Technology

* Next.js 15
* TypeScript
* Google Gemini API
* `@google/genai`
* Local JSON persistence
* Synthetic JSON, CSV, and TXT data

Gemini is used through the server-side processing layer. The API key is not exposed to the browser.

## AI Tools Used

**Runtime model (used inside the application):**
Google Gemini 3.6 Flash, accessed via `@google/genai`. Chosen for its permanent free tier, strong structured-output support, and sufficient capability for classification, extraction, and response drafting at this task complexity.

**Development assistance:**
Claude was used as an AI coding assistant during development — for architecture planning, code review, and iteration within the 3-hour build window. All design decisions, trade-offs, and final implementation choices were made and validated by me.

## Project Structure

```text
app/
  api/
    enquiries/
      route.ts
      [id]/
        route.ts
        approve/route.ts
        reject/route.ts
    process/
      route.ts
  components/
    EnquiryList.tsx
    EnquiryDetail.tsx
  page.tsx

lib/
  ai/
    gemini.ts
    prompts.ts
  data/
    loader.ts
    types.ts
    results-store.ts
  crm/
    matcher.ts
  rules/
    validator.ts
    duplicate-detector.ts
    decision-engine.ts
  approval/
    service.ts
  audit/
    logger.ts
  processing/
    process-enquiry.ts

data/
  emails.json
  crm.csv
  staff_directory.json
  documents/
  processed-results.json

docs/
  PROJECT_SPEC.md
  IMPLEMENTATION_PLAN.md
  ARCHITECTURE.md
```

## Getting Started

### Requirements

* Node.js
* npm
* Google Gemini API key

### Installation

```bash
git clone https://github.com/MohdFarhanS/beda-ai-systems-test-2.git
cd beda-ai-systems-test-2
npm install
```

### Environment

Create `.env.local` in the project root:

```env
GEMINI_API_KEY=your_gemini_api_key
```

The Gemini API key must remain server-side and must not be exposed in client-side code.

### Run the development server

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

The UI provides a lightweight inspection view for processed enquiries.

## API

### Process an enquiry

```http
POST /api/process
```

Body:

```json
{
  "enquiryId": "E001"
}
```

The stable enquiry ID is used for idempotent processing.

### List processed enquiries

```http
GET /api/enquiries
```

Returns the currently persisted processed enquiries.

### Get one processed enquiry

```http
GET /api/enquiries/E001
```

### Approve a proposed action

```http
POST /api/enquiries/E001/approve
Content-Type: application/json
```

Body:

```json
{
  "approvedBy": "Reviewer"
}
```

### Reject a proposed action

```http
POST /api/enquiries/E001/reject
```

Approval only records the human decision. It does not send an email or modify an external CRM.

## Testing

API testing can be performed with Postman.

Representative scenarios include:

* processing a sales enquiry;
* processing a finance enquiry;
* processing a missing-information sales enquiry;
* CRM matching;
* duplicate detection;
* approve flow;
* reject flow;
* invalid approval state;
* invalid request input;
* idempotent reprocessing;
* Gemini external dependency failure.

Example process request:

```http
POST http://localhost:3000/api/process
Content-Type: application/json
```

```json
{
  "enquiryId": "E012"
}
```

Expected result:

* HTTP `200` for successful processing;
* structured classification and extraction;
* deterministic CRM and duplicate results;
* deterministic recommendation;
* approval state set according to the recommendation;
* audit events recorded.

For an enquiry requiring approval, the state follows:

```text
PENDING
   ↓
 ┌───────┐
 ↓       ↓
APPROVED REJECTED
```

An already approved or rejected proposal cannot be approved/rejected again.

## Failure Handling

Gemini failures are treated as external dependency failures rather than fabricated application results.

Examples include:

* `GEMINI_SERVICE_UNAVAILABLE`
* `GEMINI_RATE_LIMITED`
* `GEMINI_AUTH_ERROR`
* `GEMINI_REQUEST_FAILED`

When processing fails:

```text
Gemini failure
      ↓
No fabricated AI result
      ↓
Failure recorded in audit
      ↓
Failed processing state
      ↓
No consequential action
```

For example, an HTTP 503 from Gemini is surfaced as an external dependency failure so it can be distinguished from an application logic failure.

## Security and Trust Boundary

All supplied email and attachment content is treated as untrusted input.

Untrusted content must not be able to:

* change application policy;
* change permissions;
* bypass approval;
* change tool behavior;
* access secrets.

The application code controls available actions and business rules.

The Gemini API key remains server-side.

## Deterministic CRM Matching

CRM matching uses the following priority:

1. Exact CRM ID
2. Exact email
3. Exact phone
4. Strong corroborated contact/company evidence
5. Company similarity as a possible match
6. No match

Possible similarity does not automatically become a definitive CRM match.

CRM matching is also kept separate from duplicate detection.

## Duplicate Detection

Duplicate detection asks whether an enquiry is likely the same or repeated enquiry as another source.

Strong identifiers and corroborating evidence are preferred.

Ambiguous cases remain flagged rather than being automatically merged.

No automatic CRM merge is performed.

## Response Drafting

Response drafts are grounded only in supplied enquiry and attachment information.

The system does not invent:

* pricing;
* technical capacity;
* delivery dates;
* incentives;
* guarantees;
* contractual commitments;
* unsupported customer facts.

Draft responses remain subject to the configured approval requirement.

## UI

The web UI is intentionally lightweight and inspection-focused.

A reviewer can inspect:

1. Incoming enquiry
2. AI interpretation
3. Extracted information and evidence
4. Missing information
5. Uncertainty
6. CRM match
7. Duplicate check
8. Deterministic recommendation
9. Owner and proposed action
10. Response draft
11. Human approval state
12. Audit trail

The interface deliberately avoids a complex analytics dashboard because the assessment focuses on a controlled enquiry workflow rather than reporting infrastructure.

## Known Weaknesses

This is an assessment MVP rather than a production system.

Known limitations include:

* Local JSON persistence instead of a production database.
* No authentication or authorization infrastructure.
* No real CRM integration.
* No real email integration.
* No background workers or queues.
* No production-grade fuzzy/entity resolution.
* Limited duplicate similarity logic.
* No advanced analytics.
* Gemini availability and rate limits remain external dependencies.
* Approval records authorization but does not execute an external action.
* The UI is intentionally lightweight rather than a full operations dashboard.

These limitations are deliberate and consistent with the assessment scope.

## What I Would Improve With Another Day

If additional implementation time were available, I would prioritize:

1. Add automated integration tests for the main API and deterministic decision paths.
2. Improve duplicate/entity resolution while keeping definitive matching deterministic.
3. Add a clearer retry/manual-retry mechanism for transient Gemini failures.
4. Add search and filtering for larger enquiry volumes.
5. Add stronger validation and observability around persistence failures.
6. Introduce a production database and proper authentication only when the system moves beyond the assessment environment.

The core AI/deterministic/human control boundary would remain unchanged.

## Validation

The implementation was validated with:

```bash
npx tsc --noEmit
npm run lint
npm run build
```

All three checks pass.

Representative API flows were also tested through Postman, including:

* successful enquiry processing;
* idempotent processing;
* invalid request handling;
* CRM and duplicate results;
* approval;
* rejection;
* invalid approval-state transitions;
* Gemini external dependency failure handling.

## Scope and Non-Goals

The MVP intentionally does not include:

* real CRM actions;
* real email sending;
* autonomous external actions;
* authentication infrastructure;
* production database;
* Redis;
* queues;
* background workers;
* vector database/RAG;
* web research agents;
* multi-agent orchestration;
* multi-model escalation;
* advanced analytics;
* complex deployment infrastructure.

The goal is a small, understandable, controlled AI workflow rather than an autonomous agent system.

## License

This project was created for the BEDA AI Systems Technical Assessment — Test 2.