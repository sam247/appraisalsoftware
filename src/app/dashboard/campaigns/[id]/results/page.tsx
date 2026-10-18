import FeedbackResults from "./feedback-results";
import AnnualResults from "./annual-results";
import { requireOrgAdmin } from "@/lib/auth/session";
import { redirect, notFound } from "next/navigation";
import { loadAnnualResults, loadCampaign, loadFeedback360Report } from "./data";

export default async function ResultsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  let orgAdmin;
  try {
    orgAdmin = await requireOrgAdmin();
  } catch {
    redirect("/login");
  }

  const campaign = await loadCampaign(id, orgAdmin.org.id);
  if (!campaign) notFound();

  if (campaign.campaign_type === "feedback_360")
    return (
      <FeedbackResults
        campaign={campaign}
        report={await loadFeedback360Report(campaign.id)}
        orgName={orgAdmin.org.name}
        orgLogoUrl={orgAdmin.org.logo_url}
      />
    );

  return (
    <AnnualResults
      campaign={campaign}
      data={await loadAnnualResults(id, orgAdmin.org.id)}
      orgName={orgAdmin.org.name}
      orgLogoUrl={orgAdmin.org.logo_url}
    />
  );
}
