ALTER TABLE training_drill ADD COLUMN dispatcher_key TEXT;
--> statement-breakpoint
ALTER TABLE training_drill ADD COLUMN dispatcher_code TEXT;
--> statement-breakpoint
ALTER TABLE training_drill ADD COLUMN driver_ready_until INTEGER;
--> statement-breakpoint
CREATE UNIQUE INDEX training_drill_dispatcher_key ON training_drill(dispatcher_key);
--> statement-breakpoint
CREATE UNIQUE INDEX training_drill_dispatcher_code ON training_drill(dispatcher_code);
