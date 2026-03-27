ALTER TABLE "client_contacts"
ADD COLUMN "canManageAccess" BOOLEAN NOT NULL DEFAULT false;

WITH ranked_contacts AS (
  SELECT
    id,
    "clientId",
    "isPrimary",
    ROW_NUMBER() OVER (
      PARTITION BY "clientId"
      ORDER BY
        CASE WHEN "isPrimary" THEN 0 ELSE 1 END,
        "createdAt" ASC
    ) AS row_num
  FROM "client_contacts"
)
UPDATE "client_contacts" AS contacts
SET "canManageAccess" = true
FROM ranked_contacts
WHERE contacts.id = ranked_contacts.id
  AND ranked_contacts."isPrimary" = true
  AND ranked_contacts.row_num = 1;

CREATE UNIQUE INDEX "client_contacts_single_access_admin_idx"
ON "client_contacts"("clientId")
WHERE "canManageAccess" = true;
