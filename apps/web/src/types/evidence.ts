export interface HistoryEvidenceEntry {
  id: number;
  provider: string;
  provider_record_id: string | null;
  event_type: string;
  event_date: string | null;
  description: string | null;
  source_url: string | null;
  retrieved_at: string;
}
