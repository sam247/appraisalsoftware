-- Marketplace go/no-go reporting: purchases and revenue per pack. Additive, server-only.
BEGIN;

CREATE VIEW private.template_purchase_summary AS
SELECT
 pack_slug,
 count(*)::integer AS purchases,
 coalesce(sum(amount_total), 0)::integer AS revenue_pence,
 min(purchased_at) AS first_purchase_at,
 max(purchased_at) AS last_purchase_at,
 count(*) FILTER (WHERE purchased_at >= now() - interval '30 days')::integer AS purchases_last_30_days
FROM private.template_purchases
GROUP BY pack_slug;

REVOKE ALL ON private.template_purchase_summary FROM PUBLIC, anon, authenticated;

COMMIT;
