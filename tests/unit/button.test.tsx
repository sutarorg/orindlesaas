import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Button } from "@/components/ui/button";

describe("Button", () => {
  it("keeps native button behavior", () => {
    const onClick = vi.fn();
    render(<Button type="button" onClick={onClick}>Save</Button>);

    const button = screen.getByRole("button", { name: "Save" });
    fireEvent.click(button);

    expect(button).toHaveAttribute("type", "button");
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("renders one styled child element without adding client-only behavior", () => {
    const onClick = vi.fn();
    render(
      <Button asChild variant="secondary" className="parent-class">
        <a href="/pricing" className="child-class" onClick={onClick}>View pricing</a>
      </Button>,
    );

    const link = screen.getByRole("link", { name: "View pricing" });
    expect(link).toHaveAttribute("href", "/pricing");
    expect(link).toHaveClass("parent-class", "child-class");
    expect(link.tagName).toBe("A");
    expect(link.querySelector("a")).toBeNull();

    fireEvent.click(link);
    expect(onClick).toHaveBeenCalledOnce();
  });
});
