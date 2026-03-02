ALTER TABLE "notifications" ALTER COLUMN "is_read" DROP DEFAULT;
ALTER TABLE "notifications" ALTER COLUMN "is_read" SET DATA TYPE boolean USING is_read::boolean;
ALTER TABLE "notifications" ALTER COLUMN "is_read" SET DEFAULT false;