-- DRAFT FOR REVIEW. NOT A MIGRATION. Do not copy into supabase/migrations until
-- downloadable purchases are approved (see docs/marketplace-downloads.md).
--
-- Document licences are separate from workspaces and from
-- private.template_purchases, so a download never grants interactive access and
-- an interactive purchase never grants files. Buyers need no account.
BEGIN;

CREATE TABLE private.document_purchases (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 -- Shown to the buyer (emails, receipts, access page) and used by support. Never
 -- written into generated documents. Format from src/lib/marketplace/order-reference.ts.
 order_reference text NOT NULL UNIQUE CHECK (order_reference ~ '^AS-D(-[0-9A-HJKMNP-TV-Z]{4}){3}$'),
 pack_slug text NOT NULL CHECK (pack_slug ~ '^[a-z0-9-]{3,64}$'),
 -- Pack version and document revision at purchase; later versions are free updates.
 pack_version integer NOT NULL CHECK (pack_version > 0),
 document_revision integer NOT NULL CHECK (document_revision > 0),
 -- Needed to deliver and recover access. Nothing else about the buyer is stored here;
 -- names, addresses and VAT numbers stay in Stripe.
 buyer_email citext NOT NULL,
 stripe_session_id text NOT NULL UNIQUE,
 stripe_customer_id text,
 amount_total integer NOT NULL,
 currency text NOT NULL,
 -- The buyer's reg 37 consent and acknowledgement, captured at checkout and repeated in the confirmation email.
 cancellation_waiver_at timestamptz,
 billing_country text NOT NULL CHECK (billing_country = 'GB'),
 status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','refunded','disputed','revoked')),
 status_changed_at timestamptz,
 purchased_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX document_purchases_email_idx ON private.document_purchases (buyer_email);

-- Opaque access links emailed to the buyer; only a hash is stored (as for respondent tokens).
CREATE TABLE private.document_access_tokens (
 token_hash bytea PRIMARY KEY,
 purchase_id uuid NOT NULL REFERENCES private.document_purchases(id) ON DELETE CASCADE,
 created_at timestamptz NOT NULL DEFAULT now(),
 expires_at timestamptz NOT NULL,
 revoked_at timestamptz
);

-- Download history: what was delivered, when. No IP addresses or user agents.
CREATE TABLE private.document_downloads (
 id bigserial PRIMARY KEY,
 purchase_id uuid NOT NULL REFERENCES private.document_purchases(id) ON DELETE CASCADE,
 pack_version integer NOT NULL,
 document_revision integer NOT NULL,
 format text NOT NULL CHECK (format IN ('docx','pdf')),
 downloaded_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX document_downloads_purchase_idx ON private.document_downloads (purchase_id, downloaded_at);

REVOKE ALL ON private.document_purchases, private.document_access_tokens, private.document_downloads FROM PUBLIC, anon, authenticated;

-- Service-only RPCs (webhook and the delivery route), mirroring record_template_purchase:
--   record_document_purchase(reference, slug, version, revision, email, session, customer, amount, currency, waiver_at, country) -> 'recorded' | 'duplicate'
--   set_document_purchase_status(session, status)            -- refunds and disputes
--   issue_document_access_token(purchase_id, ttl)            -- returns the raw token once
--   resolve_document_access(token) -> purchase row if active and unexpired
--   record_document_download(purchase_id, version, revision, format) -- enforces a daily limit

COMMIT;
