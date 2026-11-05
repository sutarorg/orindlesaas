import { GenerationStudio } from "@/components/dashboard/generation-studio";
import type { WorkspaceSnapshot } from "@/lib/server/workspace/queries";
export function NewWebsite({ data }: { data: WorkspaceSnapshot }) { return <GenerationStudio kind="website" data={data} />; }
