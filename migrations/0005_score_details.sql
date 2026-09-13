-- Supports showing *why* a vehicle scored the way it did, and what it looks
-- like, instead of just a bare number (spec §18's score is meant to be
-- explainable, not a black box).

ALTER TABLE listings ADD COLUMN primary_image_url TEXT;
ALTER TABLE vehicles ADD COLUMN market_comparison_json TEXT;
ALTER TABLE vehicles ADD COLUMN score_breakdown_json TEXT;
