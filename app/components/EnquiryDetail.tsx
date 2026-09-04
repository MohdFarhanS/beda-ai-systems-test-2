"use client";

import { useState } from "react";
import type { ExtractedField, ProcessedEnquiry } from "@/lib/data/types";

type EnquiryDetailProps = {
  enquiry: ProcessedEnquiry | null;
};

function formatTimestamp(timestamp: string) {
  return new Date(timestamp).toLocaleString();
}

function formatEvidenceSource(source: ExtractedField["source"]) {
  switch (source) {
    case "email":
      return "Email";
    case "attachment":
      return "Attachment";
    case "crm":
      return "CRM";
    case "not_provided":
      return "Not provided";
  }
}

function formatFieldLabel(field: string) {
  return field
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (character) => character.toUpperCase());
}

function formatStatus(status: string) {
  return status.replace(/_/g, " ");
}

export default function EnquiryDetail({
  enquiry,
}: EnquiryDetailProps) {
  const [approvalLoading, setApprovalLoading] = useState(false);
  const [approvalError, setApprovalError] = useState<string | null>(null);

  if (!enquiry) {
    return (
      <main>
        <h1>Select an enquiry</h1>
        <p>Choose a processed enquiry to inspect its details.</p>
      </main>
    );
  }

  const { source, classification, crmMatch, duplicate, recommendation, response, approval } =
    enquiry;

    async function handleApprove() {
      if (approvalLoading || approval.status !== "pending") {
        return;
      }
  
      setApprovalLoading(true);
      setApprovalError(null);
  
      try {
        const response = await fetch(
          `/api/enquiries/${source.id}/approve`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              approvedBy: "Reviewer",
            }),
          },
        );
  
        const data = await response.json();
  
        if (!response.ok) {
          throw new Error(data.error ?? "Failed to approve enquiry.");
        }
  
        window.location.reload();
      } catch (error) {
        setApprovalError(
          error instanceof Error
            ? error.message
            : "Failed to approve enquiry.",
        );
      } finally {
        setApprovalLoading(false);
      }
    }
  
    async function handleReject() {
      if (approvalLoading || approval.status !== "pending") {
        return;
      }
  
      setApprovalLoading(true);
      setApprovalError(null);
  
      try {
        const response = await fetch(
          `/api/enquiries/${source.id}/reject`,
          {
            method: "POST",
          },
        );
  
        const data = await response.json();
  
        if (!response.ok) {
          throw new Error(data.error ?? "Failed to reject enquiry.");
        }
  
        window.location.reload();
      } catch (error) {
        setApprovalError(
          error instanceof Error
            ? error.message
            : "Failed to reject enquiry.",
        );
      } finally {
        setApprovalLoading(false);
      }
    }

  const extractedFields = classification
    ? [
        ["contactName", classification.contactName],
        ["company", classification.company],
        ["email", classification.email],
        ["phone", classification.phone],
        ["location", classification.location],
        ["businessNeed", classification.businessNeed],
        ["service", classification.service],
        ["timeline", classification.timeline],
        ["scale", classification.scale],
      ] as const
    : [];

  return (
    <main>
      <header>
        <p>{source.id}</p>
        <h1>{source.subject}</h1>
        <p>{source.from}</p>
      </header>

      <section>
        <h2>Incoming Enquiry</h2>

        <p>{source.body}</p>

        {source.attachment ? (
          <p>Attachment: {source.attachment}</p>
        ) : (
          <p>No attachment provided.</p>
        )}
      </section>

      {enquiry.status === "failed" ? (
        <section>
          <h2>Processing Failed</h2>

          <p>
            This enquiry could not be interpreted because an external
            dependency was unavailable.
          </p>

          <p>{enquiry.error ?? "Processing failed."}</p>
        </section>
      ) : classification ? (
        <>
          <section>
            <h2>AI Interpretation</h2>

            <div>
              <p>
                <strong>Category</strong>
              </p>
              <p>{classification.category}</p>
            </div>

            <div>
              <p>
                <strong>Confidence</strong>
              </p>
              <p>{Math.round(classification.confidence * 100)}%</p>
            </div>

            <div>
              <p>
                <strong>Explanation</strong>
              </p>
              <p>{classification.reasoning}</p>
            </div>

            <div>
              <h3>Extracted Information</h3>

              <dl>
                {extractedFields.map(([field, extracted]) => (
                  <div key={field}>
                    <dt>{formatFieldLabel(field)}</dt>
                    <dd>
                      <span>{extracted.value ?? "Not provided"}</span>
                      <small>
                        {formatEvidenceSource(extracted.source)}
                      </small>
                    </dd>
                  </div>
                ))}
              </dl>
            </div>

            <div>
              <h3>Missing Information</h3>

              {classification.missingFields.length === 0 ? (
                <p>No missing information identified.</p>
              ) : (
                <ul>
                  {classification.missingFields.map((field) => (
                    <li key={field}>{formatFieldLabel(field)}</li>
                  ))}
                </ul>
              )}
            </div>

            <div>
              <h3>Uncertainty</h3>

              {classification.uncertainties.length === 0 ? (
                <p>No uncertainty identified.</p>
              ) : (
                <ul>
                  {classification.uncertainties.map((uncertainty) => (
                    <li key={uncertainty}>{uncertainty}</li>
                  ))}
                </ul>
              )}
            </div>
          </section>

          <section className="decisionSection">
            <h2>Application Decision</h2>

            <div className="decisionSubsection">
              <h3>CRM Match</h3>
              <p>{formatStatus(crmMatch.status)}</p>

              {crmMatch.crmId && (
                <p>CRM record: {crmMatch.crmId}</p>
              )}

              {crmMatch.matchMethod && (
                <p>Method: {formatStatus(crmMatch.matchMethod)}</p>
              )}
            </div>

            <div className="decisionSubsection">
              <h3>Duplicate Check</h3>
              <p>{formatStatus(duplicate.status)}</p>
              <p>{duplicate.reason}</p>

              {duplicate.relatedEnquiryIds.length > 0 && (
                <p>
                  Related enquiries:{" "}
                  {duplicate.relatedEnquiryIds.join(", ")}
                </p>
              )}
            </div>

            <div className="recommendationBlock">
              <h3>Recommendation</h3>
              <p>{formatStatus(recommendation.action)}</p>

              <p>
                <strong>Owner:</strong>{" "}
                {recommendation.owner ?? "Not assigned"}
              </p>

              <p>{recommendation.reason}</p>

              <p>
                <strong>Approval required:</strong>{" "}
                {recommendation.requiresApproval ? "Yes" : "No"}
              </p>
            </div>
          </section>

          <section>
            <h2>Response</h2>

            {response.needed && response.draft ? (
              <>
                <p>
                  <strong>Draft response</strong>
                </p>
                <p>{response.draft}</p>
                <p>
                  This is a draft and is subject to approval.
                </p>
              </>
            ) : (
              <p>No response draft is required.</p>
            )}
          </section>

          <section className="humanDecisionSection">
            <h2>Human Decision</h2>

            <div className="approvalStatus">
              <p>
                <strong>Status</strong>
              </p>
              <p>{formatStatus(approval.status)}</p>
            </div>

            {approval.status === "pending" && (
              <div className="approvalActions">
                <p>
                  Review the proposed action above before making a decision.
                </p>

                <div>
                  <button
                    type="button"
                    onClick={handleApprove}
                    disabled={approvalLoading}
                  >
                    {approvalLoading ? "Processing..." : "Approve"}
                  </button>

                  <button
                    type="button"
                    onClick={handleReject}
                    disabled={approvalLoading}
                  >
                    {approvalLoading ? "Processing..." : "Reject"}
                  </button>
                </div>
              </div>
            )}

            {approvalError && (
              <p role="alert" className="approvalError">
                {approvalError}
              </p>
            )}

            {approval.approvedBy && (
              <p>
                <strong>Approved by:</strong> {approval.approvedBy}
              </p>
            )}

            {approval.approvedAt && (
              <p>
                <strong>Decision time:</strong>{" "}
                {formatTimestamp(approval.approvedAt)}
              </p>
            )}
          </section>
        </>
      ) : null}

      <section>
        <h2>Audit Trail</h2>

        {enquiry.audit.length === 0 ? (
          <p>No audit events recorded.</p>
        ) : (
          <ol>
            {enquiry.audit.map((event, index) => (
              <li key={`${event.timestamp}-${index}`}>
                <strong>{event.event}</strong>
                <span>{formatTimestamp(event.timestamp)}</span>
                <p>{event.summary}</p>
              </li>
            ))}
          </ol>
        )}
      </section>
    </main>
  );
}