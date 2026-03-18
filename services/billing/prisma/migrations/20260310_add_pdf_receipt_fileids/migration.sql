-- Add pdfFileId to invoices and receiptFileId to payments
ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "pdfFileId" TEXT;
ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "receiptFileId" TEXT;
