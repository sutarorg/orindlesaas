"use client";

import { useState } from "react";
import { CircleAlert, LoaderCircle, MailCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { contactPreviewService } from "@/lib/mocks/contact-preview";

type Errors = Partial<Record<"name" | "email" | "message", string>>;
type FormStatus = "idle" | "pending" | "preview";

const inputClass = "mt-2 min-h-12 w-full rounded-xl border border-line bg-white px-4 text-base text-ink outline-none transition-colors placeholder:text-muted/70 hover:border-muted focus:border-teal focus:ring-2 focus:ring-teal/15";

export function ContactForm() {
  const [errors, setErrors] = useState<Errors>({});
  const [status, setStatus] = useState<FormStatus>("idle");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const request = {
      name: String(data.get("name") ?? "").trim(),
      email: String(data.get("email") ?? "").trim(),
      topic: String(data.get("topic") ?? "general"),
      message: String(data.get("message") ?? "").trim(),
    };
    const nextErrors: Errors = {};
    if (request.name.length < 2) nextErrors.name = "Enter at least 2 characters for your name.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(request.email)) nextErrors.email = "Enter a valid email address.";
    if (request.message.length < 20) nextErrors.message = "Add a little more detail (at least 20 characters).";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      setStatus("idle");
      return;
    }

    setStatus("pending");
    await contactPreviewService.submit(request);
    setStatus("preview");
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="rounded-[24px] border border-line bg-white p-6 sm:p-8">
      <div className="mb-7 flex gap-3 rounded-xl bg-soft p-4 text-xs leading-5 text-body">
        <CircleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-teal" />
        <p className="m-0"><strong className="font-semibold text-ink">Frontend preview:</strong> this form checks your entries locally. It does not send or store a message because the email service is not connected.</p>
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="contact-name" className="text-sm font-semibold text-ink">Name</label>
          <input id="contact-name" name="name" autoComplete="name" className={inputClass} placeholder="Your name" aria-invalid={Boolean(errors.name)} aria-describedby={errors.name ? "contact-name-error" : undefined} />
          {errors.name && <p id="contact-name-error" className="mb-0 mt-2 text-xs text-error">{errors.name}</p>}
        </div>
        <div>
          <label htmlFor="contact-email" className="text-sm font-semibold text-ink">Email</label>
          <input id="contact-email" name="email" type="email" autoComplete="email" className={inputClass} placeholder="you@example.com" aria-invalid={Boolean(errors.email)} aria-describedby={errors.email ? "contact-email-error" : undefined} />
          {errors.email && <p id="contact-email-error" className="mb-0 mt-2 text-xs text-error">{errors.email}</p>}
        </div>
      </div>
      <div className="mt-5">
        <label htmlFor="contact-topic" className="text-sm font-semibold text-ink">What would you like to discuss?</label>
        <select id="contact-topic" name="topic" className={inputClass} defaultValue="general">
          <option value="general">General question</option>
          <option value="product">Product workflow</option>
          <option value="credits">Credits and pricing</option>
          <option value="accessibility">Accessibility</option>
          <option value="privacy">Privacy</option>
        </select>
      </div>
      <div className="mt-5">
        <label htmlFor="contact-message" className="text-sm font-semibold text-ink">Message</label>
        <textarea id="contact-message" name="message" rows={5} className={`${inputClass} resize-y py-3`} placeholder="Tell us what you are trying to make or understand." aria-invalid={Boolean(errors.message)} aria-describedby={errors.message ? "contact-message-error" : "contact-message-hint"} />
        {errors.message ? <p id="contact-message-error" className="mb-0 mt-2 text-xs text-error">{errors.message}</p> : <p id="contact-message-hint" className="mb-0 mt-2 text-xs text-muted">Minimum 20 characters for this local validation preview.</p>}
      </div>
      <Button type="submit" className="mt-6 w-full sm:w-auto" disabled={status === "pending"}>
        {status === "pending" ? <><LoaderCircle aria-hidden="true" className="animate-spin" /> Checking locally…</> : <>Preview message <MailCheck aria-hidden="true" /></>}
      </Button>
      <div aria-live="polite" className="min-h-6">
        {status === "preview" && <p className="mb-0 mt-4 flex items-start gap-2 text-sm leading-6 text-teal-dark"><CircleAlert aria-hidden="true" className="mt-1 size-4 shrink-0" /> Your entries passed local validation. No message was sent or stored.</p>}
      </div>
    </form>
  );
}
