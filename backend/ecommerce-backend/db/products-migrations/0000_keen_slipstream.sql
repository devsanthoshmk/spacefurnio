CREATE TABLE "products" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"price" integer NOT NULL,
	"brand" text,
	"category" text,
	"material" text,
	"rating" numeric(3, 1),
	"reviews" integer DEFAULT 0,
	"popularity" integer DEFAULT 0,
	"image_src" text,
	"image_alt" text,
	"href" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
