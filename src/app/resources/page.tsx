import { ResourceHub } from "@/components/resources/ResourceHub";
import { pageMetadata } from "@/lib/metadata";
export const metadata = pageMetadata({ title: "Appraisal Resources, Guides and Examples | Appraisal Software", description: "Practical appraisal guides, employee answer examples, manager comments, objectives and 360 feedback resources for UK small teams.", path: "/resources" });
export default function Page() { return <ResourceHub />; }
