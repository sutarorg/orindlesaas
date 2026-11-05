import type { OAuthProvider } from "@/lib/contracts/authentication";

export type AuthStateTone = "info" | "error" | "success";
export type AuthStateContent = {
  tone: AuthStateTone;
  title: string;
  body: string;
};

const states = {
  "invalid-credentials": {
    tone: "error",
    title: "We couldn’t sign you in",
    body: "Those details didn’t match. Check your email and password, or use the password reset option. This is a presentation preview; no credentials were checked.",
  },
  "network-failure": {
    tone: "error",
    title: "The connection didn’t get through",
    body: "Check your connection and try again. Your details have not been submitted in this preview, so no network request was made.",
  },
  "session-expired": {
    tone: "info",
    title: "Your session has expired",
    body: "Sign in again to continue to your workspace. This is an expiry-state preview; no session existed or was cleared.",
  },
  "already-registered": {
    tone: "info",
    title: "Try another way to continue",
    body: "This email may already be registered. Try logging in or resetting your password. For privacy, the connected flow should avoid confirming account details here.",
  },
  "verification-required": {
    tone: "info",
    title: "Confirm your email to continue",
    body: "In the connected product, an eligible signup will receive a confirmation link. No account was created and no verification email was sent in this preview.",
  },
  "verification-success": {
    tone: "success",
    title: "Your email is verified",
    body: "Component preview: no email has been verified. In the connected flow, this confirmation appears only after the server verifies the email.",
  },
  "verification-expired": {
    tone: "error",
    title: "This verification link has expired",
    body: "Request a new confirmation email to continue. This is a presentation preview; no link was checked and no email was sent.",
  },
  "reset-expired": {
    tone: "error",
    title: "This reset link has expired",
    body: "Request a new password reset link to continue. This is a presentation preview; no link was checked and no password was changed.",
  },
  "callback-processing": {
    tone: "info",
    title: "Finishing your sign-in",
    body: "This is the callback processing-state layout. No authorization code was exchanged, no provider response was read and no session was created.",
  },
  "callback-error": {
    tone: "error",
    title: "We couldn’t complete sign-in",
    body: "Return to login and try again, or continue with your email. No authorization code was exchanged in this preview.",
  },
  "callback-cancelled": {
    tone: "info",
    title: "Sign-in was cancelled",
    body: "No account was accessed. You can return to login and choose another way to continue. This callback is only a presentation preview.",
  },
} as const satisfies Record<string, AuthStateContent>;

function single(value: string | string[] | undefined) {
  return typeof value === "string" ? value : undefined;
}

export function parseOAuthProvider(value: string | string[] | undefined): OAuthProvider {
  return single(value) === "github" ? "github" : "google";
}

export function parsePackId(value: string | string[] | undefined) {
  const pack = single(value);
  return pack === "creator" || pack === "pro" || pack === "studio" ? pack : undefined;
}

export function getLoginPreviewState(
  stateValue: string | string[] | undefined,
  providerValue?: string | string[],
): AuthStateContent | null {
  const state = single(stateValue);
  if (state === "oauth-cancelled") {
    const provider = parseOAuthProvider(providerValue);
    const name = provider === "github" ? "GitHub" : "Google";
    return {
      tone: "info",
      title: `${name} sign-in was cancelled`,
      body: `No account was accessed. You can try ${name} again or continue with email. This is a cancellation-state preview; no provider was contacted.`,
    };
  }
  if (state === "invalid-credentials" || state === "network-failure" || state === "session-expired") return states[state];
  return null;
}

export function getSignupPreviewState(value: string | string[] | undefined): AuthStateContent | null {
  const state = single(value);
  return state === "already-registered" || state === "verification-required" ? states[state] : null;
}

export function getVerificationPreviewState(value: string | string[] | undefined): AuthStateContent {
  const state = single(value);
  if (state === "success") return states["verification-success"];
  if (state === "expired") return states["verification-expired"];
  return {
    tone: "info",
    title: "Confirm your email",
    body: "In the connected product, use the link in your confirmation email to verify your address. No verification email was sent from this frontend preview.",
  };
}

export function getResetPreviewState(value: string | string[] | undefined): AuthStateContent | null {
  return single(value) === "expired" ? states["reset-expired"] : null;
}

export function getCallbackPreviewState(value: string | string[] | undefined): AuthStateContent {
  const state = single(value);
  if (state === "error") return states["callback-error"];
  if (state === "cancelled") return states["callback-cancelled"];
  return states["callback-processing"];
}
