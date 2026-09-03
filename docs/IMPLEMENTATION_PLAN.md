# BEDA Test 2 — Implementation Plan

## 1. Build Timebox

Maximum active build time: **3 hours**.

The timer starts only after the planning documents and final pre-build review are complete.

## 2. Priority Model

### P0 — Must have

- Project setup.
- Data ingestion.
- Gemini analysis.
- Structured output validation.
- CRM matching.
- Duplicate detection.
- Deterministic recommendation.
- Staff routing.
- Approval.
- Audit log.
- Basic UI.
- Build verification.

### P1 — Only if P0 is stable

- Better duplicate similarity.
- Confidence visualization.
- Loading/error states.
- UI polish.
- Search/filter.

### P2 — Do not sacrifice P0 for these

- Analytics.
- Statistics dashboard.
- Advanced fuzzy matching.
- Database.
- Authentication.
- Queues/background jobs.
- Real integrations.

## 3. Time Allocation

| Time | Phase | Target |
|---|---|---|
| 00:00–00:15 | Setup | Next.js, TypeScript, dependencies, env, data, dev server |
| 00:15–00:35 | Data layer | Types, loaders, attachment loading, local persistence |
| 00:35–01:15 | AI | Gemini client, prompt, structured analysis, validation |
| 01:15–01:45 | Decision layer | CRM matcher, duplicate checks, deterministic rules |
| 01:45–02:05 | Approval | Approve/reject flow and proposed actions |
| 02:05–02:20 | Audit | Audit event generation and persistence |
| 02:20–02:45 | UI | Enquiry list/detail, recommendation, approval, audit |
| 02:45–03:00 | Verification | Test cases, build, README, final review |

## 4. Milestones

### M1 — Project ready

- Next.js project starts.
- Gemini dependency installed.
- Dataset copied.
- Environment variable documented.

### M2 — Data layer ready

- Emails load.
- Attachments load.
- CRM loads.
- Staff directory loads.
- Shared types exist.
- Processed result persistence exists.

### M3 — AI ready

One Gemini call per enquiry should ideally produce the required interpretation in one structured response:

- classification;
- extracted information;
- missing information;
- uncertainty;
- draft response when appropriate.

Output is validated before use.

### M4 — Controlled decisions ready

- CRM matching is deterministic.
- Duplicate detection is separate from CRM matching.
- Staff routing is deterministic.
- Recommendation is deterministic.
- Ambiguity results in human review rather than forced certainty.

### M5 — Approval and audit ready

- Proposed consequential action can be pending.
- Reviewer can approve/reject.
- Important steps are logged.
- Failures are visible.

### M6 — UI ready

Reviewer can inspect an enquiry from ingestion through recommendation and approval.

### M7 — Verification ready

- Process representative enquiries from different categories.
- Test duplicate case such as E001/E002.
- Test correction case E009/E010.
- Test missing information such as E005.
- Test spam E004.
- Test internal system issue E011.
- Run production build.

## 5. Implementation Rules

### Rule A — Keep AI calls consolidated

Prefer one structured Gemini analysis call per enquiry rather than multiple independent model calls.

### Rule B — Keep decisions deterministic

Do not ask Gemini to select the final CRM record, owner, permission, or approval state.

### Rule C — Preserve unknowns

If the source does not contain a fact, use `null`, unknown, or an explicit missing-information field.

### Rule D — Attachments are first-class input

When an email references a supplied attachment, include its contents in the normalized input sent to the analysis step.

### Rule E — No fake integrations

Approval must not pretend to have sent an email or updated a CRM.

### Rule F — Fail safely

A failed AI call produces no fabricated result and no consequential action.

## 6. Suggested Implementation Order

1. Scaffold project.
2. Install dependencies.
3. Add dataset.
4. Define TypeScript contracts.
5. Implement loaders.
6. Implement Gemini client and prompt.
7. Implement output validation.
8. Implement CRM matching.
9. Implement duplicate detection.
10. Implement decision engine.
11. Implement approval service.
12. Implement audit logger.
13. Implement API routes.
14. Implement UI.
15. Run representative tests.
16. Build.
17. Update README and record known weaknesses.

## 7. Stop Conditions

If time is running short:

- Remove P2 work immediately.
- Remove P1 polish if necessary.
- Keep the core workflow working end-to-end.
- Prefer a plain but functional UI over unfinished visual polish.
- Prefer deterministic rules over sophisticated fuzzy logic.
- Prefer a clear limitation over an unreliable feature.

## 8. Final Verification Checklist

- [ ] All 12 enquiries load.
- [ ] Attachments load.
- [ ] Gemini returns valid structured output.
- [ ] Invalid AI output is rejected/handled.
- [ ] Missing information is preserved.
- [ ] CRM matching uses strong identifiers first.
- [ ] Possible duplicate is distinguishable from CRM match.
- [ ] Recommendation has a reason.
- [ ] Staff routing is deterministic.
- [ ] Consequential action is pending until approval.
- [ ] Approve/reject works.
- [ ] Audit trail is understandable.
- [ ] Failed processing is safe.
- [ ] Reprocessing the same enquiry is idempotent.
- [ ] No external action is executed.
- [ ] UI is usable.
- [ ] `npm run build` succeeds.
- [ ] README is complete.
