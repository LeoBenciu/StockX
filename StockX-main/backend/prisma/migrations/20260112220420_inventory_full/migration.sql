/*
  Warnings:

  - You are about to drop the column `unit` on the `ingredients` table. All the data in the column will be lost.
  - You are about to drop the column `lastUpdated` on the `inventory` table. All the data in the column will be lost.
  - You are about to drop the column `unit` on the `inventory` table. All the data in the column will be lost.
  - Added the required column `baseUnit` to the `ingredients` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `inventory` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `unit` on the `invoice_items` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `unit` on the `recipe_items` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "UnitType" AS ENUM ('G', 'KG', 'ML', 'L', 'PCS');

-- AlterTable
ALTER TABLE "ingredients" DROP COLUMN "unit",
ADD COLUMN     "baseUnit" "UnitType" NOT NULL;

-- AlterTable
ALTER TABLE "inventory" DROP COLUMN "lastUpdated",
DROP COLUMN "unit",
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "inventory_deductions" ADD COLUMN     "recipeId" TEXT;

-- AlterTable
ALTER TABLE "invoice_items" DROP COLUMN "unit",
ADD COLUMN     "unit" "UnitType" NOT NULL;

-- AlterTable
ALTER TABLE "recipe_items" DROP COLUMN "unit",
ADD COLUMN     "unit" "UnitType" NOT NULL;

-- AddForeignKey
ALTER TABLE "inventory_deductions" ADD CONSTRAINT "inventory_deductions_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "recipes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
