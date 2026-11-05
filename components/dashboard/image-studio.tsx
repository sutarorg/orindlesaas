import { GenerationStudio } from "@/components/dashboard/generation-studio";
import type { WorkspaceSnapshot } from "@/lib/server/workspace/queries";
export function ImageStudio({ data }: { data: WorkspaceSnapshot }) { return <GenerationStudio kind="image" data={data} />; }
