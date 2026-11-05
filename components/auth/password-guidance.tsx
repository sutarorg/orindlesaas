import { KeyRound } from "lucide-react";
import { getPasswordGuidance } from "@/lib/auth/validation";

export function PasswordGuidance({ password }: { password: string }) {
  return (
    <p className="m-0 flex items-start gap-2">
      <KeyRound aria-hidden="true" className="mt-0.5 size-3.5 shrink-0 text-teal" />
      <span>{getPasswordGuidance(password)}</span>
    </p>
  );
}
