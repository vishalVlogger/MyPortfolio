"use client";

import { useEffect, useState, type SyntheticEvent } from "react";
import { CheckCircle2, Send } from "lucide-react";

/** Native POST keeps FormSubmit's CAPTCHA and email verification flow intact. */
export function ContactForm({ recipient }: { recipient: string }) {
  const [submitting, setSubmitting] = useState(false);
  const [returnTo, setReturnTo] = useState("");
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const url = new URL(window.location.href);
    const wasSubmitted = url.searchParams.get("contact") === "submitted";
    url.search = "?contact=submitted";
    url.hash = "contact";
    queueMicrotask(() => {
      setSubmitted(wasSubmitted);
      setReturnTo(url.href);
    });
    // Restore the form if someone returns from the provider using Back.
    const reset = () => setSubmitting(false);
    window.addEventListener("pageshow", reset);
    return () => window.removeEventListener("pageshow", reset);
  }, []);

  function submit(event: SyntheticEvent<HTMLFormElement>) {
    const form = event.currentTarget;
    const name = form.elements.namedItem("name") as HTMLInputElement;
    const message = form.elements.namedItem("message") as HTMLTextAreaElement;
    name.value = name.value.trim();
    message.value = message.value.trim();
    if (!form.reportValidity()) {
      event.preventDefault();
      return;
    }
    if (submitting) {
      event.preventDefault();
      return;
    }
    setSubmitting(true);
  }

  return (
    <form
      className="contact-form"
      action={`https://formsubmit.co/${encodeURIComponent(recipient)}`}
      method="POST"
      onSubmit={submit}
    >
      {submitted && (
        <output
          className="contact-confirmation"
          style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
        >
          <CheckCircle2
            style={{
              width: "1.2rem",
              height: "1.2rem",
              color: "#10b981",
              flexShrink: 0,
            }}
          />
          <span>Thank you! Your message has been submitted successfully.</span>
        </output>
      )}
      <div className="contact-fields">
        <label className="editor-field">
          <span>Name</span>
          <input
            name="name"
            autoComplete="name"
            required
            maxLength={100}
            placeholder="Your name"
          />
        </label>
        <label className="editor-field">
          <span>Email</span>
          <input
            type="email"
            name="email"
            autoComplete="email"
            required
            maxLength={254}
            placeholder="you@example.com"
          />
        </label>
      </div>
      <label className="editor-field">
        <span>Message</span>
        <textarea
          name="message"
          required
          minLength={10}
          maxLength={5000}
          rows={5}
          placeholder="Tell me about your project, opportunity, or question…"
        />
      </label>
      <input
        type="hidden"
        name="_subject"
        value="New message from your portfolio"
      />
      <input type="hidden" name="_template" value="table" />
      {returnTo && <input type="hidden" name="_next" value={returnTo} />}
      <input
        className="contact-honeypot"
        type="text"
        name="_honey"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
      />
      <p className="contact-privacy">
        Your details will only be used to reply to your message. FormSubmit
        protects this form from spam.
      </p>
      <button className="primary-link" type="submit" disabled={submitting}>
        {submitting ? "Sending message…" : "Send message"} <Send />
      </button>
    </form>
  );
}
