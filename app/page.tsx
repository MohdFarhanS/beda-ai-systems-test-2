"use client";

import { useEffect, useState } from "react";
import type { ProcessedEnquiry } from "@/lib/data/types";
import EnquiryList from "./components/EnquiryList";
import EnquiryDetail from "./components/EnquiryDetail";
import styles from "./page.module.css";

export default function Home() {
  const [enquiries, setEnquiries] = useState<ProcessedEnquiry[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadEnquiries() {
      try {
        const response = await fetch("/api/enquiries");

        if (!response.ok) {
          throw new Error("Failed to load enquiries.");
        }

        const data: ProcessedEnquiry[] = await response.json();

        setEnquiries(data);
        setSelectedId(data[0]?.source.id ?? null);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load enquiries.",
        );
      } finally {
        setLoading(false);
      }
    }

    loadEnquiries();
  }, []);

  const selectedEnquiry =
    enquiries.find((enquiry) => enquiry.source.id === selectedId) ?? null;

  if (loading) {
    return (
      <main className={styles.statePage}>
        <p>Loading enquiries...</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className={styles.statePage}>
        <p>{error}</p>
      </main>
    );
  }

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>BEDA OPERATIONS</p>
          <h1>Enquiry Review</h1>
        </div>

        <div className={styles.headerStatus}>
          <span className={styles.statusDot} />
          <span>Inspection mode</span>
        </div>
      </header>

      <div className={styles.workspace}>
        <EnquiryList
          enquiries={enquiries}
          selectedId={selectedId}
          onSelect={setSelectedId}
        />

        <EnquiryDetail enquiry={selectedEnquiry} />
      </div>
    </main>
  );
}