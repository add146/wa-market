ALTER TABLE `orders` ADD `has_service_items` integer DEFAULT false;--> statement-breakpoint
ALTER TABLE `orders` ADD `dp_amount` integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE `orders` ADD `dp_paid_at` integer;--> statement-breakpoint
ALTER TABLE `orders` ADD `settlement_amount` integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE `orders` ADD `settlement_paid_at` integer;--> statement-breakpoint
ALTER TABLE `orders` ADD `service_status` text;--> statement-breakpoint
ALTER TABLE `orders` ADD `service_notes` text;--> statement-breakpoint
ALTER TABLE `products` ADD `dp_type` text;--> statement-breakpoint
ALTER TABLE `products` ADD `dp_value` integer;--> statement-breakpoint
ALTER TABLE `products` ADD `service_duration` text;--> statement-breakpoint
ALTER TABLE `products` ADD `service_description` text;