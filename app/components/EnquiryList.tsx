"use client";

import type { ProcessedEnquiry } from "@/lib/data/types";

type EnquiryListProps = {
  enquiries: ProcessedEnquiry[];
  selectedId: string | null;
  onSelect: (id: string) => void;
};

export default function EnquiryList({
  enquiries,
  selectedId,
  onSelect,
}: EnquiryListProps) {
  return (
    <aside>
      <div>
        <h2>Enquiries</h2>
        <span>{enquiries.length}</span>
      </div>

      {enquiries.length === 0 ? (
        <p>No processed enquiries.</p>
      ) : (
        <ul>
          {enquiries.map((enquiry) => (
            <li key={enquiry.source.id}>
              <button
                type="button"
                onClick={() => onSelect(enquiry.source.id)}
                aria-pressed={selectedId === enquiry.source.id}
              >
                <strong>{enquiry.source.id}</strong>
                <span>{enquiry.source.subject}</span>
                <small>
                  {enquiry.classification?.category ?? "Processing failed"}
                </small>
              </button>
            </li>
          ))}
        </ul>
      )}
    </aside>
  );
}