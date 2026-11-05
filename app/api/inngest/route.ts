import { serve } from "inngest/next";
import { inngest } from "@/lib/server/jobs/outbox";
import { jobFunctions } from "@/lib/server/jobs/functions";

export const runtime = "nodejs";

const handler = serve({ client: inngest, functions: jobFunctions });

export { handler as GET, handler as POST, handler as PUT };
