CREATE TABLE `portfolio_events` (
	`day` text NOT NULL,
	`name` text NOT NULL,
	`count` integer DEFAULT 0 NOT NULL,
	PRIMARY KEY(`day`, `name`)
);
--> statement-breakpoint
CREATE TABLE `portfolio_files` (
	`id` text PRIMARY KEY NOT NULL,
	`content_type` text NOT NULL,
	`data` blob NOT NULL,
	`size` integer NOT NULL,
	`created_at` text NOT NULL
);
