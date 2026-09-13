-- Spec §14 — Database Schema. Core vehicle/listing/price tables.

CREATE TABLE vehicles (
  vin TEXT PRIMARY KEY,

  year INTEGER NOT NULL,
  make TEXT NOT NULL,
  model TEXT NOT NULL,
  trim TEXT,

  engine TEXT,
  transmission TEXT,
  drivetrain TEXT,

  mileage INTEGER NOT NULL,

  first_seen_at TEXT NOT NULL,
  last_seen_at TEXT NOT NULL,

  history_status TEXT NOT NULL DEFAULT 'UNKNOWN',

  accident_reported INTEGER NOT NULL DEFAULT 0,
  damage_reported INTEGER NOT NULL DEFAULT 0,
  structural_damage INTEGER NOT NULL DEFAULT 0,
  airbag_deployment INTEGER NOT NULL DEFAULT 0,
  total_loss INTEGER NOT NULL DEFAULT 0,
  salvage_title INTEGER NOT NULL DEFAULT 0,
  rebuilt_title INTEGER NOT NULL DEFAULT 0,
  flood_damage INTEGER NOT NULL DEFAULT 0,
  lemon_buyback INTEGER NOT NULL DEFAULT 0,
  odometer_problem INTEGER NOT NULL DEFAULT 0,

  owner_count INTEGER,

  value_score REAL,
  maintenance_score REAL,
  opportunity_score REAL,

  status TEXT NOT NULL DEFAULT 'ACTIVE'
);

CREATE TABLE listings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,

  vin TEXT NOT NULL,

  source TEXT NOT NULL,

  dealer_name TEXT,
  dealer_city TEXT,
  dealer_state TEXT,

  price INTEGER NOT NULL,
  mileage INTEGER,

  listing_url TEXT NOT NULL,

  first_seen_at TEXT NOT NULL,
  last_seen_at TEXT NOT NULL,

  active INTEGER NOT NULL DEFAULT 1,

  FOREIGN KEY (vin) REFERENCES vehicles(vin)
);

CREATE TABLE price_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,

  vin TEXT NOT NULL,

  price INTEGER NOT NULL,

  observed_at TEXT NOT NULL,

  source TEXT,

  FOREIGN KEY (vin) REFERENCES vehicles(vin)
);
