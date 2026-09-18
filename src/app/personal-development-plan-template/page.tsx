import { ResourcePage } from "@/components/resources/ResourcePage";
import { resourceBySlug } from "@/lib/resource-content";
import { pageMetadata } from "@/lib/metadata";

const resource = resourceBySlug("personal-development-plan-template");
export const metadata = pageMetadata({
  title: `${resource.title} | Appraisal Software`,
  description: resource.description,
  path: `/${resource.slug}`,
});

export default function Page() {
  return <ResourcePage resource={resource} />;
}
