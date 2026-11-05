import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ContactForm } from "@/components/marketing/contact-form";
import { contactPreviewService } from "@/lib/mocks/contact-preview";

describe("contact preview", () => {
  it("returns an explicit preview result rather than delivery success", async () => {
    const result = await contactPreviewService.submit({ name: "Test User", email: "test@example.com", topic: "general", message: "A sufficiently detailed question." });
    expect(result.status).toBe("preview");
    expect(result.message).toContain("No message was sent or stored");
  });

  it("shows field errors and then an honest local-only result", async () => {
    render(<ContactForm />);
    fireEvent.click(screen.getByRole("button", { name: "Preview message" }));
    expect(await screen.findByText("Enter at least 2 characters for your name.")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Name"), { target: { value: "Asha Rao" } });
    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "asha@example.com" } });
    fireEvent.change(screen.getByLabelText("Message"), { target: { value: "I would like to understand the shared credit workflow." } });
    fireEvent.click(screen.getByRole("button", { name: "Preview message" }));

    expect(await screen.findByText("Your entries passed local validation. No message was sent or stored.")).toBeInTheDocument();
    expect(screen.queryByText(/message sent successfully/i)).not.toBeInTheDocument();
  });
});
