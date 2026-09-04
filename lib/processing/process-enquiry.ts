import {
    loadCRMRecords,
    loadEnquiries,
    loadNormalizedEnquiry,
  } from "../data/loader";
import type {
  AuditEvent,
  ProcessedEnquiry,
} from "../data/types";
import { analyzeWithGemini, GeminiError } from "../ai/gemini";
import { matchCRM } from "../crm/matcher";
import { validateAIAnalysis } from "../rules/validator";
import { detectDuplicate } from "../rules/duplicate-detector";
import { buildRecommendation } from "../rules/decision-engine";
import {
  getProcessedEnquiry,
  saveProcessedEnquiry,
} from "../data/results-store";
import { createApproval } from "@/lib/approval/service";
import { createAuditEvent } from "@/lib/audit/logger";

export async function processEnquiry(
  enquiryId: string,
): Promise<ProcessedEnquiry> {
  const audit: AuditEvent[] = [];
  let input;

  const existingResult = await getProcessedEnquiry(enquiryId);

  if (existingResult) {
    return existingResult;
  }

  try {
    input = await loadNormalizedEnquiry(enquiryId);

    audit.push(
      createAuditEvent(
        "enquiry_loaded",
        `Loaded enquiry ${enquiryId} including attachment content when provided.`,
      ),
    );

    const rawAnalysis = await analyzeWithGemini(input);
    const classification = validateAIAnalysis(rawAnalysis);

    audit.push(
      createAuditEvent(
        "ai_analysis_completed",
        `Gemini classified the enquiry as ${classification.category} with confidence ${classification.confidence}.`,
      ),
    );

    const crmRecords = await loadCRMRecords();
    const crmMatch = matchCRM(input, classification, crmRecords);

    audit.push(
      createAuditEvent(
        "crm_matching_completed",
        crmMatch.status === "matched"
          ? `Matched enquiry to CRM record ${crmMatch.crmId} using ${crmMatch.matchMethod}.`
          : `CRM matching completed with status ${crmMatch.status}.`,
      ),
    );

    const enquiries = await loadEnquiries();
    const duplicate = detectDuplicate(input.enquiry, enquiries);

    audit.push(
      createAuditEvent(
        "duplicate_detection_completed",
        `Duplicate detection completed with status ${duplicate.status}.`,
      ),
    );

    const recommendation = buildRecommendation(classification);

    audit.push(
      createAuditEvent(
        "decision_completed",
        `Deterministic decision selected action ${recommendation.action}.`,
      ),
    );

    const response = {
      needed: classification.responseNeeded,
      draft: classification.responseDraft,
      requiresApproval:
        classification.responseNeeded &&
        recommendation.requiresApproval,
    };

    audit.push(
      createAuditEvent(
        "response_prepared",
        response.needed
          ? "A response draft was prepared and remains subject to approval."
          : "No response draft is required.",
      ),
    );

    const approval = createApproval(recommendation.requiresApproval);

    audit.push(
      createAuditEvent(
        "processing_completed",
        "Enquiry processing completed successfully.",
      ),
    );

    const result: ProcessedEnquiry = {
      source: input.enquiry,
      classification,
      crmMatch,
      duplicate,
      recommendation,
      response,
      approval,
      audit,
      status: "processed",
    };

    await saveProcessedEnquiry(result);

    return result;
  } catch (error) {
    if (error instanceof GeminiError) {
      audit.push(
        createAuditEvent(
          "external_dependency_error",
          `${error.code}: ${error.message}`,
        ),
      );
    
      const result: ProcessedEnquiry = {
        source: input?.enquiry ?? {
          id: enquiryId,
          from: "",
          subject: "",
          body: "",
        },
        classification: null,
        crmMatch: {
          status: "no_match",
          crmId: null,
          matchMethod: null,
          candidates: [],
        },
        duplicate: {
          status: "none",
          relatedEnquiryIds: [],
          reason: "Processing did not reach duplicate detection.",
        },
        recommendation: {
          action: "no_action",
          owner: null,
          reason:
            "Processing failed before a deterministic decision could be made.",
          requiresApproval: false,
        },
        response: {
          needed: false,
          draft: null,
          requiresApproval: false,
        },
        approval: {
          status: "not_required",
          approvedBy: null,
          approvedAt: null,
        },
        audit,
        status: "failed",
        error: `${error.code}: ${error.message}`,
      };
    
      await saveProcessedEnquiry(result);
    
      return result;
    }

    throw error;
  }
}