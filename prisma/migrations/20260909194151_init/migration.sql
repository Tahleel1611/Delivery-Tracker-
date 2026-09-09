-- CreateEnum
CREATE TYPE "DriverStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "DeliveryStatus" AS ENUM ('READY_FOR_DISPATCH', 'OUT_FOR_DELIVERY', 'DELIVERED', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "WebhookReceiptStatus" AS ENUM ('PROCESSED', 'FAILED');

-- CreateTable
CREATE TABLE "drivers" (
    "id" UUID NOT NULL,
    "name" VARCHAR(160) NOT NULL,
    "phone" VARCHAR(32) NOT NULL,
    "status" "DriverStatus" NOT NULL DEFAULT 'ACTIVE',
    "vehicle_details" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "drivers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "deliveries" (
    "id" UUID NOT NULL,
    "order_ref" VARCHAR(120) NOT NULL,
    "customer_phone" VARCHAR(32) NOT NULL,
    "delivery_address" TEXT NOT NULL,
    "status" "DeliveryStatus" NOT NULL DEFAULT 'READY_FOR_DISPATCH',
    "assigned_driver_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "deliveries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "delivery_status_logs" (
    "id" UUID NOT NULL,
    "delivery_id" UUID NOT NULL,
    "status" "DeliveryStatus" NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lat" DECIMAL(9,6),
    "lng" DECIMAL(9,6),
    "driver_id" UUID,

    CONSTRAINT "delivery_status_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "webhook_receipts" (
    "id" UUID NOT NULL,
    "payload_hash" VARCHAR(64) NOT NULL,
    "status" "WebhookReceiptStatus" NOT NULL DEFAULT 'PROCESSED',
    "processed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "webhook_receipts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "drivers_status_idx" ON "drivers"("status");

-- CreateIndex
CREATE UNIQUE INDEX "deliveries_order_ref_key" ON "deliveries"("order_ref");

-- CreateIndex
CREATE INDEX "deliveries_assigned_driver_id_idx" ON "deliveries"("assigned_driver_id");

-- CreateIndex
CREATE INDEX "deliveries_status_idx" ON "deliveries"("status");

-- CreateIndex
CREATE INDEX "delivery_status_logs_delivery_id_timestamp_idx" ON "delivery_status_logs"("delivery_id", "timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "webhook_receipts_payload_hash_key" ON "webhook_receipts"("payload_hash");

-- CreateIndex
CREATE INDEX "webhook_receipts_created_at_idx" ON "webhook_receipts"("created_at");

-- AddForeignKey
ALTER TABLE "deliveries" ADD CONSTRAINT "deliveries_assigned_driver_id_fkey" FOREIGN KEY ("assigned_driver_id") REFERENCES "drivers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "delivery_status_logs" ADD CONSTRAINT "delivery_status_logs_delivery_id_fkey" FOREIGN KEY ("delivery_id") REFERENCES "deliveries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "delivery_status_logs" ADD CONSTRAINT "delivery_status_logs_driver_id_fkey" FOREIGN KEY ("driver_id") REFERENCES "drivers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
