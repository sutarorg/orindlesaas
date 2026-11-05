"use client";

import { useState } from "react";
import { LoaderCircle, MailCheck } from "lucide-react";
import { AuthAlert } from "@/components/auth/auth-alert";
import { AuthFormField } from "@/components/auth/auth-form-field";
import { focusFirstInvalidField } from "@/components/auth/focus-first-invalid";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { validateEmailRequest, type ValidationErrors } from "@/lib/auth/validation";
import { mockAuthenticationService } from "@/lib/mocks/authentication-preview";

export function ForgotPasswordForm() {
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
    const response = await mockAuthenticationService.requestPasswordReset({ email: email.trim() });
    setResult(response.message);
    setPending(false);
  }

  return (
    <form onSubmit={handleSubmit} noValidate aria-busy={pending}>
      <AuthFormField id="forgot-email" label="Email address" error={errors.email} hint="The connected service will use a generic response to protect account privacy.">
        {(control) => <Input {...control} name="email" type="email" autoComplete="email" inputMode="email" placeholder="you@example.com" value={email} onChange={(event) => { setEmail(event.target.value); setErrors({}); }} />}
      </AuthFormField>
      <Button type="submit" size="lg" className="mt-6 w-full" disabled={pending}>
        {pending ? <LoaderCircle aria-hidden="true" className="animate-spin" /> : <MailCheck aria-hidden="true" />}
        {pending ? "Checking locally…" : "Request reset link"}
      </Button>
      <div>
        {result && <AuthAlert tone="info" title="Reset request preview" body={result} className="mt-5" />}
      </div>
    </form>
  );
}
