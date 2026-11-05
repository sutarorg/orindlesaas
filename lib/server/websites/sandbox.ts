import Sandbox from "e2b";
import { requireEnvironment } from "@/lib/server/env";
import type { WebsiteSourceFile } from "@/lib/server/websites/source";

export async function validateWebsiteInSandbox(files: WebsiteSourceFile[]) {
  const { E2B_API_KEY: apiKey } = requireEnvironment(["E2B_API_KEY"], "E2B website validation");
  const sandbox = await Sandbox.create({
    apiKey,
    timeoutMs: 120_000,
    requestTimeoutMs: 20_000,
    allowInternetAccess: false,
    network: { allowPublicTraffic: false },
    envs: {},
    metadata: { purpose: "orindle-static-validation" },
  });
  try {
    await sandbox.files.makeDir("/home/user/site", { requestTimeoutMs: 20_000 });
    await sandbox.files.write(files.map((file) => ({ path: `/home/user/site/${file.path}`, data: file.content })), { requestTimeoutMs: 20_000 });
    const scriptCheck = files.some((file) => file.path === "script.js") ? "node --check script.js && " : "";
    const result = await sandbox.commands.run(`${scriptCheck}test -s index.html && test -s styles.css`, {
      cwd: "/home/user/site",
      timeoutMs: 15_000,
      requestTimeoutMs: 20_000,
      envs: {},
    });
    return {
      passed: result.exitCode === 0,
      diagnostics: {
        exitCode: result.exitCode,
        error: result.error?.slice(0, 300),
        stderr: result.stderr?.slice(0, 500),
      },
    };
  } finally {
    await sandbox.kill({ requestTimeoutMs: 10_000 }).catch(() => false);
  }
}
