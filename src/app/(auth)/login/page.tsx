"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Logo, BrandMark } from "@/components/home/Logo";

export default function LoginPage() {
  return <LoginForm />;
}

function friendlySignInError(message: string): string {
  if (/invalid login credentials/i.test(message))
    return "That email and password don't match. Check them, or reset your password.";
  if (/email not confirmed/i.test(message))
    return "Please confirm your email address first — check your inbox for the link.";
  if (/rate limit|too many/i.test(message))
    return "Too many attempts. Please wait a minute and try again.";
  return "We couldn't sign you in just now. Please try again.";
}

function LoginForm() {
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
    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError(friendlySignInError(authError.message));
      setLoading(false);
      return;
    }

    // Read next param synchronously from URL; same-site paths only.
    const params = new URLSearchParams(window.location.search);
    const requested = params.get("next");
    const next = requested?.startsWith("/") && !requested.startsWith("//") ? requested : "/dashboard";
    router.push(next);
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
            Sign in
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Welcome back to your appraisal workspace
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
              htmlFor="email"
              className="block text-sm font-medium text-foreground"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full field"
              placeholder="you@company.com"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-baseline justify-between">
              <label
                htmlFor="password"
                className="block text-sm font-medium text-foreground"
              >
                Password
              </label>
              <Link href="/forgot-password" className="text-xs font-medium text-primary hover:underline">
                Forgot password?
              </Link>
            </div>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full field"
              placeholder="••••••••"
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Signing in…" : "Sign in"}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          No account?{" "}
          <Link href="/signup" className="font-medium text-primary hover:underline">
            Start Free
          </Link>
        </p>
      </div>
    </div>
  );
}
