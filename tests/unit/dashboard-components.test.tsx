import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { MarkdownMessage } from "@/components/dashboard/markdown-message";
import { ModelSelector } from "@/components/dashboard/model-selector";
import { ActionFeedback } from "@/components/dashboard/ui";

describe("dashboard reusable components", () => {
  it("renders code but never injects raw HTML from a message", () => {
    const { container } = render(<MarkdownMessage markdown={"## Safe direction\n\n```ts\nconst ok = true;\n```\n\n<img src=x onerror=alert(1)>"} />);
    expect(screen.getByRole("heading", { name: "Safe direction" })).toBeInTheDocument();
    expect(screen.getByText("const ok = true;")).toBeInTheDocument();
    expect(screen.getByText("<img src=x onerror=alert(1)>")).toBeInTheDocument();
    expect(container.querySelector("img")).toBeNull();
    expect(container.querySelector("script")).toBeNull();
  });

  it("keeps Auto separate and rejects incompatible model selections", () => {
    const onChange = vi.fn();
    render(<ModelSelector id="test-model" product="chat" value="auto" onChange={onChange} allowAuto />);
    const select = screen.getByLabelText("Model");
    expect(select).toHaveValue("auto");
    expect(screen.getByText("Automatic selection preview")).toBeInTheDocument();
    fireEvent.change(select, { target: { value: "gemini-3.1-flash-image" } });
    expect(onChange).not.toHaveBeenCalled();
    fireEvent.change(select, { target: { value: "gpt-6.1-sol" } });
    expect(onChange).toHaveBeenCalledWith("gpt-6.1-sol");
  });

  it("always labels preview feedback as non-persistent with zero credits", () => {
    render(<ActionFeedback result={{ status: "unavailable", message: "No operation occurred.", persisted: false, creditsChanged: 0 }} />);
    expect(screen.getByText("No operation occurred.")).toBeInTheDocument();
    expect(screen.getByText("Nothing persisted · 0 credits changed")).toBeInTheDocument();
  });
});
