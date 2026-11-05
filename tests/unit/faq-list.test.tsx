import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { FaqList } from "@/components/marketing/faq-list";

const items = [{ question: "Is this a subscription?", answer: "No, it is a one-time credit package." }];

describe("FAQ accordion", () => {
  it("exposes expanded state and content through an accessible button", () => {
    render(<FaqList items={items} />);
    const trigger = screen.getByRole("button", { name: "Is this a subscription?" });
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    fireEvent.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText("No, it is a one-time credit package.")).toBeVisible();
  });
});
