CREATE TABLE `payments` (
	`id` text PRIMARY KEY NOT NULL,
	`store_id` text NOT NULL,
	`order_id` text NOT NULL,
	`provider` text NOT NULL,
	`external_id` text,
	`payment_url` text,
	`amount` integer NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`paid_at` integer,
	`raw_response` text,
	`created_at` integer,
	FOREIGN KEY (`store_id`) REFERENCES `stores`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `subscriptions` (
	`id` text PRIMARY KEY NOT NULL,
	`store_id` text NOT NULL,
	`plan` text NOT NULL,
	`provider` text NOT NULL,
	`external_id` text,
	`payment_url` text,
	`amount` integer NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`period_start` integer,
	`period_end` integer,
	`paid_at` integer,
	`raw_response` text,
	`created_at` integer,
	FOREIGN KEY (`store_id`) REFERENCES `stores`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
ALTER TABLE `orders` ADD `payment_method` text DEFAULT 'whatsapp';--> statement-breakpoint
ALTER TABLE `orders` ADD `payment_status` text DEFAULT 'unpaid';