-- Migration: replace emailAddress with emailEnabled
-- emailAddress column is dropped; emailEnabled boolean defaults to false

ALTER TABLE "NotificationSetting" DROP COLUMN IF EXISTS "emailAddress";
ALTER TABLE "NotificationSetting" ADD COLUMN "emailEnabled" BOOLEAN NOT NULL DEFAULT false;
