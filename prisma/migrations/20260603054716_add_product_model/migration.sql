/*
  Warnings:

  - You are about to drop the column `pricePerBaseUnit` on the `Product` table. All the data in the column will be lost.
  - Added the required column `pricePerUnit` to the `Product` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `dimension` on the `Product` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `baseUnit` on the `Product` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "ProductDimension" AS ENUM ('WEIGHT', 'VOLUME', 'COUNT');

-- CreateEnum
CREATE TYPE "BaseUnit" AS ENUM ('GRAM', 'MILLILITER', 'ITEM');

-- AlterTable
ALTER TABLE "Product" DROP COLUMN "pricePerBaseUnit",
ADD COLUMN     "pricePerUnit" DECIMAL(20,8) NOT NULL,
DROP COLUMN "dimension",
ADD COLUMN     "dimension" "ProductDimension" NOT NULL,
DROP COLUMN "baseUnit",
ADD COLUMN     "baseUnit" "BaseUnit" NOT NULL;

-- DropEnum
DROP TYPE "Dimension";
