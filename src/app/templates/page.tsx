import { ResourceHub } from "@/components/resources/ResourceHub";
import { pageMetadata } from "@/lib/metadata";
export const metadata = pageMetadata({ title: "Free Appraisal Templates for UK Teams | Appraisal Software", description: "Free annual appraisal, self-assessment, probation, development plan and 360 feedback templates. Copy, print or save as PDF without an account.", path: "/templates" });
export default function Page() { return <ResourceHub templates />; }
