CREATE TABLE `course_enrollments` (
	`id` text PRIMARY KEY NOT NULL,
	`store_id` text NOT NULL,
	`user_id` text NOT NULL,
	`product_id` text NOT NULL,
	`order_id` text NOT NULL,
	`enrolled_at` integer,
	`completed_at` integer,
	FOREIGN KEY (`store_id`) REFERENCES `stores`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `course_lessons` (
	`id` text PRIMARY KEY NOT NULL,
	`section_id` text NOT NULL,
	`title` text NOT NULL,
	`type` text DEFAULT 'video' NOT NULL,
	`video_url` text,
	`audio_url` text,
	`content` text,
	`duration` text,
	`sort_order` integer DEFAULT 0,
	`is_visible` integer DEFAULT true,
	`is_free_preview` integer DEFAULT false,
	`created_at` integer,
	FOREIGN KEY (`section_id`) REFERENCES `course_sections`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `course_sections` (
	`id` text PRIMARY KEY NOT NULL,
	`product_id` text NOT NULL,
	`title` text NOT NULL,
	`sort_order` integer DEFAULT 0,
	`is_visible` integer DEFAULT true,
	`created_at` integer,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `ebook_purchases` (
	`id` text PRIMARY KEY NOT NULL,
	`store_id` text NOT NULL,
	`user_id` text NOT NULL,
	`product_id` text NOT NULL,
	`order_id` text NOT NULL,
	`purchased_at` integer,
	`last_read_at` integer,
	`last_page` integer DEFAULT 0,
	`total_pages` integer DEFAULT 0,
	FOREIGN KEY (`store_id`) REFERENCES `stores`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `lesson_completions` (
	`id` text PRIMARY KEY NOT NULL,
	`enrollment_id` text NOT NULL,
	`lesson_id` text NOT NULL,
	`completed_at` integer,
	FOREIGN KEY (`enrollment_id`) REFERENCES `course_enrollments`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`lesson_id`) REFERENCES `course_lessons`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
ALTER TABLE `products` ADD `digital_type` text DEFAULT 'link';--> statement-breakpoint
ALTER TABLE `products` ADD `ebook_file_key` text;--> statement-breakpoint
CREATE UNIQUE INDEX `course_enrollments_user_id_product_id_unique` ON `course_enrollments` (`user_id`,`product_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `ebook_purchases_user_id_product_id_unique` ON `ebook_purchases` (`user_id`,`product_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `lesson_completions_enrollment_id_lesson_id_unique` ON `lesson_completions` (`enrollment_id`,`lesson_id`);