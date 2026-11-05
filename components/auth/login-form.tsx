"use client";

import { useState } from "react";
import Link from "next/link";
import { LoaderCircle, LogIn } from "lucide-react";
import { AuthAlert } from "@/components/auth/auth-alert";
import { AuthFormField } from "@/components/auth/auth-form-field";
import { focusFirstInvalidField } from "@/components/auth/focus-first-invalid";
import { PasswordInput } from "@/components/auth/password-input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import type { AuthStateContent } from "@/lib/auth/preview-states";
import { validateLogin, type LoginField, type ValidationErrors } from "@/lib/auth/validation";
import { mockAuthenticationService } from "@/lib/mocks/authentication-preview";

export function LoginForm({ initialState }: { initialState: AuthStateContent | null }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [errors, setErrors] = useState<ValidationErrors<LoginField>>({});
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  function clearError(field: LoginField) {
    setErrors((current) => ({ ...current, [field]: undefined }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const nextErrors = validateLogin({ email, password });
    setErrors(nextErrors);
    setResult(null);
    if (Object.keys(nextErrors).length > 0) {
      focusFirstInvalidField(form);
      return;
    }
    setPending(true);
    const response = await mockAuthenticationService.signIn({ email: email.trim(), password, rememberMe });
    setResult(response.message);
    setPending(false);
  }

  return (
    <div>
      {initialState && <AuthAlert {...initialState} className="mb-6" />}
      <form onSubmit={handleSubmit} noValidate aria-busy={pending}>
        <div className="space-y-5">
          <AuthFormField id="login-email" label="Email address" error={errors.email}>
            {(control) => <Input {...control} name="email" type="email" autoComplete="email" inputMode="email" placeholder="you@example.com" value={email} onChange={(event) => { setEmail(event.target.value); clearError("email"); }} />}
          </AuthFormField>
          <AuthFormField id="login-password" label="Password" error={errors.password} labelAction={<Link href="/forgot-password" className="inline-flex min-h-11 items-center rounded-md text-xs font-semibold text-teal-dark no-underline outline-none hover:text-ink focus-visible:ring-2 focus-visible:ring-teal">Forgot password?</Link>}>
            {(control) => <PasswordInput {...control} name="password" autoComplete="current-password" placeholder="Your password" value={password} onChange={(event) => { setPassword(event.target.value); clearError("password"); }} />}
          </AuthFormField>
        </div>
        <div className="mt-4">
          <label htmlFor="login-remember" className="flex min-h-11 cursor-pointer items-start gap-3 rounded-lg py-2 text-sm text-body">
            <Checkbox id="login-remember" name="rememberMe" checked={rememberMe} onChange={(event) => setRememberMe(event.target.checked)} aria-describedby="login-remember-hint" />
            <span>Keep me logged in on this device</span>
          </label>
          <p id="login-remember-hint" className="mb-0 ml-8 text-[11px] leading-5 text-muted">Use only on a private device. This preview does not store the choice.</p>
        </div>
        <Button type="submit" size="lg" className="mt-6 w-full" disabled={pending}>
          {pending ? <LoaderCircle aria-hidden="true" className="animate-spin" /> : <LogIn aria-hidden="true" />}
          {pending ? "Checking locally…" : "Log in"}
        </Button>
        <div>
          {result && <AuthAlert tone="info" title="Login preview" body={result} className="mt-5" />}
        </div>
      </form>
    </div>
  );
}
