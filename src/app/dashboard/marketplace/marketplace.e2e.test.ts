/**
 * Marketplace journey against a real database: Stripe checkout → signed webhook →
 * purchase entitlement → template install → version update.
 *
 * Runs only with MARKETPLACE_E2E=1 against the disposable stack started by
 * scripts/marketplace-e2e.sh (supabase/postgres + PostgREST, all migrations).
 * Real: server actions, webhook route, Stripe signature checks, PostgREST, RLS
 * and RPCs. Stubbed: Stripe's API calls (customer, checkout session) and the
 * Supabase Auth user lookup (the membership check itself runs through RLS).
 */
import { createHmac, randomUUID } from "node:crypto";
import { execFileSync } from "node:child_process";
import http from "node:http";
import type { AddressInfo } from "node:net";
import { createClient as createSupabase } from "@supabase/supabase-js";
import { NextRequest } from "next/server";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

const RUN = process.env.MARKETPLACE_E2E === "1";
const PG_PORT = process.env.MARKETPLACE_E2E_PG_PORT ?? "54329";
const REST_PORT = Number(process.env.MARKETPLACE_E2E_REST_PORT ?? "54330");
const JWT_SECRET = process.env.MARKETPLACE_E2E_JWT_SECRET ?? "local-test-jwt-secret-at-least-32-chars-long";
const WEBHOOK_SECRET = "whsec_local_marketplace_e2e";

const b64 = (value: object) => Buffer.from(JSON.stringify(value)).toString("base64url");
function jwt(claims: Record<string, unknown>): string {
  const body = `${b64({ alg: "HS256", typ: "JWT" })}.${b64({ ...claims, exp: Math.floor(Date.now() / 1000) + 3600 })}`;
  return `${body}.${createHmac("sha256", JWT_SECRET).update(body).digest("base64url")}`;
}

/** Privileged SQL for fixtures and assertions; returns trimmed tuples-only output. */
function sql(text: string): string {
  return execFileSync("psql", ["-h", "localhost", "-p", PG_PORT, "-U", "postgres", "-d", "postgres", "-v", "ON_ERROR_STOP=1", "-tAq", "-f", "-"], {
    input: text,
    env: { ...process.env, PGPASSWORD: "postgres" },
  })
    .toString()
    .trim();
}

class Redirected extends Error {
  constructor(public url: string) {
    super(`redirect ${url}`);
  }
}

const session = vi.hoisted(() => ({ user: null as { id: string; email: string } | null, url: "", anon: "", token: "" }));
const checkout = vi.hoisted(() => ({ params: null as Record<string, unknown> | null }));

vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    throw new Redirected(url);
  },
  notFound: () => {
    throw new Redirected("not-found");
  },
}));
vi.mock("next/cache", () => ({ revalidatePath: () => undefined }));
vi.mock("@/lib/billing/customer", () => ({ ensureWorkspaceCustomer: async () => "cus_local_e2e" }));
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => {
    const client = createSupabase(session.url, session.anon, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { headers: { Authorization: `Bearer ${session.token}` } },
    });
    // Supabase Auth isn't running locally; everything after this lookup is real.
    client.auth.getUser = (async () => ({ data: { user: session.user }, error: session.user ? null : new Error("signed out") })) as never;
    return client;
  },
}));

async function action(run: () => Promise<void>): Promise<string> {
  try {
    await run();
  } catch (error) {
    if (error instanceof Redirected) return error.url;
    throw error;
  }
  throw new Error("expected a redirect");
}

function form(pack: string): FormData {
  const data = new FormData();
  data.set("pack", pack);
  return data;
}

function signIn(user: { id: string; email: string }) {
  session.user = user;
  session.token = jwt({ sub: user.id, email: user.email, role: "authenticated", aud: "authenticated" });
}

type Org = { user: { id: string; email: string }; org: string };
function workspace(name: string): Org {
  const user = { id: randomUUID(), email: `${name.toLowerCase().replace(/\W+/g, "-")}@example.test` };
  sql(`INSERT INTO auth.users(id,email) VALUES('${user.id}','${user.email}');`);
  const org = sql(`SET request.jwt.claims='{"sub":"${user.id}","role":"authenticated"}'; SET ROLE authenticated;
    SELECT (public.bootstrap_organization('${name}')).id;`);
  return { user, org };
}

describe.skipIf(!RUN)("marketplace journey (disposable database)", () => {
  let proxy: http.Server;
  let actions: typeof import("./actions");
  let webhook: typeof import("@/app/api/stripe/webhook/route");
  let stripeModule: typeof import("@/lib/billing/stripe");

  beforeAll(async () => {
    // supabase-js calls /rest/v1/*; PostgREST serves the same API at /.
    proxy = http.createServer((req, res) => {
      const upstream = http.request(
        { host: "127.0.0.1", port: REST_PORT, method: req.method, path: (req.url ?? "/").replace(/^\/rest\/v1/, "") || "/", headers: req.headers },
        (r) => {
          res.writeHead(r.statusCode ?? 502, r.headers);
          r.pipe(res);
        },
      );
      req.pipe(upstream);
    });
    await new Promise<void>((resolve) => proxy.listen(0, "127.0.0.1", resolve));
    session.url = `http://127.0.0.1:${(proxy.address() as AddressInfo).port}`;
    session.anon = jwt({ role: "anon" });
    Object.assign(process.env, {
      NEXT_PUBLIC_SUPABASE_URL: session.url,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: session.anon,
      SUPABASE_SERVICE_ROLE_KEY: jwt({ role: "service_role" }),
      STRIPE_SECRET_KEY: "sk_test_local_marketplace_e2e",
      STRIPE_WEBHOOK_SECRET: WEBHOOK_SECRET,
      NEXT_PUBLIC_APP_ORIGIN: "https://app.example.test",
    });
    stripeModule = await import("@/lib/billing/stripe");
    vi.spyOn(stripeModule.stripe().checkout.sessions, "create").mockImplementation((async (params: Record<string, unknown>) => {
      checkout.params = params;
      return { id: "cs_local_e2e_1", url: "https://checkout.stripe.test/cs_local_e2e_1" };
    }) as never);
    actions = await import("./actions");
    webhook = await import("@/app/api/stripe/webhook/route");
  });

  afterAll(() => {
    proxy?.close();
  });

  async function deliverCheckout(org: string, params: Record<string, unknown>, sessionId = "cs_local_e2e_1") {
    const metadata = params.metadata as Record<string, string>;
    const lineItem = (params.line_items as Array<{ price_data: { unit_amount: number } }>)[0];
    const payload = JSON.stringify({
      id: `evt_${randomUUID()}`,
      object: "event",
      type: "checkout.session.completed",
      created: Math.floor(Date.now() / 1000),
      data: {
        object: {
          id: sessionId,
          object: "checkout.session",
          mode: "payment",
          payment_status: "paid",
          client_reference_id: org,
          metadata,
          amount_total: lineItem.price_data.unit_amount,
          currency: "gbp",
        },
      },
    });
    const signature = stripeModule.stripe().webhooks.generateTestHeaderString({ payload, secret: WEBHOOK_SECRET });
    const response = await webhook.POST(new NextRequest("http://localhost/api/stripe/webhook", { method: "POST", body: payload, headers: { "stripe-signature": signature } }));
    return { status: response.status, body: (await response.json()) as Record<string, unknown> };
  }

  it("1. new purchase: checkout → webhook entitlement → install with the pack version", async () => {
    const buyer = workspace("Care buyer");
    signIn(buyer.user);
    const slug = "care-worker-appraisal-pack";

    // Not bought yet: using it is refused and nothing is created.
    expect(await action(() => actions.usePack(form(slug)))).toMatch(/\?error=Add%20Care%20Worker/);
    expect(sql(`SELECT count(*) FROM public.templates WHERE organization_id='${buyer.org}' AND settings ? 'marketplace_pack'`)).toBe("0");

    // Checkout carries the workspace, pack and price.
    expect(await action(() => actions.buyPack(form(slug)))).toBe("https://checkout.stripe.test/cs_local_e2e_1");
    expect(checkout.params?.metadata).toEqual({ organization_id: buyer.org, pack_slug: slug, kind: "template_pack" });
    expect(checkout.params?.cancel_url).toBe(`https://app.example.test/dashboard/marketplace/${slug}`);

    // A forged signature is rejected; the signed webhook records the entitlement once.
    const forged = await webhook.POST(new NextRequest("http://localhost/api/stripe/webhook", { method: "POST", body: "{}", headers: { "stripe-signature": "t=1,v1=bad" } }));
    expect(forged.status).toBe(400);
    expect(await deliverCheckout(buyer.org, checkout.params!)).toEqual({ status: 200, body: { received: true, result: "recorded" } });
    const replay = await deliverCheckout(buyer.org, checkout.params!);
    expect(replay.status).toBe(200);
    expect(sql(`SELECT count(*) FROM private.template_purchases WHERE organization_id='${buyer.org}' AND pack_slug='${slug}'`)).toBe("1");
    expect(sql(`SELECT purchases||'|'||revenue_pence FROM private.template_purchase_summary WHERE pack_slug='${slug}'`)).toBe("1|5900");

    // The app now sees it as owned and installs version 1 with every question.
    const destination = await action(() => actions.usePack(form(slug)));
    const templateId = destination.match(/template=([0-9a-f-]{36})/)?.[1];
    expect(templateId).toBeTruthy();
    expect(sql(`SELECT name||'|'||(settings->>'marketplace_pack')||'|'||(settings->>'marketplace_pack_version') FROM public.templates WHERE id='${templateId}'`)).toBe(
      `Care Worker Appraisal & Supervision (CQC)|${slug}|1`,
    );
    expect(sql(`SELECT count(*)||'|'||count(competency_label) FILTER (WHERE type='rating')||'|'||count(*) FILTER (WHERE type='rating') FROM public.template_questions WHERE template_id='${templateId}'`)).toBe("19|12|12");

    // Using it again reuses the same template.
    expect(await action(() => actions.usePack(form(slug)))).toBe(destination);
    expect(sql(`SELECT count(*) FROM public.templates WHERE organization_id='${buyer.org}' AND settings ? 'marketplace_pack'`)).toBe("1");
  });

  it("2. existing customer: v2 is added alongside v1 and past reviews are untouched", async () => {
    const customer = workspace("Probation customer");
    signIn(customer.user);
    const slug = "probation-review-pack";
    // A workspace that owned and installed the probation pack before versioning existed.
    sql(`SET request.jwt.claims='{"role":"service_role"}'; SET ROLE service_role;
      SELECT public.record_template_purchase('${customer.org}','${slug}','cs_old_probation',2900,'gbp');`);
    const fixture = sql(`SET request.jwt.claims='{"sub":"${customer.user.id}","role":"authenticated"}'; SET ROLE authenticated;
      INSERT INTO public.people(organization_id,email,full_name) VALUES('${customer.org}','new-starter@example.test','New Starter'),('${customer.org}','line-manager@example.test','Line Manager');
      INSERT INTO public.templates(organization_id,name,campaign_type_default,settings) VALUES('${customer.org}','Probation Review Pack','annual_appraisal','{"marketplace_pack":"${slug}"}') RETURNING id \\gset old_
      INSERT INTO public.template_questions(organization_id,template_id,sort_order,type,prompt,required,scale,stable_key) VALUES
        ('${customer.org}',:'old_id',0,'text','What has gone well since starting?',true,'{}','${slug}:0'),
        ('${customer.org}',:'old_id',1,'text','Recommendation: pass, extend or end probation — and why.',true,'{}','${slug}:1');
      INSERT INTO public.campaigns(organization_id,name,campaign_type,template_id) VALUES('${customer.org}','Probation: New Starter','annual_appraisal',:'old_id') RETURNING id \\gset c_
      SELECT public.save_appraisal_participants(:'c_id',jsonb_build_array(jsonb_build_object('person_id',(SELECT id FROM public.people WHERE email='new-starter@example.test'),'manager_person_id',(SELECT id FROM public.people WHERE email='line-manager@example.test')))) \\gset discard_
      SELECT public.activate_campaign(:'c_id') \\gset discard2_
      RESET ROLE;
      SELECT payload->>'raw_token' AS token FROM public.email_outbox WHERE payload->>'campaign_id'=:'c_id' LIMIT 1 \\gset
      SELECT id AS question FROM public.campaign_questions WHERE campaign_id=:'c_id' ORDER BY sort_order LIMIT 1 \\gset
      SET ROLE anon;
      SELECT public.respond_save(:'token',jsonb_build_array(jsonb_build_object('campaign_question_id',:'question','text_value','Settled in well'))) \\gset discard3_
      RESET ROLE;
      SELECT :'old_id'||'|'||:'c_id';`);
    const [oldTemplate, campaign] = fixture.split("\n").pop()!.split("|");

    const snapshot = () =>
      sql(`SELECT md5(concat_ws('#',
        (SELECT row_to_json(t)::text FROM public.templates t WHERE id='${oldTemplate}'),
        (SELECT string_agg(row_to_json(q)::text, ',' ORDER BY id) FROM public.template_questions q WHERE template_id='${oldTemplate}'),
        (SELECT row_to_json(c)::text FROM public.campaigns c WHERE id='${campaign}'),
        (SELECT string_agg(row_to_json(q)::text, ',' ORDER BY id) FROM public.campaign_questions q WHERE campaign_id='${campaign}'),
        (SELECT string_agg(row_to_json(a)::text, ',' ORDER BY a.id) FROM public.response_answers a JOIN public.responses r ON r.id=a.response_id WHERE r.campaign_id='${campaign}')))`);
    const before = snapshot();
    expect(sql(`SELECT count(*) FROM public.response_answers a JOIN public.responses r ON r.id=a.response_id WHERE r.campaign_id='${campaign}' AND a.text_value='Settled in well'`)).toBe("1");

    // The workspace sees v1 installed, so an update is offered.
    const { installedPackVersions } = await import("./state");
    expect((await installedPackVersions(customer.org)).get(slug)).toBe(1);

    const destination = await action(() => actions.usePack(form(slug)));
    const v2 = destination.match(/template=([0-9a-f-]{36})/)?.[1];
    expect(v2).toBeTruthy();
    expect(v2).not.toBe(oldTemplate);
    expect(sql(`SELECT name||'|'||(settings->>'marketplace_pack_version') FROM public.templates WHERE id='${v2}'`)).toBe("Probation Review Pack (v2, Oct 2026)|2");
    expect(sql(`SELECT count(*)||'|'||min(stable_key) FROM public.template_questions WHERE template_id='${v2}'`)).toBe(`16|${slug}@v2:0`);

    // The original template, the campaign built from it and its answers are byte-for-byte unchanged.
    expect(snapshot()).toBe(before);
    expect((await installedPackVersions(customer.org)).get(slug)).toBe(2);

    // Installing again reuses v2 rather than adding a third copy.
    expect(await action(() => actions.usePack(form(slug)))).toBe(destination);
    expect(sql(`SELECT count(*) FROM public.templates WHERE organization_id='${customer.org}' AND settings->>'marketplace_pack'='${slug}'`)).toBe("2");
  });

  it("3. an unpaid workspace cannot install paid packs by calling the action directly", async () => {
    const owner = workspace("Paying neighbour");
    sql(`SET request.jwt.claims='{"role":"service_role"}'; SET ROLE service_role;
      SELECT public.record_template_purchase('${owner.org}','smcr-fitness-propriety-pack','cs_neighbour',8900,'gbp');`);
    const freeloader = workspace("Unpaid workspace");
    signIn(freeloader.user);

    // Paid sector pack, another workspace's purchase, a Pro-included pack on Free, a 360 pack, and an unknown slug.
    expect(await action(() => actions.usePack(form("smcr-fitness-propriety-pack")))).toMatch(/\?error=Add%20SM%26CR/);
    expect(await action(() => actions.usePack(form("annual-appraisal-pack")))).toMatch(/\?error=Add%20Annual/);
    expect(await action(() => actions.usePack(form("leadership-360-pack")))).toMatch(/\?error=Leadership%20360%20runs%20anonymous%20360/);
    expect(await action(() => actions.usePack(form("made-up-pack")))).toMatch(/\?error=That%20template%20pack/);
    expect(sql(`SELECT count(*) FROM public.templates WHERE organization_id='${freeloader.org}' AND settings ? 'marketplace_pack'`)).toBe("0");

    // Purchases can't be self-recorded through the API: only the service role may call the RPC.
    signIn(freeloader.user);
    const direct = await createSupabase(session.url, session.anon, {
      auth: { persistSession: false },
      global: { headers: { Authorization: `Bearer ${session.token}` } },
    }).rpc("record_template_purchase", { p_organization_id: freeloader.org, p_pack_slug: "smcr-fitness-propriety-pack", p_session: "cs_fake", p_amount: 0, p_currency: "gbp" });
    expect(direct.error).not.toBeNull();
    expect(sql(`SELECT count(*) FROM private.template_purchases WHERE organization_id='${freeloader.org}'`)).toBe("0");

    // A signed-in member who isn't an admin of any workspace is refused outright.
    const outsider = { id: randomUUID(), email: "outsider@example.test" };
    sql(`INSERT INTO auth.users(id,email) VALUES('${outsider.id}','${outsider.email}');`);
    signIn(outsider);
    await expect(actions.usePack(form("smcr-fitness-propriety-pack"))).rejects.toThrow("not_org_admin");
  });
});
