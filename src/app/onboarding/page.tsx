"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Logo, BrandMark } from "@/components/home/Logo";

/**
 * Authenticated users without an organisation land here.
 * Fixes the /login ↔ /dashboard redirect loop that produced a white screen.
 */
export default function OnboardingPage() {
  const [orgName, setOrgName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.replace("/login");
      return;
    }

    const { error: rpcError } = await supabase.rpc("bootstrap_organization", {
      p_name: orgName,
    });

    if (rpcError) {
      if (/already belongs to an organisation|already_has_org/i.test(rpcError.message)) {
        router.replace("/dashboard");
        router.refresh();
        return;
      }
      setError(rpcError.message);
      setLoading(false);
      return;
    }

    router.replace("/dashboard");
    router.refresh();
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <Link
            href="/"
            className="mb-8 flex flex-col items-center gap-3"
            aria-label="appraisal.software home"
          >
            <BrandMark size={56} />
            <Logo size="lg" />
          </Link>
          <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground">
            Name your workspace
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Your account is ready. Create the organisation to open the dashboard.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            <label
              htmlFor="org_name"
              className="block text-sm font-medium text-foreground"
            >
              Organisation name
            </label>
            <input
              id="org_name"
              type="text"
              required
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              className="w-full rounded-lg border border-input bg-card px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="Acme Ltd"
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Creating…" : "Open dashboard"}
          </Button>
        </form>
      </div>
    </div>
  );
}
