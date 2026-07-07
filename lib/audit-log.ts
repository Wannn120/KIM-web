export interface AuditEntry {
  id: string;
  timestamp: string;
  event: string;
  details: string;
  actor?: string;
  ip?: string;
}

const auditEntries: AuditEntry[] = [];

export function auditLog(event: string, details: string, actor?: string, ip?: string) {
  const entry: AuditEntry = {
    id: `audit-${Date.now()}-${auditEntries.length}`,
    timestamp: new Date().toISOString(),
    event,
    details,
    actor,
    ip,
  };

  auditEntries.push(entry);
  return entry;
}

export function getAuditLogs() {
  return [...auditEntries].reverse();
}
