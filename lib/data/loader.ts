import { readFile } from "fs/promises";
import path from "path";
import Papa from "papaparse";

import type {
  Attachment,
  CRMRecord,
  Enquiry,
  NormalizedEnquiry,
  StaffMember,
} from "./types";

const DATA_DIR = path.join(process.cwd(), "data");

async function readJson<T>(filename: string): Promise<T> {
  const filePath = path.join(DATA_DIR, filename);
  const content = await readFile(filePath, "utf-8");

  return JSON.parse(content) as T;
}

async function loadAttachment(
  filename: string | null | undefined,
): Promise<Attachment | null> {
  if (!filename) {
    return null;
  }

  const filePath = path.join(DATA_DIR, "documents", filename);
  const content = await readFile(filePath, "utf-8");

  return {
    filename,
    content,
  };
}

export async function loadEnquiries(): Promise<Enquiry[]> {
  return readJson<Enquiry[]>("emails.json");
}

export async function loadCRMRecords(): Promise<CRMRecord[]> {
    const filePath = path.join(DATA_DIR, "crm.csv");
    const content = await readFile(filePath, "utf-8");
  
    const result = Papa.parse<CRMRecord>(content, {
      header: true,
      skipEmptyLines: true,
    });
  
    if (result.errors.length > 0) {
      console.warn("CRM CSV contains malformed rows:", result.errors);
    }
  
    return result.data.filter((record) => {
      return Boolean(
        record.id &&
        record.company &&
        record.contact &&
        record.email &&
        record.location &&
        record.status &&
        record.service &&
        record.state,
      );
    });
  }

export async function loadStaffDirectory(): Promise<StaffMember[]> {
  return readJson<StaffMember[]>("staff_directory.json");
}

export async function loadNormalizedEnquiry(
  enquiryId: string,
): Promise<NormalizedEnquiry> {
  const enquiries = await loadEnquiries();

  const enquiry = enquiries.find((item) => item.id === enquiryId);

  if (!enquiry) {
    throw new Error(`Enquiry not found: ${enquiryId}`);
  }

  const attachment = await loadAttachment(enquiry.attachment);

  return {
    enquiry,
    attachment,
  };
}