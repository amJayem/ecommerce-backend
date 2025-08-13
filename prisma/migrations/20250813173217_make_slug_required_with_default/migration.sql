/*
  Warnings:

  - Made the column `slug` on table `Product` required. This step will fail if there are existing NULL values in that column.

*/
-- DropIndex
DROP INDEX "Product_slug_key";

-- AlterTable
ALTER TABLE "Product" ALTER COLUMN "slug" SET NOT NULL,
ALTER COLUMN "slug" SET DEFAULT '';
