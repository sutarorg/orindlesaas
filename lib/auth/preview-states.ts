export type AuthStateTone = "info" | "error" | "success";
export type AuthStateContent = {
  tone: AuthStateTone;
  title: string;
  body: string;
};

export function parsePackId(value: string | string[] | undefined) {
  const pack = typeof value === "string" ? value : undefined;
  return pack === "creator" || pack === "pro" || pack === "studio" ? pack : undefined;
}
