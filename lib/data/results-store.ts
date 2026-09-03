import { readFile, writeFile } from "fs/promises";
import path from "path";

import type { ProcessedEnquiry } from "./types";

const RESULTS_FILE = path.join(
  process.cwd(),
  "data",
  "processed-results.json",
);

async function readResults(): Promise<ProcessedEnquiry[]> {
  const content = await readFile(RESULTS_FILE, "utf-8");

  const parsed: unknown = JSON.parse(content);

  if (!Array.isArray(parsed)) {
    throw new Error("processed-results.json must contain an array.");
  }

  return parsed as ProcessedEnquiry[];
}

async function writeResults(
  results: ProcessedEnquiry[],
): Promise<void> {
  await writeFile(
    RESULTS_FILE,
    JSON.stringify(results, null, 2),
    "utf-8",
  );
}

export async function getProcessedEnquiries(): Promise<
  ProcessedEnquiry[]
> {
  return readResults();
}

export async function getProcessedEnquiry(
  enquiryId: string,
): Promise<ProcessedEnquiry | null> {
  const results = await readResults();

  return (
    results.find((result) => result.source.id === enquiryId) ??
    null
  );
}

export async function saveProcessedEnquiry(
  result: ProcessedEnquiry,
): Promise<ProcessedEnquiry> {
  const results = await readResults();

  const existingIndex = results.findIndex(
    (item) => item.source.id === result.source.id,
  );

  if (existingIndex >= 0) {
    results[existingIndex] = result;
  } else {
    results.push(result);
  }

  await writeResults(results);

  return result;
}