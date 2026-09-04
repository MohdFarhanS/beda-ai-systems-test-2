import { NextResponse } from "next/server";
import {
  approve,
} from "@/lib/approval/service";
import {
  getProcessedEnquiry,
  saveProcessedEnquiry,
} from "@/lib/data/results-store";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(
  request: Request,
  context: RouteContext,
) {
  try {
    const { id } = await context.params;

    const enquiry = await getProcessedEnquiry(id);

    if (!enquiry) {
      return NextResponse.json(
        {
          error: "Processed enquiry not found.",
        },
        { status: 404 },
      );
    }

    const body = await request.json();

    if (
      !body ||
      typeof body.approvedBy !== "string" ||
      body.approvedBy.trim() === ""
    ) {
      return NextResponse.json(
        {
          error: "approvedBy is required and must be a non-empty string.",
        },
        { status: 400 },
      );
    }

    const updatedApproval = approve(
      enquiry.approval,
      body.approvedBy,
    );

    const updatedEnquiry = {
      ...enquiry,
      approval: updatedApproval,
      audit: [
        ...enquiry.audit,
        {
          timestamp: new Date().toISOString(),
          event: "approval_approved",
          summary: `Proposed action approved by ${updatedApproval.approvedBy}.`,
        },
      ],
    };

    const savedEnquiry = await saveProcessedEnquiry(updatedEnquiry);

    return NextResponse.json(savedEnquiry, {
      status: 200,
    });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.startsWith("Approval cannot be approved")
    ) {
      return NextResponse.json(
        {
          error: error.message,
        },
        { status: 409 },
      );
    }

    console.error(
      "POST /api/enquiries/[id]/approve failed:",
      error,
    );

    return NextResponse.json(
      {
        error: "Failed to approve enquiry.",
      },
      { status: 500 },
    );
  }
}