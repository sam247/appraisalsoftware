import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { OrganizationInvitation } from "@/lib/types/database";

type InvitationWithOrg = OrganizationInvitation & {
  organizations: { name: string };
};

export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Find invitation by token hash
  const { data: rawInvitation } = await supabase
    .from("organization_invitations")
    .select("*, organizations(name)")
    .eq("token_hash", token)
    .is("accepted_at", null)
    .is("revoked_at", null)
    .gt("expires_at", new Date().toISOString())
    .single();

  const invitation = rawInvitation as unknown as InvitationWithOrg | null;

  if (!invitation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface px-4">
        <div className="text-center max-w-sm">
          <h1 className="font-display text-2xl font-semibold text-foreground">
            Invitation not found
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            This invite link may have expired or already been used.
          </p>
          <div className="mt-6">
            <Button asChild>
              <Link href="/login">Go to sign in</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Not logged in — send to login with redirect back
  if (!user) {
    redirect(`/login?next=/invite/${token}`);
  }

  // Accept the invitation
  const { error: acceptError } = await supabase
    .from("organization_invitations")
    .update({ accepted_at: new Date().toISOString() })
    .eq("id", invitation.id);

  if (!acceptError) {
    await supabase.from("organization_members").insert({
      organization_id: invitation.organization_id,
      user_id: user.id,
      role: invitation.role,
      invited_by: invitation.invited_by ?? undefined,
    });
  }

  redirect("/app");
}
