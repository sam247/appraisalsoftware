import { redirect } from "next/navigation";

type Props = { params: Promise<{ path?: string[] }> };

/** Catch-all so /app/campaigns etc. land on /dashboard/... */
export default async function LegacyAppCatchAll({ params }: Props) {
  const { path } = await params;
  const suffix = path?.length ? `/${path.join("/")}` : "";
  redirect(`/dashboard${suffix}`);
}
