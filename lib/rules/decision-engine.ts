import type {
    AIAnalysis,
    Recommendation,
  } from "../data/types";
  
  export function buildRecommendation(
    analysis: AIAnalysis,
  ): Recommendation {
    if (analysis.category === "spam") {
      return {
        action: "no_action",
        owner: null,
        reason: "Spam enquiries require no response or operational action.",
        requiresApproval: false,
      };
    }
  
    if (analysis.category === "internal_system") {
      return {
        action: "review_system_issue",
        owner: "Ali Pratama",
        reason:
          "Internal system enquiries are routed to the Senior Business Analyst for human review.",
        requiresApproval: true,
      };
    }
  
    if (analysis.category === "finance") {
      return {
        action: "review_finance_issue",
        owner: "Ali Pratama",
        reason:
          "Finance enquiries require human review by the Senior Business Analyst.",
        requiresApproval: true,
      };
    }
  
    if (analysis.category === "operations") {
      return {
        action: "review_operational_issue",
        owner: "Ties Rahardjo",
        reason:
          "Operational enquiries are routed to the Executive Operations Coordinator for human review.",
        requiresApproval: true,
      };
    }
  
    if (analysis.category === "marketing") {
      return {
        action: "review_marketing_enquiry",
        owner: "Zidane Mouldino",
        reason:
          "Marketing enquiries are routed to the Marketing and Growth Coordinator for human review.",
        requiresApproval: true,
      };
    }
  
    if (analysis.category === "sales") {
      if (isMajorCommercialOpportunity(analysis)) {
        return {
          action: "review_major_commercial_opportunity",
          owner: "Matt Cooper",
          reason:
            "The enquiry contains signals of a potentially major commercial opportunity and requires human review.",
          requiresApproval: true,
        };
      }
  
      if (analysis.missingFields.length > 0) {
        return {
          action: "request_information",
          owner: "Matt Cooper",
          reason:
            "Required sales information is missing, so the next step is to request the minimum additional information.",
          requiresApproval: true,
        };
      }
  
      return {
        action: "review_sales_enquiry",
        owner: "Matt Cooper",
        reason:
          "Sales enquiries are routed for human review before any consequential action.",
        requiresApproval: true,
      };
    }
  
    return {
      action: "review_enquiry",
      owner: null,
      reason:
        "The enquiry does not match a more specific deterministic routing rule and requires human review.",
      requiresApproval: true,
    };
  }
  
  function isMajorCommercialOpportunity(
    analysis: AIAnalysis,
  ): boolean {
    const text = [
      analysis.businessNeed.value,
      analysis.service.value,
      analysis.scale.value,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
  
    const majorOpportunitySignals = [
      "multiple sites",
      "three sites",
      "large-scale",
      "enterprise",
      "gwh",
      "mwh",
      "500 kw",
      "1 mw",
      "megawatt",
    ];
  
    return majorOpportunitySignals.some((signal) =>
      text.includes(signal),
    );
  }