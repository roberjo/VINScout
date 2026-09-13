-- Spec §10, §14 — history evidence (provenance for every history claim),
-- rejection events (audit trail for the history gate), and watchlists.

CREATE TABLE history_evidence (
  id INTEGER PRIMARY KEY AUTOINCREMENT,

  vin TEXT NOT NULL,

  provider TEXT NOT NULL,
  provider_record_id TEXT,

  event_type TEXT NOT NULL,
  event_date TEXT,

  description TEXT,

  source_url TEXT,

  retrieved_at TEXT NOT NULL,

  FOREIGN KEY (vin) REFERENCES vehicles(vin)
);

CREATE TABLE rejection_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,

  vin TEXT NOT NULL,

  rejection_type TEXT NOT NULL,

  reason TEXT NOT NULL,

  source TEXT,

  created_at TEXT NOT NULL,

  FOREIGN KEY (vin) REFERENCES vehicles(vin)
);

CREATE TABLE watchlists (
  id INTEGER PRIMARY KEY AUTOINCREMENT,

  name TEXT NOT NULL,

  criteria_json TEXT NOT NULL,

  created_at TEXT NOT NULL
);

CREATE INDEX idx_history_evidence_vin ON history_evidence(vin);
CREATE INDEX idx_rejection_events_vin ON rejection_events(vin);
