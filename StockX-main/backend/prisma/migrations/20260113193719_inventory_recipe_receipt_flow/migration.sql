/*
  Warnings:

  - The values [ADD,ADJUST,MANUAL] on the enum `InventoryUpdateType` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `baseUnit` on the `ingredients` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `inventory` table. All the data in the column will be lost.
  - You are about to drop the column `notes` on the `inventory_updates` table. All the data in the column will be lost.
  - You are about to drop the column `itemName` on the `receipt_items` table. All the data in the column will be lost.
  - You are about to drop the column `unit` on the `recipe_items` table. All the data in the column will be lost.
  - You are about to drop the `inventory_deductions` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[name]` on the table `recipes` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `unit` to the `ingredients` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `unit` on the `invoice_items` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Added the required column `recipeId` to the `receipt_items` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "InventoryUpdateType_new" AS ENUM ('INVOICE_IN', 'RECIPE_OUT', 'MANUAL_ADJUST');
ALTER TABLE "inventory_updates" ALTER COLUMN "type" TYPE "InventoryUpdateType_new" USING ("type"::text::"InventoryUpdateType_new");
ALTER TYPE "InventoryUpdateType" RENAME TO "InventoryUpdateType_old";
ALTER TYPE "InventoryUpdateType_new" RENAME TO "InventoryUpdateType";
DROP TYPE "public"."InventoryUpdateType_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "inventory_deductions" DROP CONSTRAINT "inventory_deductions_inventoryId_fkey";

-- DropForeignKey
ALTER TABLE "inventory_deductions" DROP CONSTRAINT "inventory_deductions_receiptItemId_fkey";

-- DropForeignKey
ALTER TABLE "inventory_deductions" DROP CONSTRAINT "inventory_deductions_recipeId_fkey";

-- AlterTable
ALTER TABLE "ingredients" DROP COLUMN "baseUnit",
ADD COLUMN     "unit" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "inventory" DROP COLUMN "updatedAt",
ADD COLUMN     "lastUpdated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "inventory_updates" DROP COLUMN "notes",
ADD COLUMN     "reason" TEXT,
ADD COLUMN     "receiptItemId" TEXT;

-- AlterTable
ALTER TABLE "invoice_items" DROP COLUMN "unit",
ADD COLUMN     "unit" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "receipt_items" DROP COLUMN "itemName",
ADD COLUMN     "recipeId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "recipe_items" DROP COLUMN "unit";

-- DropTable
DROP TABLE "inventory_deductions";

-- DropEnum
DROP TYPE "UnitType";

-- CreateIndex
CREATE UNIQUE INDEX "recipes_name_key" ON "recipes"("name");

-- AddForeignKey
ALTER TABLE "receipt_items" ADD CONSTRAINT "receipt_items_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "recipes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_updates" ADD CONSTRAINT "inventory_updates_receiptItemId_fkey" FOREIGN KEY ("receiptItemId") REFERENCES "receipt_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;
