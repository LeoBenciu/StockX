/*
  Warnings:

  - You are about to drop the column `unit` on the `ingredients` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "ingredients" DROP COLUMN "unit",
ADD COLUMN     "baseUnit" TEXT NOT NULL DEFAULT 'g',
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true;
