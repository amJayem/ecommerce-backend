/*
  Warnings:

  - You are about to drop the column `deliveryInstructions` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the column `shipping` on the `Order` table. All the data in the column will be lost.
  - The `billingAddress` column on the `Order` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Changed the type of `shippingAddress` on the `Order` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "Order" DROP COLUMN "deliveryInstructions",
DROP COLUMN "shipping",
ADD COLUMN     "deliveryNote" TEXT,
ADD COLUMN     "shippingAddressText" TEXT,
ADD COLUMN     "shippingCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
ALTER COLUMN "id" DROP DEFAULT,
DROP COLUMN "billingAddress",
ADD COLUMN     "billingAddress" JSONB,
DROP COLUMN "shippingAddress",
ADD COLUMN     "shippingAddress" JSONB NOT NULL;
DROP SEQUENCE "Order_id_seq";

-- AlterTable
ALTER TABLE "Product" ALTER COLUMN "id" DROP DEFAULT;
DROP SEQUENCE "Product_id_seq";
