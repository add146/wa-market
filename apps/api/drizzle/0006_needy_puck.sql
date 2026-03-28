ALTER TABLE `orders` ADD `has_digital_items` integer DEFAULT false;--> statement-breakpoint
ALTER TABLE `orders` ADD `has_preorder_items` integer DEFAULT false;--> statement-breakpoint
ALTER TABLE `orders` ADD `max_preorder_days` integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE `orders` ADD `digital_delivery_status` text;--> statement-breakpoint
ALTER TABLE `products` ADD `product_type` text DEFAULT 'regular';--> statement-breakpoint
ALTER TABLE `products` ADD `preorder_days` integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE `products` ADD `digital_content` text;