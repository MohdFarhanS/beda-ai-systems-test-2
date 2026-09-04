import { NextResponse } from "next/server";
import { processEnquiry } from "@/lib/processing/process-enquiry";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (
      !body ||
      typeof body.enquiryId !== "string" ||
      body.enquiryId.trim() === ""
    ) {
      return NextResponse.json(
        {
          error: "enquiryId is required and must be a non-empty string.",
        },
        { status: 400 },
      );
    }

    const result = await processEnquiry(body.enquiryId.trim());

    return NextResponse.json(result, {
      status: result.status === "failed" ? 502 : 200,
    });
  } catch (error) {
    console.error("POST /api/process failed:", error);

    return NextResponse.json(
      {
        error: "Failed to process enquiry.",
      },
      { status: 500 },
    );
  }
}