/*
  This migration was originally intended to make `Product.slug` NOT NULL with a default.
  To avoid failing on existing NULL values and to keep `slug` optional and unique as per schema,
  we intentionally perform no changes here. The previous migration already added `slug` (nullable)
  and its unique index.
*/
-- no-op
