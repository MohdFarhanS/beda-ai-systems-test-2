import { NextResponse } from "next/server";
import { reject } from "@/lib/approval/service";
import {
  getProcessedEnquiry,
  saveProcessedEnquiry,
} from "@/lib/data/results-store";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(
  _request: Request,
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

    const updatedApproval = reject(enquiry.approval);

    const updatedEnquiry = {
      ...enquiry,
      approval: updatedApproval,
      audit: [
        ...enquiry.audit,
        {
          timestamp: new Date().toISOString(),
          event: "approval_rejected",
          summary: "Proposed action was rejected.",
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
      error.message.startsWith("Approval cannot be rejected")
    ) {
      return NextResponse.json(
        {
          error: error.message,
        },
        { status: 409 },
      );
    }

    console.error(
      "POST /api/enquiries/[id]/reject failed:",
      error,
    );

    return NextResponse.json(
      {
        error: "Failed to reject enquiry.",
      },
      { status: 500 },
    );
  }
}