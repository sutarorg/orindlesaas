"use client";

import { useState } from "react";
import { LoaderCircle, MailCheck } from "lucide-react";
import { AuthAlert } from "@/components/auth/auth-alert";
import { AuthFormField } from "@/components/auth/auth-form-field";
import { focusFirstInvalidField } from "@/components/auth/focus-first-invalid";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { validateEmailRequest, type ValidationErrors } from "@/lib/auth/validation";
import { authenticationService } from "@/lib/auth/supabase-service";

export function VerificationForm() {
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState<ValidationErrors<"email">>({});
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const nextErrors = validateEmailRequest(email);
    setErrors(nextErrors);
    setResult(null);
    if (Object.keys(nextErrors).length > 0) {
      focusFirstInvalidField(form);
      return;
    }
    setPending(true);
    try {
      const response = await authenticationService.requestEmailVerification({ email: email.trim() });
      setResult(response.message);
    } catch {
      setResult("The verification request could not be reached. No email delivery was confirmed; try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate aria-busy={pending} className="mt-6">
      <AuthFormField id="verification-email" label="Email address" error={errors.email} hint="Enter the email you would use for a new verification request.">
        {(control) => <Input {...control} name="email" type="email" autoComplete="email" inputMode="email" placeholder="you@example.com" value={email} onChange={(event) => { setEmail(event.target.value); setErrors({}); }} />}
      </AuthFormField>
      <Button type="submit" variant="secondary" className="mt-5 w-full" disabled={pending}>
        {pending ? <LoaderCircle aria-hidden="true" className="animate-spin" /> : <MailCheck aria-hidden="true" />}
        {pending ? "Requesting verification…" : "Request verification email"}
      </Button>
      <div>
        {result && <AuthAlert tone="info" title="Verification request status" body={result} className="mt-5" />}
      </div>
    </form>
  );
}
