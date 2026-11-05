import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ContactForm } from "@/components/marketing/contact-form";

function acceptedResponse() {
  return new Response(JSON.stringify({ data: { message: "Your message was accepted for support delivery. Delivery status is tracked separately." } }), { status: 202, headers: { "Content-Type": "application/json" } });
}

function completeValidForm() {
  fireEvent.change(screen.getByLabelText("Name"), { target: { value: "Asha Rao" } });
  fireEvent.change(screen.getByLabelText("Email"), { target: { value: "asha@example.com" } });
  fireEvent.change(screen.getByLabelText("Message"), { target: { value: "I would like to understand the shared credit workflow." } });
}

afterEach(() => vi.unstubAllGlobals());

describe("contact delivery", () => {
  it("shows field errors and then reports queue acceptance, not email delivery", async () => {
    const fetchMock = vi.fn().mockResolvedValue(acceptedResponse());
    vi.stubGlobal("fetch", fetchMock);
    render(<ContactForm />);
    fireEvent.click(screen.getByRole("button", { name: "Send message" }));
    expect(await screen.findByText("Enter at least 2 characters for your name.")).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();

    completeValidForm();
    fireEvent.click(screen.getByRole("button", { name: "Send message" }));

    expect(await screen.findByText("Your message was accepted for support delivery. Delivery status is tracked separately.")).toBeInTheDocument();
    expect(screen.queryByText(/message sent successfully/i)).not.toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith("/api/v1/contact", expect.objectContaining({ method: "POST" }));
  });

  it("retains one idempotency key across an uncertain retry", async () => {
    const fetchMock = vi.fn().mockRejectedValueOnce(new TypeError("Network unavailable")).mockResolvedValueOnce(acceptedResponse());
    vi.stubGlobal("fetch", fetchMock);
    render(<ContactForm />);
    completeValidForm();
    fireEvent.click(screen.getByRole("button", { name: "Send message" }));
    expect(await screen.findByText(/Network unavailable/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Retry same message" }));
    await screen.findByText(/accepted for support delivery/);
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    const first = JSON.parse(String(fetchMock.mock.calls[0]![1].body)) as { idempotencyKey: string };
    const second = JSON.parse(String(fetchMock.mock.calls[1]![1].body)) as { idempotencyKey: string };
    expect(first.idempotencyKey).toMatch(/^[a-f0-9-]{36}$/);
    expect(second.idempotencyKey).toBe(first.idempotencyKey);
  });
});
