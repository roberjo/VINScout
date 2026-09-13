-- Supports the dealer/listing-quality opportunity factor (spec §18):
-- photo count is a proxy for listing transparency/effort.

ALTER TABLE listings ADD COLUMN photo_count INTEGER;
