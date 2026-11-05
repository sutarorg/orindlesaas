import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { FaqList } from "@/components/marketing/faq-list";

const items = [{ question: "Is this a subscription?", answer: "No, it is a one-time credit package." }];

describe("FAQ accordion", () => {
  it("exposes expanded state and content through a native disclosure", () => {
    render(<FaqList items={items} />);
    const trigger = screen.getByText("Is this a subscription?").closest("summary");
    const details = trigger?.closest("details");

    expect(trigger).not.toBeNull();
    expect(details).not.toHaveAttribute("open");
    fireEvent.click(trigger as HTMLElement);

    expect(details).toHaveAttribute("open");
    expect(screen.getByText("No, it is a one-time credit package.")).toBeVisible();
  });
});
