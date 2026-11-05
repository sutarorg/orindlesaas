export type ContactRequest = {
  name: string;
  email: string;
  topic: string;
  message: string;
};

export type ContactPreviewResult = {
  status: "preview";
  message: "Your entries passed local validation. No message was sent or stored.";
};

export interface ContactService {
  submit(request: ContactRequest): Promise<ContactPreviewResult>;
}

export type CheckoutPreviewResult = {
  status: "unavailable";
  reason: "checkout_not_connected";
};

export interface CheckoutService {
  createCheckout(packId: string): Promise<CheckoutPreviewResult>;
}
