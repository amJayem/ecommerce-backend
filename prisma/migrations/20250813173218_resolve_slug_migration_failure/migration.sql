/*
  This migration resolves the failed 20250813173217_make_slug_required_with_default migration.
  It ensures the slug column exists with proper constraints without failing on existing data.
*/

-- First, ensure the slug column exists (in case it was partially created)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'Product' AND column_name = 'slug'
    ) THEN
        ALTER TABLE "Product" ADD COLUMN "slug" TEXT;
    END IF;
END $$;

-- Ensure the unique index exists (in case it was dropped)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 'Product' AND indexname = 'Product_slug_key'
    ) THEN
        CREATE UNIQUE INDEX "Product_slug_key" ON "Product"("slug");
    END IF;
END $$;

-- Update any NULL slug values to have a default value to maintain data integrity
UPDATE "Product" 
SET "slug" = CONCAT('product-', id) 
WHERE "slug" IS NULL;

-- Now we can safely make the column NOT NULL with a default
ALTER TABLE "Product" ALTER COLUMN "slug" SET NOT NULL;
ALTER TABLE "Product" ALTER COLUMN "slug" SET DEFAULT '';
