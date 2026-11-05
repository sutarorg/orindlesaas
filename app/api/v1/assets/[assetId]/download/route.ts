import { z } from "zod";
import { apiHandler, json } from "@/lib/server/http";
import { requireUser } from "@/lib/server/auth/guards";
import { createAssetDownload } from "@/lib/server/storage/r2";

export const runtime = "nodejs";

type Context = { params: Promise<{ assetId: string }> };

export async function GET(request: Request, context: Context) {
  const { assetId } = await context.params;
  const handler = apiHandler(async () => {
    const identity = await requireUser();
    const id = z.uuid().parse(assetId);
    return json(await createAssetDownload(identity.userId, id));
  });
  return handler(request);
}
