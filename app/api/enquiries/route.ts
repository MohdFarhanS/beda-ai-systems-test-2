import { NextResponse } from "next/server";
import { getProcessedEnquiries } from "@/lib/data/results-store";

export async function GET() {
  try {
    const enquiries = await getProcessedEnquiries();

    return NextResponse.json(enquiries, {
      status: 200,
    });
  } catch (error) {
    console.error("GET /api/enquiries failed:", error);

    return NextResponse.json(
      {
        error: "Failed to load processed enquiries.",
      },
      { status: 500 },
    );
  }
}