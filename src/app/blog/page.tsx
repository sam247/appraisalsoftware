import { BlogIndex } from "@/components/blog/BlogIndex";
import { pageMetadata } from "@/lib/metadata";
import { ROUTES } from "@/lib/routes";

export const metadata = pageMetadata({
  title: "Appraisal Blog | Practical Guidance for UK Teams | Appraisal Software",
  description:
    "Practical articles for managers and small HR teams on appraisals, performance conversations and review cycles.",
  path: ROUTES.blog,
});

export default function BlogPage() {
  return <BlogIndex />;
}
