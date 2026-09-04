import type { Approval, ApprovalStatus } from "@/lib/data/types";

export function createApproval(
  requiresApproval: boolean,
): Approval {
  return {
    status: requiresApproval ? "pending" : "not_required",
    approvedBy: null,
    approvedAt: null,
  };
}

export function approve(
  approval: Approval,
  approvedBy: string,
): Approval {
  if (approval.status !== "pending") {
    throw new Error(
      `Approval cannot be approved from status "${approval.status}".`,
    );
  }

  if (!approvedBy.trim()) {
    throw new Error("approvedBy is required.");
  }

  return {
    status: "approved",
    approvedBy: approvedBy.trim(),
    approvedAt: new Date().toISOString(),
  };
}

export function reject(
  approval: Approval,
): Approval {
  if (approval.status !== "pending") {
    throw new Error(
      `Approval cannot be rejected from status "${approval.status}".`,
    );
  }

  return {
    status: "rejected",
    approvedBy: null,
    approvedAt: null,
  };
}

export function isApprovalRequired(
  status: ApprovalStatus,
): boolean {
  return status !== "not_required";
}