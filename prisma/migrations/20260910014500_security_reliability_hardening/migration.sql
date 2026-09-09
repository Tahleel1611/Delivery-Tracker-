-- Secure tracking tokens: hash any existing raw bearer tokens before removing them.
CREATE EXTENSION IF NOT EXISTS pgcrypto;
ALTER TABLE "tracking_tokens" ADD COLUMN "token_hash" CHAR(64);
UPDATE "tracking_tokens" SET "token_hash" = encode(digest("token", 'sha256'), 'hex') WHERE "token_hash" IS NULL;
ALTER TABLE "tracking_tokens" ALTER COLUMN "token_hash" SET NOT NULL;
CREATE UNIQUE INDEX "tracking_tokens_token_hash_key" ON "tracking_tokens"("token_hash");
ALTER TABLE "tracking_tokens" DROP COLUMN "token";

ALTER TABLE "deliveries" ADD COLUMN "pod_object_key" TEXT;

CREATE TABLE "driver_credentials" (
  "id" UUID NOT NULL,
  "driver_id" UUID NOT NULL,
  "username" VARCHAR(120) NOT NULL,
  "password_hash" TEXT NOT NULL,
  "failed_attempts" INTEGER NOT NULL DEFAULT 0,
  "locked_until" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "driver_credentials_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "driver_credentials_driver_id_key" ON "driver_credentials"("driver_id");
CREATE UNIQUE INDEX "driver_credentials_username_key" ON "driver_credentials"("username");
ALTER TABLE "driver_credentials" ADD CONSTRAINT "driver_credentials_driver_id_fkey" FOREIGN KEY ("driver_id") REFERENCES "drivers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "driver_sessions" (
  "id" UUID NOT NULL,
  "driver_id" UUID NOT NULL,
  "refresh_hash" CHAR(64) NOT NULL,
  "expires_at" TIMESTAMP(3) NOT NULL,
  "revoked_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "driver_sessions_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "driver_sessions_refresh_hash_key" ON "driver_sessions"("refresh_hash");
CREATE INDEX "driver_sessions_driver_id_expires_at_idx" ON "driver_sessions"("driver_id", "expires_at");
ALTER TABLE "driver_sessions" ADD CONSTRAINT "driver_sessions_driver_id_fkey" FOREIGN KEY ("driver_id") REFERENCES "drivers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TYPE "NotificationAttemptStatus" AS ENUM ('PENDING', 'PROCESSING', 'SENT', 'FAILED', 'DEAD_LETTER');
CREATE TABLE "notification_attempts" (
  "id" UUID NOT NULL,
  "delivery_id" UUID NOT NULL,
  "status" "DeliveryStatus" NOT NULL,
  "provider" VARCHAR(40) NOT NULL DEFAULT 'mock',
  "state" "NotificationAttemptStatus" NOT NULL DEFAULT 'PENDING',
  "attempt_count" INTEGER NOT NULL DEFAULT 0,
  "last_error" TEXT,
  "sent_at" TIMESTAMP(3),
  "next_attempt_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "idempotency_key" VARCHAR(180) NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "notification_attempts_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "notification_attempts_idempotency_key_key" ON "notification_attempts"("idempotency_key");
CREATE UNIQUE INDEX "notification_attempts_delivery_id_status_key" ON "notification_attempts"("delivery_id", "status");
CREATE INDEX "notification_attempts_state_next_attempt_at_idx" ON "notification_attempts"("state", "next_attempt_at");
ALTER TABLE "notification_attempts" ADD CONSTRAINT "notification_attempts_delivery_id_fkey" FOREIGN KEY ("delivery_id") REFERENCES "deliveries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "webhook_receipts" ADD COLUMN "source_event_id" VARCHAR(160), ADD COLUMN "event_type" VARCHAR(80), ADD COLUMN "failure_reason" TEXT;
CREATE UNIQUE INDEX "webhook_receipts_source_event_id_key" ON "webhook_receipts"("source_event_id");
