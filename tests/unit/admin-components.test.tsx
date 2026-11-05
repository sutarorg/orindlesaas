import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ConfirmActionDialog } from "@/components/admin/confirm-action-dialog";
import { AdminPagination } from "@/components/admin/data-table";
import { AdminTrendChart } from "@/components/admin/trend-chart";
import { Button } from "@/components/ui/button";
import type { AdminPreviewResult } from "@/lib/contracts/admin";

const preview: AdminPreviewResult = { status: "preview", message: "No real operation ran.", persisted: false, auditPersisted: false, paymentChanged: false, creditsChanged: 0 };

describe("admin interaction primitives", () => {
  it("requires a substantive reason and a second explicit review step", async () => {
    const onConfirm = vi.fn(async () => preview);
    const onResult = vi.fn();
    render(<ConfirmActionDialog trigger={<Button>Open preview</Button>} title="Preview test operation" description="Local only" target="Fixture target" consequence="Future authorized operation" confirmLabel="Confirm test preview" onConfirm={onConfirm} onResult={onResult} />);
    fireEvent.click(screen.getByRole("button", { name: "Open preview" }));
    fireEvent.click(screen.getByRole("button", { name: "Continue to review" }));
    expect(screen.getByRole("alert")).toHaveTextContent("at least 12 characters");
    expect(onConfirm).not.toHaveBeenCalled();
    fireEvent.change(screen.getByLabelText("Administrative reason"), { target: { value: "Verified support correction reference" } });
    fireEvent.click(screen.getByRole("button", { name: "Continue to review" }));
    expect(screen.getByText("Review the preview intent")).toBeInTheDocument();
    expect(onConfirm).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Confirm test preview" }));
    await waitFor(() => expect(onResult).toHaveBeenCalledWith(preview));
    expect(onConfirm).toHaveBeenCalledWith("Verified support correction reference");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("paginates with semantic buttons and announces the current page", () => {
    const onPageChange = vi.fn();
    render(<AdminPagination totalItems={13} page={2} pageSize={6} pageCount={3} itemLabel="users" onPageChange={onPageChange} />);
    expect(screen.getByRole("navigation", { name: "users pagination" })).toHaveTextContent("Page 2 of 3");
    fireEvent.click(screen.getByRole("button", { name: "Next users page" }));
    expect(onPageChange).toHaveBeenCalledWith(3);
    fireEvent.click(screen.getByRole("button", { name: "Previous users page" }));
    expect(onPageChange).toHaveBeenCalledWith(1);
  });

  it("gives charts a labelled image, summary and exact structured values", () => {
    render(<AdminTrendChart title="Demo operations" description="Two UTC days" summary="Illustrative values only." points={[{ label: "2026-11-04T00:00:00.000Z", values: [2, 4] }, { label: "2026-11-05T00:00:00.000Z", values: [3, 5] }]} series={[{ label: "Completed", color: "#067a67" }, { label: "Failed", color: "#b42318" }]} formatValue={(value) => `${value} jobs`} />);
    expect(screen.getByRole("img", { name: /Demo operations\. Illustrative values only/ })).toBeInTheDocument();
    expect(screen.getByText("View exact demo values")).toBeInTheDocument();
    expect(screen.getByRole("table", { name: /Exact values for Demo operations/ })).toHaveTextContent("5 jobs");
    expect(screen.getAllByRole("row")).toHaveLength(3);
  });
});
