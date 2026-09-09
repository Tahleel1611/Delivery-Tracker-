-- AlterTable
ALTER TABLE "deliveries" ADD COLUMN     "pod_image_url" TEXT;

-- CreateTable
CREATE TABLE "tracking_tokens" (
    "id" UUID NOT NULL,
    "token" VARCHAR(128) NOT NULL,
    "delivery_id" UUID NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tracking_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tracking_tokens_token_key" ON "tracking_tokens"("token");

-- CreateIndex
CREATE UNIQUE INDEX "tracking_tokens_delivery_id_key" ON "tracking_tokens"("delivery_id");

-- CreateIndex
CREATE INDEX "tracking_tokens_expires_at_idx" ON "tracking_tokens"("expires_at");

-- AddForeignKey
ALTER TABLE "tracking_tokens" ADD CONSTRAINT "tracking_tokens_delivery_id_fkey" FOREIGN KEY ("delivery_id") REFERENCES "deliveries"("id") ON DELETE CASCADE ON UPDATE CASCADE;
