export type AuthenticationOperation =
  | "signup"
  | "login"
  | "logout"
  | "password-reset-request"
  | "password-update"
  | "verification-request"
  | "email-verification"
  | "oauth"
  | "oauth-callback";

export type AuthenticationField = "name" | "email" | "password" | "confirmPassword" | "terms";

export type AuthenticationErrorCode =
  | "invalid_email"
  | "weak_password"
  | "password_mismatch"
  | "terms_required"
  | "invalid_credentials"
  | "account_already_registered"
  | "verification_required"
  | "verification_expired"
  | "reset_expired"
  | "network_failure"
  | "oauth_cancelled"
  | "session_expired"
  | "rate_limited"
  | "unavailable";

export type AuthenticationNextStep = "login" | "signup" | "verify-email" | "dashboard" | "home" | "forgot-password";

export type AuthenticationPreviewResult = {
  status: "preview";
  operation: AuthenticationOperation;
  message: string;
  session: null;
};

export type AuthenticationResult =
  | { status: "success"; operation: AuthenticationOperation; next: AuthenticationNextStep; message: string }
  | {
      status: "error";
      operation: AuthenticationOperation;
      error: { code: AuthenticationErrorCode; field?: AuthenticationField };
      message: string;
    }
  | AuthenticationPreviewResult;

export type SignUpRequest = {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  acceptedTerms: boolean;
  packId?: "creator" | "pro" | "studio";
};

export type SignInRequest = {
  email: string;
  password: string;
  rememberMe: boolean;
};

export type PasswordResetRequest = { email: string };
export type PasswordUpdateRequest = { password: string; confirmPassword: string };
export type EmailVerificationRequest = { email: string };

/** Future server-adapter input. Prompt 2 never reads or persists these values. */
export type AuthCallbackRequest = { code?: string; next?: string };

export type OAuthProvider = "google" | "github";
export type OAuthRequest = { provider: OAuthProvider; intent: "login" | "signup" };

export type OAuthStartResult =
  | { status: "redirect"; operation: "oauth"; url: string; message: string }
  | Exclude<AuthenticationResult, { status: "success" }>;

export type DisplayAuthUser = {
  id: string;
  email: string | null;
  displayName: string | null;
  emailVerified: boolean;
};

export type SessionSnapshot =
  | { status: "authenticated"; user: DisplayAuthUser; expiresAt: string }
  | { status: "anonymous" | "expired" | "unavailable"; user: null };

export type RouteAccessRequest = { requestedPath: string };
export type RouteAccessResult =
  | { status: "allowed"; user: DisplayAuthUser }
  | { status: "denied"; reason: "authentication_required" | "forbidden" | "session_expired" }
  | { status: "unavailable"; reason: "auth_not_connected" };

export interface AuthenticationService {
  signUp(request: SignUpRequest): Promise<AuthenticationResult>;
  signIn(request: SignInRequest): Promise<AuthenticationResult>;
  signOut(): Promise<AuthenticationResult>;
  requestPasswordReset(request: PasswordResetRequest): Promise<AuthenticationResult>;
  updatePassword(request: PasswordUpdateRequest): Promise<AuthenticationResult>;
  requestEmailVerification(request: EmailVerificationRequest): Promise<AuthenticationResult>;
  completeEmailVerification(request: AuthCallbackRequest): Promise<AuthenticationResult>;
  beginOAuth(request: OAuthRequest): Promise<OAuthStartResult>;
  completeOAuthCallback(request: AuthCallbackRequest): Promise<AuthenticationResult>;
  getSession(): Promise<SessionSnapshot>;
  requireRouteAccess(request: RouteAccessRequest): Promise<RouteAccessResult>;
}
