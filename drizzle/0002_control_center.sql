CREATE TABLE ambulance_request (
  id TEXT PRIMARY KEY,
  citizen_key TEXT NOT NULL UNIQUE,
  latitude REAL NOT NULL,
  longitude REAL NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('requested', 'assigned', 'en_route', 'arrived')),
  requested_at INTEGER NOT NULL,
  assigned_at INTEGER,
  departed_at INTEGER,
  arrived_at INTEGER
);
--> statement-breakpoint
CREATE UNIQUE INDEX ambulance_request_active_unit ON ambulance_request ((1)) WHERE status IN ('assigned', 'en_route');
--> statement-breakpoint
CREATE INDEX ambulance_request_queue ON ambulance_request (status, requested_at);
