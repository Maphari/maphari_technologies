-- CreateTable brand_assets
CREATE TABLE IF NOT EXISTS core_schema.brand_assets (
    id           UUID         NOT NULL DEFAULT gen_random_uuid(),
    client_id    TEXT         NOT NULL,
    type         TEXT         NOT NULL,
    name         TEXT         NOT NULL,
    file_id      TEXT,
    storage_key  TEXT,
    mime_type    TEXT,
    size_bytes   INTEGER,
    value        TEXT,
    variant      TEXT,
    sort_order   INTEGER      NOT NULL DEFAULT 0,
    created_at   TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at   TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT brand_assets_pkey PRIMARY KEY (id),
    CONSTRAINT brand_assets_client_id_fkey FOREIGN KEY (client_id)
        REFERENCES core_schema.clients(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS brand_assets_client_id_type_idx
    ON core_schema.brand_assets (client_id, type);
