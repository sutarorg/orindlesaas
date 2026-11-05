import { GenerationStudio } from "@/components/dashboard/generation-studio";
import type { WorkspaceSnapshot } from "@/lib/server/workspace/queries";
export function VideoStudio({ data }: { data: WorkspaceSnapshot }) { return <GenerationStudio kind="video" data={data} />; }
