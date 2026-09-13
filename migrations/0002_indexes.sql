-- Query patterns: listings by VIN (dedup/join), active listings by source,
-- vehicles ranked by opportunity score, price history lookup by VIN.

CREATE INDEX idx_listings_vin ON listings(vin);
CREATE INDEX idx_listings_source_active ON listings(source, active);
CREATE INDEX idx_price_history_vin ON price_history(vin);
CREATE INDEX idx_vehicles_status_opportunity_score ON vehicles(status, opportunity_score);
CREATE INDEX idx_vehicles_make_model_year ON vehicles(make, model, year);
