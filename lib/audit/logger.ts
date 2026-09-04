import type { AuditEvent } from "@/lib/data/types";

export function createAuditEvent(
  event: AuditEvent["event"],
  summary: string,
): AuditEvent {
  return {
    timestamp: new Date().toISOString(),
    event,
    summary,
  };
}