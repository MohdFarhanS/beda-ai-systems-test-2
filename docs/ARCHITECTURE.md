# BEDA Test 2 — Architecture

## 1. Architecture Style

Use a **small modular monolith** implemented in one Next.js 15 + TypeScript project.

The design intentionally avoids microservices, queues, databases, agents, vector stores, and other infrastructure that does not materially improve the assessment outcome.

## 2. High-Level Flow

```text
Synthetic Inputs
      |
      v
+--------------------+
| Ingestion          |
| emails/attachments |
| CRM/staff data     |
+---------+----------+
          |
          v
+--------------------+
| Source /           |
| Idempotency Check  |
+---------+----------+
          |
          v
+--------------------+
| Gemini             |
| - classify         |
| - extract          |
| - uncertainty      |
| - draft            |
+---------+----------+
          |
          v
+--------------------+
| Validator          |
| schema + values    |
+---------+----------+
          |
      +---+----------------+
      |                    |
      v                    v
+-------------+      +-------------+
| Duplicate   |      | CRM Matcher |
| Detection   |      | deterministic|
+------+------+      +------+------+
       |                    |
       +---------+----------+
                 |
                 v
        +------------------+
        | Decision Engine  |
        | action + owner   |
        | approval         |
        +--------+---------+
                 |
                 v
        +------------------+
        | Human Approval   |
        | pending/approve  |
        | reject           |
        +--------+---------+
                 |
                 v
        +------------------+
        | Audit Log        |
        +--------+---------+
                 |
                 v
             Next.js UI
```

## 3. Project Structure

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
  page.tsx
  layout.tsx
  globals.css

components/
  EnquiryList.tsx
  EnquiryDetail.tsx
  ClassificationBadge.tsx
  MatchResult.tsx
  RecommendationCard.tsx
  ApprovalPanel.tsx
  AuditLog.tsx

lib/
  ai/
    gemini.ts
    prompts.ts
  data/
    loader.ts
    types.ts
  crm/
    matcher.ts
  rules/
    validator.ts
    decision-engine.ts
  approval/
    service.ts
  audit/
    logger.ts

data/
  emails.json
  crm.csv
  staff_directory.json
  documents/
    01_hume_energy_bill.txt
    02_northbank_site_notes.txt
    03_greenfields_invoice_query.txt
  processed-results.json

docs/
  PROJECT_SPEC.md
  IMPLEMENTATION_PLAN.md
  ARCHITECTURE.md
```

## 4. Component Responsibilities

### Data Loader

Reads supplied JSON, CSV, and TXT data and creates normalized input.

### Gemini Client

Sends only the relevant enquiry and attachment content needed for interpretation.

Gemini is responsible for probabilistic language understanding, not authoritative business decisions.

### Validator

Validates the Gemini response against the application contract and allowed values.

### CRM Matcher

Uses deterministic evidence:

1. exact CRM ID;
2. exact email;
3. exact phone;
4. strong corroborated contact/company evidence;
5. similarity only as a possible match.

### Duplicate Detector

Determines whether the enquiry itself is repeated or likely duplicated. It is intentionally separate from CRM matching.

### Decision Engine

Converts validated facts and deterministic checks into:

- recommended action;
- owner;
- reason;
- approval requirement.

### Approval Service

Tracks whether a proposed consequential action is:

- not required;
- pending;
- approved;
- rejected.

### Audit Logger

Records what happened and why, including important processing, decision, and approval events.

## 5. AI / Deterministic Boundary

```text
AI / Gemini
----------------------------
Classification
Information extraction
Missing information
Uncertainty
Response drafting

Deterministic application
----------------------------
Schema validation
Allowed values
CRM matching
Duplicate checks
Staff routing
Decision rules
Approval requirement
Approval state
Audit
Idempotency
```

The central control principle is:

> AI interprets and recommends; deterministic application logic controls what is allowed to happen; humans retain authority over consequential actions.

## 6. Data Contract

A processed enquiry should conceptually contain:

```text
source
classification
extraction
crmMatch
duplicate
recommendation
response
approval
audit
```

### Source

- id
- from
- subject
- body
- optional attachment

### Classification

- category
- confidence
- reasoning

### Extraction

Possible fields include:

- contactName
- company
- email
- phone
- location
- businessNeed
- service
- timeline
- scale
- missingFields
- uncertainties
- evidence/source

Unavailable values remain null/unknown.

### CRM Match

- status: matched / possible_match / no_match
- crmId
- matchMethod
- candidates
- confidence where useful

### Recommendation

- action
- owner
- reason
- requiresApproval

### Response

- needed
- draft
- requiresApproval

### Approval

- status
- approvedBy
- approvedAt

### Audit

- timestamp
- event
- summary/reason

## 7. API Boundaries

### `POST /api/process`

Process one enquiry.

```json
{
  "enquiryId": "E001"
}
```

### `GET /api/enquiries`

List processed enquiries.

### `GET /api/enquiries/:id`

Inspect one processed enquiry.

### `POST /api/enquiries/:id/approve`

Approve the proposed action.

### `POST /api/enquiries/:id/reject`

Reject the proposed action.

No endpoint sends email or modifies a real CRM.

## 8. Persistence

Use local JSON persistence for the assessment.

The stable enquiry ID provides a simple idempotency key.

The implementation should avoid re-running the AI call for an already completed enquiry unless explicitly requested.

This is intentionally less sophisticated than a production database but demonstrates the control principle without adding infrastructure.

## 9. Security and Trust Boundary

All incoming email and attachment text is untrusted input.

Untrusted content must not be allowed to:

- change application policy;
- change permissions;
- instruct the system to ignore approval;
- change tool behavior;
- access secrets.

Only the application code decides which tools/actions are available.

Secrets such as the Gemini API key stay server-side and are never included in model prompts.

Only relevant enquiry/attachment content should be sent to Gemini.

## 10. Failure Model

If Gemini fails or returns invalid structured output:

```text
Failure
  |
  v
No fabricated result
  |
  v
Audit failure
  |
  v
Manual review / failed state
  |
  v
No consequential action
```

Retries, if implemented, must be bounded.

## 11. Duplicate vs CRM Match

These are separate questions.

### Duplicate

"Is this enquiry likely the same/repeated enquiry as another source?"

### CRM Match

"Does this contact/company correspond to an existing CRM record?"

For example, E001 and E002 can be a likely duplicate pair while C001 is a CRM match. Neither conclusion alone authorizes a merge.

## 12. Human Approval Flow

```text
Recommendation prepared
        |
        v
PENDING APPROVAL
        |
   +----+----+
   |         |
 Approve   Reject
   |         |
   v         v
APPROVED   REJECTED
```

Approval represents authorization of a proposed action. In this assessment build, no real external action is executed afterward.

## 13. Why This Architecture

This architecture:

- satisfies the Test 2 functional requirements;
- preserves the control-boundary principles demonstrated in Test 1;
- keeps AI probabilistic work separate from deterministic business decisions;
- preserves uncertainty;
- prevents unsupported external actions;
- is small enough for a 3-hour build;
- is understandable to an evaluator;
- can be extended later without requiring the MVP to become a complex agentic system.

## 14. Deliberately Not Implemented

The following are intentionally excluded:

- multi-agent orchestration;
- model escalation;
- web research;
- real CRM APIs;
- real email APIs;
- background queues;
- production database;
- authentication;
- vector search/RAG;
- advanced fuzzy/entity resolution.

These could be considered later if real usage demonstrates the need.
