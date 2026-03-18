-- Add signedByName to client_contracts
ALTER TABLE "client_contracts" ADD COLUMN IF NOT EXISTS "signed_by_name" TEXT;
