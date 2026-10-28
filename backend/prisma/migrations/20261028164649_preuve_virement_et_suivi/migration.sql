-- CreateEnum
CREATE TYPE "DeliveryStage" AS ENUM ('PREPARING', 'SHIPPED', 'DELIVERED');

-- CreateTable
CREATE TABLE "TransferProof" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "data" BYTEA NOT NULL,
    "submittedBy" TEXT NOT NULL,
    "notified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TransferProof_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderNotification" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "stage" "DeliveryStage" NOT NULL,
    "email" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3),
    "error" TEXT,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrderNotification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TransferProof_orderId_idx" ON "TransferProof"("orderId");

-- CreateIndex
CREATE INDEX "TransferProof_createdAt_idx" ON "TransferProof"("createdAt");

-- CreateIndex
CREATE INDEX "OrderNotification_sentAt_idx" ON "OrderNotification"("sentAt");

-- CreateIndex
CREATE UNIQUE INDEX "OrderNotification_orderId_stage_key" ON "OrderNotification"("orderId", "stage");

-- AddForeignKey
ALTER TABLE "TransferProof" ADD CONSTRAINT "TransferProof_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderNotification" ADD CONSTRAINT "OrderNotification_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
