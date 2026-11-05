export const PASSWORD_MIN_LENGTH = 15;
export const PASSWORD_MAX_LENGTH = 128;
export const PASSWORD_LONG_GUIDE = 20;

export type ValidationErrors<Field extends string> = Partial<Record<Field, string>>;
export type LoginField = "email" | "password";
export type SignUpField = "name" | "email" | "password" | "confirmPassword" | "terms";
export type PasswordUpdateField = "password" | "confirmPassword";

export function passwordLength(password: string) {
  return Array.from(password).length;
}

export function isValidEmail(email: string) {
  const value = email.trim();
  return value.length > 3 && value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function emailError(email: string) {
  if (!email.trim()) return "Enter your email address.";
  if (!isValidEmail(email)) return "Enter a valid email address, like you@example.com.";
  return undefined;
}

function newPasswordError(password: string) {
  const length = passwordLength(password);
  if (length < PASSWORD_MIN_LENGTH) return "Use at least 15 characters. A short phrase works well.";
  if (length > PASSWORD_MAX_LENGTH) return "Use no more than 128 characters.";
  return undefined;
}

export function getPasswordGuidance(password: string) {
  const length = passwordLength(password);
  if (length === 0) return "Use 15–128 characters. A short phrase works well; paste and password managers are welcome.";
  if (length > PASSWORD_MAX_LENGTH) return `${length} characters is over the 128-character limit.`;
  if (length < PASSWORD_MIN_LENGTH) {
    const remaining = PASSWORD_MIN_LENGTH - length;
    return `Add ${remaining} more character${remaining === 1 ? "" : "s"} to reach the 15-character minimum.`;
  }
  if (length < PASSWORD_LONG_GUIDE) return "Meets the 15-character minimum. A 20+ character passphrase is a useful longer target.";
  return "Meets the longer-passphrase guide. No special-character mix is required.";
}

export function validateLogin(request: { email: string; password: string }): ValidationErrors<LoginField> {
  const errors: ValidationErrors<LoginField> = {};
  const email = emailError(request.email);
  if (email) errors.email = email;
  if (!request.password) errors.password = "Enter your password.";
  return errors;
}

export function validateSignUp(request: {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  acceptedTerms: boolean;
}): ValidationErrors<SignUpField> {
  const errors: ValidationErrors<SignUpField> = {};
  const name = request.name.trim();
  if (name.length < 2) errors.name = "Enter at least 2 characters for your name.";
  else if (name.length > 80) errors.name = "Use no more than 80 characters for your name.";
  const email = emailError(request.email);
  if (email) errors.email = email;
  const password = newPasswordError(request.password);
  if (password) errors.password = password;
  if (!request.confirmPassword) errors.confirmPassword = "Confirm your password.";
  else if (request.password !== request.confirmPassword) errors.confirmPassword = "Passwords don’t match. Try entering them again.";
  if (!request.acceptedTerms) errors.terms = "Please accept the Terms and Privacy Policy to continue.";
  return errors;
}

export function validateEmailRequest(email: string): ValidationErrors<"email"> {
  const error = emailError(email);
  return error ? { email: error } : {};
}

export function validatePasswordUpdate(request: {
  password: string;
  confirmPassword: string;
}): ValidationErrors<PasswordUpdateField> {
  const errors: ValidationErrors<PasswordUpdateField> = {};
  const password = newPasswordError(request.password);
  if (password) errors.password = password;
  if (!request.confirmPassword) errors.confirmPassword = "Confirm your new password.";
  else if (request.password !== request.confirmPassword) errors.confirmPassword = "Passwords don’t match. Try entering them again.";
  return errors;
}
