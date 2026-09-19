"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Logo, BrandMark } from "@/components/home/Logo";

export default function SignupPage() {
  const [fullName, setFullName] = useState("");
  const [orgName, setOrgName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();

    // 1. Sign up — profile row comes from on_auth_user_created.
    // Hosted Confirm Email may omit a session; continue via password sign-in.
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });

    const alreadyRegistered =
      !!signUpError &&
      /already\s+(been\s+)?registered|already exists|user already/i.test(
        signUpError.message,
      );

    if (signUpError && !alreadyRegistered) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    // 2. Ensure a JWT for bootstrap (reuse signup session when present).
    if (!signUpData?.session) {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (signInError) {
        setError(
          /email not confirmed/i.test(signInError.message)
            ? "Your email still needs confirming. Refresh and try again, or contact support."
            : signInError.message,
        );
        setLoading(false);
        return;
      }
    }

    // 3. Bootstrap org (creates org + owner membership + copies builtin templates)
    const { error: rpcError } = await supabase.rpc("bootstrap_organization", {
      p_name: orgName,
    });

    if (rpcError) {
      const msg = /already belongs to an organisation|already_has_org/i.test(
        rpcError.message,
      )
        ? "You already belong to an organisation. Sign in instead."
        : rpcError.message;
      setError(msg);
      setLoading(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <Link href="/" className="mb-8 flex flex-col items-center gap-3" aria-label="appraisal.software home">
            <BrandMark size={56} />
            <Logo size="lg" />
          </Link>
          <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground">
            Create your account
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Set up your appraisal workspace in seconds
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
              htmlFor="full_name"
              className="block text-sm font-medium text-foreground"
            >
              Your full name
            </label>
            <input
              id="full_name"
              type="text"
              autoComplete="name"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full rounded-lg border border-input bg-card px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="Alex Johnson"
            />
          </div>

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

          <div className="space-y-1.5">
            <label
              htmlFor="email"
              className="block text-sm font-medium text-foreground"
            >
              Work email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-input bg-card px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="you@company.com"
            />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="password"
              className="block text-sm font-medium text-foreground"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-input bg-card px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="Min 8 characters"
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Setting up…" : "Create account"}
          </Button>

          <p className="text-center text-xs text-muted-foreground">
            By signing up you agree to our{" "}
            <a
              href="https://disclosurely.com/terms"
              className="underline hover:text-foreground"
              target="_blank"
              rel="noreferrer"
            >
              Terms
            </a>{" "}
            and{" "}
            <a
              href="https://disclosurely.com/privacy"
              className="underline hover:text-foreground"
              target="_blank"
              rel="noreferrer"
            >
              Privacy Policy
            </a>
            .
          </p>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
