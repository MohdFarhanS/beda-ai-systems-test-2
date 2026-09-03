import { processEnquiry } from "../lib/processing/process-enquiry";

async function main() {
  const enquiryId = process.argv[2] ?? "E001";
  const result = await processEnquiry(enquiryId);

  console.dir(
    {
      id: result.source.id,
      category: result.classification?.category,
      crmMatch: result.crmMatch,
      duplicate: result.duplicate,
      recommendation: result.recommendation,
      response: result.response,
      approval: result.approval,
      status: result.status,
      audit: result.audit,
      error: result.error,
    },
    { depth: null },
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});