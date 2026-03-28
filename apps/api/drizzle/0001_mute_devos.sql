ALTER TABLE `stores` ADD `custom_domain` text;--> statement-breakpoint
CREATE UNIQUE INDEX `stores_custom_domain_unique` ON `stores` (`custom_domain`);