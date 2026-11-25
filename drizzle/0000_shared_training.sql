CREATE TABLE training_drill (
  id TEXT PRIMARY KEY,
  citizen_key TEXT NOT NULL UNIQUE,
  driver_key TEXT UNIQUE,
  code TEXT NOT NULL UNIQUE,
  invite_until INTEGER NOT NULL,
  expires_at INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'setup',
  offer_until INTEGER,
  events TEXT NOT NULL DEFAULT '[]',
  version INTEGER NOT NULL DEFAULT 0
);
