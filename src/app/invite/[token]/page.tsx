import { createHash } from "node:crypto";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Logo, BrandMark } from "@/components/home/Logo";

type InvitationPreview = {
  email: string;
  orgName: string;
  valid: boolean;
};

/** Read-only preview for whoever holds the link: which workspace, which email. */
async function previewInvitation(rawToken: string): Promise<InvitationPreview | null> {
  if (!/^[0-9a-f]{64}$/i.test(rawToken)) return null;
  const hash = createHash("sha256").update(rawToken.trim()).digest("hex");
  const { data } = await createServiceClient()
    .from("organization_invitations")
    .select("email, accepted_at, revoked_at, expires_at, organizations(name)")
    .eq("token_hash", hash)
    .maybeSingle();
  if (!data) return null;
  const row = data as unknown as {
    email: string;
    accepted_at: string | null;
    revoked_at: string | null;
    expires_at: string;
    organizations: { name: string } | null;
  };
  return {
    email: row.email,
    orgName: row.organizations?.name ?? "your team",
    valid: !row.accepted_at && !row.revoked_at && new Date(row.expires_at) > new Date(),
  };
}

function Shell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-surface px-4">
      <div className="w-full max-w-sm text-center">
        <Link href="/" className="mb-8 flex flex-col items-center gap-3" aria-label="appraisal.software home">
          <BrandMark size={56} />
          <Logo size="lg" />
        </Link>
        <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground text-balance">{title}</h1>
        {children}
      </div>
    </div>
  );
}

export default async function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const invitation = await previewInvitation(token);

  if (!invitation || !invitation.valid) {
    return (
      <Shell title="This invitation has expired">
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Invitations last 14 days and work once. Ask the admin who invited you to send a new one.
        </p>
        <Button asChild className="mt-6">
          <Link href="/login">Go to sign in</Link>
        </Button>
      </Shell>
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const next = encodeURIComponent(`/invite/${token}`);
    return (
      <Shell title={`Join ${invitation.orgName}`}>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          You&apos;ve been invited to help run appraisals for <strong className="text-foreground">{invitation.orgName}</strong> as an admin.
          The invitation is for <strong className="text-foreground">{invitation.email}</strong>.
        </p>
        <div className="mt-6 space-y-2">
          <Button asChild className="w-full">
            <Link href={`/signup?invite=${token}&email=${encodeURIComponent(invitation.email)}`}>Create your account</Link>
          </Button>
          <Button asChild variant="outline" className="w-full">
            <Link href={`/login?next=${next}`}>I already have an account</Link>
          </Button>
        </div>
      </Shell>
    );
  }

  const { error } = await supabase.rpc("accept_organization_invitation", { p_raw_token: token });
  if (!error) redirect(`/dashboard?ok=${encodeURIComponent(`Welcome to ${invitation.orgName}`)}`);

  const mismatch = /does not match/i.test(error.message);
  const otherWorkspace = /already|another organi[sz]ation|member of/i.test(error.message);
  return (
    <Shell title={mismatch ? "Wrong account" : "We couldn't add you"}>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
        {mismatch
          ? `You're signed in as ${user.email}, but this invitation is for ${invitation.email}. Sign out, then open the link again.`
          : otherWorkspace
            ? `${user.email} already belongs to a different workspace. Ask the admin to invite another email address.`
            : "Something went wrong accepting the invitation. Please open the link again in a moment."}
      </p>
      {mismatch ? (
        <form action="/logout" method="POST" className="mt-6">
          <Button type="submit" className="w-full">Sign out</Button>
        </form>
      ) : (
        <Button asChild variant="outline" className="mt-6">
          <Link href="/dashboard">Go to my workspace</Link>
        </Button>
      )}
    </Shell>
  );
}
