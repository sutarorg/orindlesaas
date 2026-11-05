"use client";

import { useState } from "react";
import Link from "next/link";
import { LoaderCircle, Sparkles, UserRoundPlus } from "lucide-react";
import { AuthAlert } from "@/components/auth/auth-alert";
import { AuthFormField } from "@/components/auth/auth-form-field";
import { focusFirstInvalidField } from "@/components/auth/focus-first-invalid";
import { PasswordGuidance } from "@/components/auth/password-guidance";
import { PasswordInput } from "@/components/auth/password-input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import type { AuthStateContent } from "@/lib/auth/preview-states";
import { validateSignUp, type SignUpField, type ValidationErrors } from "@/lib/auth/validation";
import type { CreditPack } from "@/lib/content/pricing";
import { formatNumber } from "@/lib/utils";
import { authenticationService } from "@/lib/auth/supabase-service";

export function SignupForm({ initialState, pack }: { initialState: AuthStateContent | null; pack?: CreditPack }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [errors, setErrors] = useState<ValidationErrors<SignUpField>>({});
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  function clearError(field: SignUpField) {
    setErrors((current) => ({ ...current, [field]: undefined }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const request = { name, email, password, confirmPassword, acceptedTerms };
    const nextErrors = validateSignUp(request);
    setErrors(nextErrors);
    setResult(null);
    if (Object.keys(nextErrors).length > 0) {
      focusFirstInvalidField(form);
      return;
    }
    setPending(true);
    try {
      const response = await authenticationService.signUp({ ...request, name: name.trim(), email: email.trim(), packId: pack?.id });
      setResult(response.message);
    } catch {
      setResult("Account creation could not be reached. No account was confirmed; try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div>
      {initialState && <AuthAlert {...initialState} className="mb-6" />}
      {pack && (
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-teal/15 bg-[#f1f9f5] p-4">
          <Sparkles aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-teal" />
          <div>
            <p className="m-0 text-sm font-semibold text-ink">{pack.name} selected for later</p>
            <p className="mb-0 mt-1 text-xs leading-5 text-body">{formatNumber(pack.credits)} credits · ${pack.priceUsd} one-time. No payment or entitlement is created here.</p>
          </div>
        </div>
      )}
      <form onSubmit={handleSubmit} noValidate aria-busy={pending}>
        <div className="space-y-5">
          <AuthFormField id="signup-name" label="Full name" error={errors.name}>
            {(control) => <Input {...control} name="name" autoComplete="name" placeholder="Your name" value={name} onChange={(event) => { setName(event.target.value); clearError("name"); }} />}
          </AuthFormField>
          <AuthFormField id="signup-email" label="Email address" error={errors.email}>
            {(control) => <Input {...control} name="email" type="email" autoComplete="email" inputMode="email" placeholder="you@example.com" value={email} onChange={(event) => { setEmail(event.target.value); clearError("email"); }} />}
          </AuthFormField>
          <AuthFormField id="signup-password" label="Create a password" error={errors.password} hint={<PasswordGuidance password={password} />}>
            {(control) => <PasswordInput {...control} name="password" autoComplete="new-password" placeholder="A short phrase works well" value={password} onChange={(event) => { setPassword(event.target.value); clearError("password"); }} />}
          </AuthFormField>
          <AuthFormField id="signup-confirm-password" label="Confirm password" error={errors.confirmPassword} hint="Enter the same password again.">
            {(control) => <PasswordInput {...control} name="confirmPassword" autoComplete="new-password" placeholder="Repeat your password" value={confirmPassword} onChange={(event) => { setConfirmPassword(event.target.value); clearError("confirmPassword"); }} />}
          </AuthFormField>
        </div>
        <div className="mt-5">
          <div className="flex items-start gap-3 rounded-lg py-1 text-sm leading-6 text-body">
            <Checkbox id="signup-terms" name="acceptedTerms" required checked={acceptedTerms} onChange={(event) => { setAcceptedTerms(event.target.checked); clearError("terms"); }} aria-invalid={Boolean(errors.terms)} aria-describedby={errors.terms ? "signup-terms-error" : undefined} />
            <div>
              <label htmlFor="signup-terms" className="cursor-pointer">I agree to the </label>
              <Link href="/terms" className="font-semibold text-teal-dark no-underline hover:text-ink focus-visible:ring-2 focus-visible:ring-teal">Terms</Link>
              <span> and </span>
              <Link href="/privacy" className="font-semibold text-teal-dark no-underline hover:text-ink focus-visible:ring-2 focus-visible:ring-teal">Privacy Policy</Link>.
            </div>
          </div>
          {errors.terms && <p id="signup-terms-error" className="mb-0 ml-8 mt-2 text-xs leading-5 text-error">{errors.terms}</p>}
        </div>
        <Button type="submit" size="lg" className="mt-6 w-full" disabled={pending}>
          {pending ? <LoaderCircle aria-hidden="true" className="animate-spin" /> : <UserRoundPlus aria-hidden="true" />}
          {pending ? "Creating account…" : "Create account"}
        </Button>
        <div>
          {result && <AuthAlert tone="info" title="Sign-up status" body={result} className="mt-5" />}
        </div>
      </form>
    </div>
  );
}
