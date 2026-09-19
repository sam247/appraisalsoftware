import { redirect } from "next/navigation";

/** Legacy /app bookmarks → /dashboard */
export default function LegacyAppRedirect({
  params,
}: {
  params?: Promise<Record<string, string>>;
}) {
  void params;
  redirect("/dashboard");
}
