/*
  Warnings:

  - You are about to drop the column `stockQuantity` on the `Product` table. All the data in the column will be lost.
  - Made the column `billingAddress` on table `Order` required. This step will fail if there are existing NULL values in that column.
  - Made the column `shippingAddress` on table `Order` required. This step will fail if there are existing NULL values in that column.
  - Made the column `subtotal` on table `Order` required. This step will fail if there are existing NULL values in that column.
  - Made the column `totalAmount` on table `Order` required. This step will fail if there are existing NULL values in that column.
  - Made the column `total` on table `OrderItem` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Order" ALTER COLUMN "billingAddress" SET NOT NULL,
ALTER COLUMN "shippingAddress" SET NOT NULL,
ALTER COLUMN "subtotal" SET NOT NULL,
ALTER COLUMN "totalAmount" SET NOT NULL;

-- AlterTable
ALTER TABLE "OrderItem" ALTER COLUMN "total" SET NOT NULL;

-- AlterTable
ALTER TABLE "Product" DROP COLUMN "stockQuantity",
ADD COLUMN     "stock" INTEGER NOT NULL DEFAULT 0;
