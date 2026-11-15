-- AlterTable
ALTER TABLE "orders" ADD COLUMN "giftMessage" TEXT;

-- AlterTable
ALTER TABLE "order_items" ADD COLUMN "giftWrap" BOOLEAN NOT NULL DEFAULT false;
