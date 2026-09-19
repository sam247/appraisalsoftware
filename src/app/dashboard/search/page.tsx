import { requireOrgAdmin } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import type { Campaign, Person, Template } from "@/lib/types/database";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  let orgAdmin;
  try {
    orgAdmin = await requireOrgAdmin();
  } catch {
    redirect("/login");
  }

  const { q: raw } = await searchParams;
  const q = (raw ?? "").trim().replace(/[%_,."'\\]/g, " ").replace(/\s+/g, " ").trim();
  if (!q) redirect("/dashboard");

  const supabase = await createClient();
  const pattern = `%${q}%`;

  const [peopleResult, campaignsResult, templatesResult] = await Promise.all([
    supabase
      .from("people")
      .select("id, full_name, email, job_title")
      .eq("organization_id", orgAdmin.org.id)
      .is("archived_at", null)
      .or(`full_name.ilike."${pattern}",email.ilike."${pattern}"`)
      .order("full_name")
      .limit(20),
    supabase
      .from("campaigns")
      .select("id, name, status")
      .eq("organization_id", orgAdmin.org.id)
      .neq("status", "archived")
      .ilike("name", pattern)
      .order("created_at", { ascending: false })
      .limit(20),
    supabase
      .from("templates")
      .select("id, name, description")
      .eq("organization_id", orgAdmin.org.id)
      .is("archived_at", null)
      .or(`name.ilike."${pattern}",description.ilike."${pattern}"`)
      .order("name")
      .limit(20),
  ]);

  const people = (peopleResult.data ?? []) as Pick<
    Person,
    "id" | "full_name" | "email" | "job_title"
  >[];
  const campaigns = (campaignsResult.data ?? []) as Pick<
    Campaign,
    "id" | "name" | "status"
  >[];
  const templates = (templatesResult.data ?? []) as Pick<
    Template,
    "id" | "name" | "description"
  >[];
  const total = people.length + campaigns.length + templates.length;

  return (
    <div>
      <h1 className="text-xl font-medium tracking-tight">
        Search
      </h1>
      <p className="mt-0.5 text-xs text-muted-foreground">
        Results for &ldquo;{q}&rdquo;
        {total === 0 ? " — nothing matched." : ` · ${total} found`}
      </p>

      {campaigns.length > 0 && (
        <section className="mt-6">
          <h2 className="mb-2 text-sm font-semibold">Campaigns</h2>
          <div className="divide-y divide-border rounded-xl border border-border bg-card">
            {campaigns.map((c) => (
              <Link
                key={c.id}
                href={`/dashboard/campaigns/${c.id}`}
                className="flex items-center justify-between px-4 py-2.5 text-sm hover:bg-surface"
              >
                <span className="font-medium">{c.name}</span>
                <span className="text-xs capitalize text-muted-foreground">
                  {c.status}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {people.length > 0 && (
        <section className="mt-6">
          <h2 className="mb-2 text-sm font-semibold">People</h2>
          <div className="divide-y divide-border rounded-xl border border-border bg-card">
            {people.map((p) => (
              <Link
                key={p.id}
                href="/dashboard/people"
                className="block px-4 py-2.5 text-sm hover:bg-surface"
              >
                <p className="font-medium">{p.full_name ?? p.email}</p>
                <p className="text-xs text-muted-foreground">
                  {p.email}
                  {p.job_title ? ` · ${p.job_title}` : ""}
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {templates.length > 0 && (
        <section className="mt-6">
          <h2 className="mb-2 text-sm font-semibold">Templates</h2>
          <div className="divide-y divide-border rounded-xl border border-border bg-card">
            {templates.map((t) => (
              <Link
                key={t.id}
                href={`/dashboard/templates/${t.id}`}
                className="block px-4 py-2.5 text-sm hover:bg-surface"
              >
                <p className="font-medium">{t.name}</p>
                {t.description && (
                  <p className="text-xs text-muted-foreground">{t.description}</p>
                )}
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
