import type {
  AuthCallbackRequest,
  AuthenticationErrorCode,
  AuthenticationOperation,
  AuthenticationResult,
  AuthenticationService,
  EmailVerificationRequest,
  OAuthRequest,
  OAuthStartResult,
  PasswordResetRequest,
  PasswordUpdateRequest,
  RouteAccessRequest,
  RouteAccessResult,
  SessionSnapshot,
  SignInRequest,
  SignUpRequest,
} from "@/lib/contracts/authentication";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import {
  AUTH_SESSION_POLICY_COOKIE,
  DEFAULT_SESSION_MAX_AGE,
  PERSISTENT_SESSION_MAX_AGE,
} from "@/lib/supabase/config";

function success(operation: AuthenticationOperation, next: Extract<AuthenticationResult, { status: "success" }>["next"], message: string): AuthenticationResult {
  return { status: "success", operation, next, message };
}

function failure(operation: AuthenticationOperation, code: AuthenticationErrorCode, message: string): Extract<AuthenticationResult, { status: "error" }> {
  return { status: "error", operation, error: { code }, message };
}

function unavailable(operation: AuthenticationOperation): Extract<AuthenticationResult, { status: "error" }> {
  return failure(operation, "unavailable", "Authentication is not configured. No account or session change was made.");
}

function providerErrorCode(error: unknown): AuthenticationErrorCode {
  const code = typeof error === "object" && error && "code" in error ? String(error.code) : "";
  if (code === "invalid_credentials") return "invalid_credentials";
  if (code === "email_not_confirmed") return "verification_required";
  if (code.includes("rate_limit")) return "rate_limited";
  if (code.includes("expired") || code.includes("invalid")) return "session_expired";
  return "network_failure";
}

export class SupabaseAuthenticationService implements AuthenticationService {
  private setSessionPolicy(persistent: boolean) {
    const maxAge = persistent ? PERSISTENT_SESSION_MAX_AGE : DEFAULT_SESSION_MAX_AGE;
    const secure = window.location.protocol === "https:" ? "; Secure" : "";
    document.cookie = `${AUTH_SESSION_POLICY_COOKIE}=${persistent ? "persistent" : "default"}; Path=/; Max-Age=${maxAge}; SameSite=Lax${secure}`;
    return maxAge;
  }

  async signUp(request: SignUpRequest): Promise<AuthenticationResult> {
    const client = createSupabaseBrowserClient();
    if (!client) return unavailable("signup");
    const { error } = await client.auth.signUp({
      email: request.email,
      password: request.password,
      options: {
        data: { name: request.name, accepted_terms: request.acceptedTerms, selected_pack: request.packId ?? null },
        emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent("/app")}`,
      },
    });
    if (error) return failure("signup", providerErrorCode(error), "We could not start account creation. Try again or use another sign-in method.");
    return success("signup", "verify-email", "Check your inbox to verify your email. No credits are added by account creation.");
  }

  async signIn(request: SignInRequest): Promise<AuthenticationResult> {
    const maxAge = request.rememberMe ? PERSISTENT_SESSION_MAX_AGE : DEFAULT_SESSION_MAX_AGE;
    const client = createSupabaseBrowserClient(maxAge);
    if (!client) return unavailable("login");
    this.setSessionPolicy(request.rememberMe);
    const { error } = await client.auth.signInWithPassword({ email: request.email, password: request.password });
    if (error) {
      const code = providerErrorCode(error);
      const message = code === "verification_required"
        ? "Verify your email before logging in."
        : code === "rate_limited"
          ? "Too many attempts. Wait before trying again."
          : "The email or password was not accepted.";
      return failure("login", code, message);
    }
    return success("login", "dashboard", "You are logged in. Opening your workspace…");
  }

  async signOut(): Promise<AuthenticationResult> {
    const client = createSupabaseBrowserClient();
    if (!client) return unavailable("logout");
    const { error } = await client.auth.signOut();
    if (error) return failure("logout", "network_failure", "Sign-out could not be confirmed. Try again.");
    document.cookie = `${AUTH_SESSION_POLICY_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`;
    return success("logout", "home", "You have been signed out.");
  }

  async requestPasswordReset(request: PasswordResetRequest): Promise<AuthenticationResult> {
    const client = createSupabaseBrowserClient();
    if (!client) return unavailable("password-reset-request");
    const { error } = await client.auth.resetPasswordForEmail(request.email, {
      redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent("/reset-password")}`,
    });
    if (error && providerErrorCode(error) === "rate_limited") {
      return failure("password-reset-request", "rate_limited", "Too many requests. Wait before trying again.");
    }
    return success("password-reset-request", "login", "If an account matches that email, a password-reset link has been requested. Check your inbox.");
  }

  async updatePassword(request: PasswordUpdateRequest): Promise<AuthenticationResult> {
    const client = createSupabaseBrowserClient();
    if (!client) return unavailable("password-update");
    const { data: claims, error: claimError } = await client.auth.getClaims();
    if (claimError || !claims?.claims.sub) return failure("password-update", "reset_expired", "Open a valid recovery link before choosing a new password.");
    const { error } = await client.auth.updateUser({ password: request.password });
    if (error) return failure("password-update", providerErrorCode(error), "The password could not be updated. Request a new recovery link and try again.");
    return success("password-update", "login", "Your password was updated. You can now log in with the new password.");
  }

  async requestEmailVerification(request: EmailVerificationRequest): Promise<AuthenticationResult> {
    const client = createSupabaseBrowserClient();
    if (!client) return unavailable("verification-request");
    const { error } = await client.auth.resend({
      type: "signup",
      email: request.email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent("/app")}` },
    });
    if (error && providerErrorCode(error) === "rate_limited") {
      return failure("verification-request", "rate_limited", "Too many requests. Wait before trying again.");
    }
    return success("verification-request", "verify-email", "If a new verification email can be sent for that address, it has been requested.");
  }

  private async exchangeCode(request: AuthCallbackRequest, operation: "email-verification" | "oauth-callback") {
    const client = createSupabaseBrowserClient();
    if (!client) return unavailable(operation);
    if (!request.code) return failure(operation, "verification_expired", "The callback does not contain a valid code. Request a new link.");
    const { error } = await client.auth.exchangeCodeForSession(request.code);
    if (error) return failure(operation, "verification_expired", "This link is invalid or expired. Request a new one.");
    return success(operation, "dashboard", "Your email was verified. Opening your workspace…");
  }

  completeEmailVerification(request: AuthCallbackRequest) {
    return this.exchangeCode(request, "email-verification");
  }

  async beginOAuth(request: OAuthRequest): Promise<OAuthStartResult> {
    const client = createSupabaseBrowserClient(DEFAULT_SESSION_MAX_AGE);
    if (!client) return unavailable("oauth");
    this.setSessionPolicy(false);
    const { data, error } = await client.auth.signInWithOAuth({
      provider: request.provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent("/app")}`,
        skipBrowserRedirect: true,
      },
    });
    if (error || !data.url) return failure("oauth", "oauth_cancelled", "The provider could not be opened. No account was accessed.");
    return { status: "redirect", operation: "oauth", url: data.url, message: "Opening the secure provider sign-in page…" };
  }

  completeOAuthCallback(request: AuthCallbackRequest) {
    return this.exchangeCode(request, "oauth-callback");
  }

  async getSession(): Promise<SessionSnapshot> {
    const client = createSupabaseBrowserClient();
    if (!client) return { status: "unavailable", user: null };
    const { data, error } = await client.auth.getClaims();
    if (error || !data?.claims.sub) return { status: "anonymous", user: null };
    const metadata = data.claims.user_metadata as { name?: unknown } | undefined;
    return {
      status: "authenticated",
      user: {
        id: data.claims.sub,
        email: typeof data.claims.email === "string" ? data.claims.email : null,
        displayName: typeof metadata?.name === "string" ? metadata.name : null,
        emailVerified: Boolean(data.claims.email_confirmed_at),
      },
      expiresAt: new Date((data.claims.exp ?? 0) * 1000).toISOString(),
    };
  }

  async requireRouteAccess(request: RouteAccessRequest): Promise<RouteAccessResult> {
    void request;
    const session = await this.getSession();
    if (session.status === "unavailable") return { status: "unavailable", reason: "auth_not_connected" };
    if (session.status !== "authenticated") return { status: "denied", reason: "authentication_required" };
    return { status: "allowed", user: session.user };
  }
}

export const authenticationService = new SupabaseAuthenticationService();
