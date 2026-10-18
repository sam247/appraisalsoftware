"use client";

import { Logo, BrandMark } from "@/components/home/Logo";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { MailCheck } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ForgotPasswordForm />
    </Suspense>
  );
}

function ForgotPasswordForm() {
  const expired = useSearchParams().get("expired") === "1";
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const supabase = createClient();
    // Same message whether or not the address has an account, so this page
    // can't be used to discover who is registered.
    await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
    });
    setSent(true);
    setLoading(false);
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
            {sent ? "Check your email" : "Reset your password"}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {sent
              ? `If ${email} has an account, we've sent a link to set a new password. It expires in an hour.`
              : "Enter your work email and we'll send you a link to choose a new one."}
          </p>
        </div>

        {sent ? (
          <div className="flex flex-col items-center gap-6">
            <span className="flex size-14 items-center justify-center rounded-2xl border border-border bg-card text-primary" aria-hidden>
              <MailCheck className="size-6" />
            </span>
            <p className="text-center text-sm text-muted-foreground">
              Nothing arrived? Check your spam folder, or{" "}
              <button type="button" onClick={() => setSent(false)} className="font-medium text-primary hover:underline">
                try another address
              </button>
              .
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {expired && (
              <div role="alert" className="rounded-lg border border-warning-foreground/20 bg-warning px-4 py-3 text-sm text-warning-foreground">
                That reset link has expired or was already used. Request a new one below.
              </div>
            )}
            <div className="space-y-1.5">
              <label htmlFor="email" className="block text-sm font-medium text-foreground">
                Work email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full field"
                placeholder="you@company.com"
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Sending…" : "Send reset link"}
            </Button>
          </form>
        )}

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Remembered it?{" "}
          <Link href="/login" className="font-medium text-primary hover:underline">
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
