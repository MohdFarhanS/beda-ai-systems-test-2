import { NextResponse } from "next/server";
import { getProcessedEnquiry } from "@/lib/data/results-store";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(
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

    return NextResponse.json(enquiry, {
      status: 200,
    });
  } catch (error) {
    console.error("GET /api/enquiries/[id] failed:", error);

    return NextResponse.json(
      {
        error: "Failed to load processed enquiry.",
      },
      { status: 500 },
    );
  }
}