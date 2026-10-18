"use client";

import { Logo, BrandMark } from "@/components/home/Logo";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasSession, setHasSession] = useState<boolean | null>(null);

  useEffect(() => {
    createClient()
      .auth.getUser()
      .then(({ data }) => setHasSession(Boolean(data.user)));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) {
      setError("Use at least 8 characters.");
      return;
    }
    setLoading(true);
    setError(null);
    const { error: updateError } = await createClient().auth.updateUser({ password });
    if (updateError) {
      setError(
        /different from the old/i.test(updateError.message)
          ? "Choose a password you haven't used before."
          : "We couldn't update your password. Request a new reset link and try again.",
      );
      setLoading(false);
      return;
    }
    router.push(`/dashboard?ok=${encodeURIComponent("Password updated — you're signed in")}`);
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
            Choose a new password
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            You&apos;ll be signed in straight after.
          </p>
        </div>

        {hasSession === false ? (
          <div className="space-y-4 text-center text-sm text-muted-foreground">
            <p>This reset link has expired or was already used.</p>
            <Button asChild className="w-full">
              <Link href="/forgot-password">Send a new link</Link>
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div role="alert" className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                {error}
              </div>
            )}
            <div className="space-y-1.5">
              <label htmlFor="password" className="block text-sm font-medium text-foreground">
                New password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={show ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  minLength={8}
                  autoFocus
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full field pr-10"
                  placeholder="At least 8 characters"
                />
                <button
                  type="button"
                  onClick={() => setShow((v) => !v)}
                  aria-label={show ? "Hide password" : "Show password"}
                  className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-muted-foreground hover:text-foreground"
                >
                  {show ? <EyeOff className="size-4" aria-hidden /> : <Eye className="size-4" aria-hidden />}
                </button>
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={loading || hasSession === null}>
              {loading ? "Saving…" : "Save password and sign in"}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
