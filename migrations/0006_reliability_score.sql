-- Stores the reliability/powertrain sub-score (NHTSA recall count proxy) at
-- discovery time, independent of history verification, so the manual review
-- queue can show a "clean/notable recall history" signal before a vehicle
-- ever reaches the gated opportunity score.

ALTER TABLE vehicles ADD COLUMN reliability_score REAL;
