import type {
  AuthCallbackRequest,
  AuthenticationOperation,
  AuthenticationPreviewResult,
  AuthenticationService,
  EmailVerificationRequest,
  OAuthProvider,
  OAuthRequest,
  PasswordResetRequest,
  PasswordUpdateRequest,
  RouteAccessRequest,
  RouteAccessResult,
  SessionSnapshot,
  SignInRequest,
  SignUpRequest,
} from "@/lib/contracts/authentication";

export class MockAuthenticationAdapter implements AuthenticationService {
  constructor(private readonly delayMs = 350) {}

  private async pause() {
    if (this.delayMs > 0) await new Promise((resolve) => setTimeout(resolve, this.delayMs));
  }

  private async preview(operation: AuthenticationOperation, message: string): Promise<AuthenticationPreviewResult> {
    await this.pause();
    return { status: "preview", operation, message, session: null };
  }

  signUp(request: SignUpRequest): Promise<AuthenticationPreviewResult> {
    void request;
    return this.preview("signup", "Your entries passed local validation. No account was created, no verification email was sent and no credits were added.");
  }

  signIn(request: SignInRequest): Promise<AuthenticationPreviewResult> {
    void request;
    return this.preview("login", "Your entries passed local validation. No login request was sent, no remember-me preference was stored and no session was created.");
  }

  signOut(): Promise<AuthenticationPreviewResult> {
    return this.preview("logout", "No sign-out occurred and no storage was cleared because this frontend created no session.");
  }

  requestPasswordReset(request: PasswordResetRequest): Promise<AuthenticationPreviewResult> {
    void request;
    return this.preview("password-reset-request", "Your email passed local validation. No reset request was submitted and no email was sent. The connected flow will use the same generic response whether or not an account exists.");
  }

  updatePassword(request: PasswordUpdateRequest): Promise<AuthenticationPreviewResult> {
    void request;
    return this.preview("password-update", "Your new password passed local validation. No password was updated and no recovery session was created.");
  }

  requestEmailVerification(request: EmailVerificationRequest): Promise<AuthenticationPreviewResult> {
    void request;
    return this.preview("verification-request", "Your email passed local validation. No verification request was submitted and no email was sent.");
  }

  completeEmailVerification(request: AuthCallbackRequest): Promise<AuthenticationPreviewResult> {
    void request;
    return this.preview("email-verification", "No email was verified. This adapter does not read tokens, exchange codes or create sessions.");
  }

  beginOAuth(request: OAuthRequest): Promise<AuthenticationPreviewResult> {
    const provider: OAuthProvider = request.provider;
    const name = provider === "github" ? "GitHub" : "Google";
    return this.preview("oauth", `${name} is a planned integration. No provider was contacted, no consent screen opened, no redirect occurred and no account was accessed.`);
  }

  completeOAuthCallback(request: AuthCallbackRequest): Promise<AuthenticationPreviewResult> {
    void request;
    return this.preview("oauth-callback", "No OAuth callback was processed. No code was exchanged, no provider response was read and no session was created.");
  }

  async getSession(): Promise<SessionSnapshot> {
    return { status: "unavailable", user: null };
  }

  async requireRouteAccess(request: RouteAccessRequest): Promise<RouteAccessResult> {
    void request;
    return { status: "unavailable", reason: "auth_not_connected" };
  }
}

export const mockAuthenticationService = new MockAuthenticationAdapter();
