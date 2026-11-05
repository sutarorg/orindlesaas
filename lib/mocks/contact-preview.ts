import type { ContactService, ContactRequest, ContactPreviewResult } from "@/lib/contracts/public-services";

export class LocalContactPreviewAdapter implements ContactService {
  async submit(request: ContactRequest): Promise<ContactPreviewResult> {
    void request;
    await new Promise((resolve) => setTimeout(resolve, 250));
    return {
      status: "preview",
      message: "Your entries passed local validation. No message was sent or stored.",
    };
  }
}

export const contactPreviewService = new LocalContactPreviewAdapter();
