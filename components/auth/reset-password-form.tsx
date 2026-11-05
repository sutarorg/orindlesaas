"use client";

import { useState } from "react";
import { LoaderCircle, KeyRound } from "lucide-react";
import { AuthAlert } from "@/components/auth/auth-alert";
import { AuthFormField } from "@/components/auth/auth-form-field";
import { focusFirstInvalidField } from "@/components/auth/focus-first-invalid";
import { PasswordGuidance } from "@/components/auth/password-guidance";
import { PasswordInput } from "@/components/auth/password-input";
import { Button } from "@/components/ui/button";
import { validatePasswordUpdate, type PasswordUpdateField, type ValidationErrors } from "@/lib/auth/validation";
import { authenticationService } from "@/lib/auth/supabase-service";

export function ResetPasswordForm() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<ValidationErrors<PasswordUpdateField>>({});
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  function clearError(field: PasswordUpdateField) {
    setErrors((current) => ({ ...current, [field]: undefined }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const nextErrors = validatePasswordUpdate({ password, confirmPassword });
    setErrors(nextErrors);
    setResult(null);
    if (Object.keys(nextErrors).length > 0) {
      focusFirstInvalidField(form);
      return;
    }
    setPending(true);
    try {
      const response = await authenticationService.updatePassword({ password, confirmPassword });
      setResult(response.message);
    } catch {
      setResult("The password update could not be reached. No change was confirmed; try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate aria-busy={pending}>
      <div className="space-y-5">
        <AuthFormField id="reset-password" label="New password" error={errors.password} hint={<PasswordGuidance password={password} />}>
          {(control) => <PasswordInput {...control} name="password" autoComplete="new-password" placeholder="A short phrase works well" value={password} onChange={(event) => { setPassword(event.target.value); clearError("password"); }} />}
        </AuthFormField>
        <AuthFormField id="reset-confirm-password" label="Confirm new password" error={errors.confirmPassword} hint="Enter the same new password again.">
          {(control) => <PasswordInput {...control} name="confirmPassword" autoComplete="new-password" placeholder="Repeat your new password" value={confirmPassword} onChange={(event) => { setConfirmPassword(event.target.value); clearError("confirmPassword"); }} />}
        </AuthFormField>
      </div>
      <Button type="submit" size="lg" className="mt-6 w-full" disabled={pending}>
        {pending ? <LoaderCircle aria-hidden="true" className="animate-spin" /> : <KeyRound aria-hidden="true" />}
        {pending ? "Updating password…" : "Update password"}
      </Button>
      <div>
        {result && <AuthAlert tone="info" title="Password update status" body={result} className="mt-5" />}
      </div>
    </form>
  );
}
