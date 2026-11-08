import { cache } from "react";
import { requireUser } from "@/lib/server/auth/guards";
import { getWorkspaceSnapshot } from "@/lib/server/workspace/queries";

/**
 * Per-request memoisation for the dashboard's data dependencies.
 *
 * A layout and its page render in the same server request, so calling these directly in both
 * places ran the auth check and the whole 11-statement workspace snapshot twice for every single
 * view. React's `cache` shares one promise per request, so the layout keeps supplying the shell
 * data while each page still gets the same snapshot without touching the database again.
 */
export const getRequestUser = cache(async () => requireUser());

export const getRequestWorkspace = cache(async () => {
  const identity = await getRequestUser();
  return getWorkspaceSnapshot(identity.userId);
});
