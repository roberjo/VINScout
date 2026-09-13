// Spec §10 — History Evidence. Every history decision must be
// reproducible from stored evidence; claims without provenance don't count.
export interface HistoryEvidence {
  id: string;
  vin: string;

  provider: string;
  providerRecordId?: string;

  eventType: string;
  eventDate?: string;

  description?: string;
  sourceUrl?: string;

  retrievedAt: string;
}
