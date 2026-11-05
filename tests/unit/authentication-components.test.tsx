import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LoginForm } from "@/components/auth/login-form";
import { OAuthButtons } from "@/components/auth/oauth-buttons";
import { SignupForm } from "@/components/auth/signup-form";

describe("authentication form accessibility and feedback", () => {
  it("preserves the password while toggling its accessible visibility control", () => {
    render(<LoginForm initialState={null} />);
    const password = screen.getByLabelText("Password");
    fireEvent.change(password, { target: { value: "my private passphrase" } });
    const toggle = screen.getByRole("button", { name: "Show password" });
    fireEvent.click(toggle);
    expect(password).toHaveAttribute("type", "text");
    expect(password).toHaveValue("my private passphrase");
    expect(screen.getByRole("button", { name: "Hide password" })).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(screen.getByRole("button", { name: "Hide password" }));
    expect(password).toHaveAttribute("type", "password");
  });

  it("associates validation errors and focuses the first invalid field", async () => {
    render(<LoginForm initialState={null} />);
    fireEvent.click(screen.getByRole("button", { name: "Log in" }));
    const email = screen.getByLabelText("Email address");
    expect(await screen.findByText("Enter your email address.")).toBeInTheDocument();
    expect(email).toHaveAttribute("aria-invalid", "true");
    expect(email.getAttribute("aria-describedby")).toContain("login-email-error");
    await waitFor(() => expect(email).toHaveFocus());
  });

  it("shows mismatch and required-consent guidance without claiming an account", async () => {
    render(<SignupForm initialState={null} />);
    fireEvent.change(screen.getByLabelText("Full name"), { target: { value: "Asha Rao" } });
    fireEvent.change(screen.getByLabelText("Email address"), { target: { value: "asha@example.com" } });
    fireEvent.change(screen.getByLabelText("Create a password"), { target: { value: "a long private passphrase" } });
    fireEvent.change(screen.getByLabelText("Confirm password"), { target: { value: "a different long passphrase" } });
    fireEvent.click(screen.getByRole("button", { name: "Create account" }));
    expect(await screen.findByText(/Passwords don’t match/)).toBeInTheDocument();
    expect(screen.getByText(/Please accept the Terms/)).toBeInTheDocument();
    expect(screen.queryByText(/account was created/i)).not.toBeInTheDocument();
  });

  it("reports an unconfigured OAuth integration without claiming a redirect", async () => {
    render(<OAuthButtons intent="login" />);
    fireEvent.click(screen.getByRole("button", { name: "Continue with Google" }));
    expect(await screen.findByText(/Authentication is not configured/)).toBeInTheDocument();
    expect(screen.getByText(/No account or session change was made/)).toBeInTheDocument();
  });
});
