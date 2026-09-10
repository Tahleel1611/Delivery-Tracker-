/*
  Warnings:

  - A unique constraint covering the columns `[lease_token]` on the table `notification_attempts` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "deliveries" ADD COLUMN     "pod_uploaded_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "notification_attempts" ADD COLUMN     "lease_token" VARCHAR(80),
ADD COLUMN     "locked_until" TIMESTAMP(3),
ADD COLUMN     "provider_message_id" VARCHAR(180);

-- CreateIndex
CREATE UNIQUE INDEX "notification_attempts_lease_token_key" ON "notification_attempts"("lease_token");
