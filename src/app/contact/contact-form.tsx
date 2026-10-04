"use client";
import { useRef, useState, type FormEvent } from "react";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  enquiryTypes,
  type ContactErrors,
  validateContact,
} from "@/lib/contact";
import { trackEvent } from "@/lib/analytics/events";
import { PRIVACY_URL } from "@/lib/links";

export function ContactForm({
  initialType,
  initialPlan,
}: {
  initialType: string;
  initialPlan: string;
}) {
  const [pending, setPending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [errors, setErrors] = useState<ContactErrors>({});
  const submission = useRef<{ payload: string; id: string } | null>(null);
  const busy = useRef(false);
  const status = useRef<HTMLDivElement>(null);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy.current) return;
    const form = event.currentTarget;
    const input = Object.fromEntries(new FormData(form));
    const checked = validateContact(input);
    setErrors(checked.errors);
    setError("");
    if (Object.keys(checked.errors).length) {
      setError("Check the highlighted fields.");
      form
        .querySelector<HTMLElement>(
          `[name="${Object.keys(checked.errors)[0]}"]`,
        )
        ?.focus();
      return;
    }
    const payload = JSON.stringify(input);
    if (!submission.current || submission.current.payload !== payload)
      submission.current = { payload, id: crypto.randomUUID() };
    busy.current = true;
    setPending(true);
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...input, submissionId: submission.current.id }),
      });
      const result = await response.json();
      if (!response.ok || !result.ok) {
        setErrors(result.errors ?? {});
        setError(
          result.error ?? "We could not send your enquiry. Please try again.",
        );
      } else {
        setSuccess(true);
        if (input.type === "pricing" || input.type === "product") trackEvent("generate_lead");
        else if (input.type === "support") trackEvent("support_enquiry");
      }
    } catch {
      setError(
        "We could not connect. Your message is still here; please try again.",
      );
    } finally {
      busy.current = false;
      setPending(false);
      status.current?.focus();
    }
  }
  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-[0_24px_55px_-40px_rgb(21_38_29_/_0.3)] sm:p-8">
      <div
        ref={status}
        tabIndex={-1}
        role="status"
        aria-live="polite"
        className={success ? "py-10" : ""}
      >
        {success ? (
          <>
            <CheckCircle2 className="size-10 text-primary" aria-hidden />
            <h2 className="mt-5 text-2xl font-semibold">
              Your enquiry has been sent.
            </h2>
            <p className="mt-4 leading-relaxed text-muted-foreground">
              Thanks for getting in touch. Our team will reply to the email
              address you provided.
            </p>
          </>
        ) : error ? (
          <p className="mb-5 rounded-lg border border-destructive/25 bg-destructive/5 p-4 text-sm text-destructive">
            {error}
          </p>
        ) : null}
      </div>
      {!success ? (
        <form onSubmit={submit} noValidate aria-busy={pending}>
          <h2 className="text-2xl font-semibold">Tell us how we can help.</h2>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            Fields marked * are required.
          </p>
          <fieldset
            disabled={pending}
            className="mt-7 space-y-5 disabled:opacity-70"
          >
            <div className="grid gap-5 sm:grid-cols-2">
              {[
                {
                  name: "name",
                  label: "Your name",
                  type: "text",
                  autoComplete: "name",
                  max: 100,
                },
                {
                  name: "email",
                  label: "Email address",
                  type: "email",
                  autoComplete: "email",
                  max: 254,
                },
              ].map((field) => (
                <div key={field.name}>
                  <label htmlFor={field.name} className="text-sm font-medium">
                    {field.label} *
                  </label>
                  <input
                    id={field.name}
                    name={field.name}
                    type={field.type}
                    autoComplete={field.autoComplete}
                    maxLength={field.max}
                    required
                    className="contact-field mt-2"
                    aria-invalid={Boolean(
                      errors[field.name as keyof ContactErrors],
                    )}
                    aria-describedby={
                      errors[field.name as keyof ContactErrors]
                        ? `${field.name}-error`
                        : undefined
                    }
                  />
                  {errors[field.name as keyof ContactErrors] ? (
                    <p
                      id={`${field.name}-error`}
                      className="mt-2 text-sm text-destructive"
                    >
                      {errors[field.name as keyof ContactErrors]}
                    </p>
                  ) : null}
                </div>
              ))}
            </div>
            <div>
              <label htmlFor="organisation" className="text-sm font-medium">
                Organisation{" "}
                <span className="font-normal text-muted-foreground">
                  (optional)
                </span>
              </label>
              <input
                id="organisation"
                name="organisation"
                autoComplete="organization"
                maxLength={150}
                className="contact-field mt-2"
                aria-invalid={Boolean(errors.organisation)}
                aria-describedby={
                  errors.organisation ? "organisation-error" : undefined
                }
              />
              {errors.organisation ? (
                <p
                  id="organisation-error"
                  className="mt-2 text-sm text-destructive"
                >
                  {errors.organisation}
                </p>
              ) : null}
            </div>
            <div>
              <label htmlFor="type" className="text-sm font-medium">
                What is your enquiry about? *
              </label>
              <select
                id="type"
                name="type"
                defaultValue={initialType}
                required
                className="contact-field mt-2"
                aria-invalid={Boolean(errors.type)}
                aria-describedby={errors.type ? "type-error" : undefined}
              >
                <option value="">Choose an enquiry type</option>
                {Object.entries(enquiryTypes).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
              {errors.type ? (
                <p id="type-error" className="mt-2 text-sm text-destructive">
                  {errors.type}
                </p>
              ) : null}
            </div>
            <div>
              <label htmlFor="plan" className="text-sm font-medium">
                Plan you are considering{" "}
                <span className="font-normal text-muted-foreground">
                  (optional)
                </span>
              </label>
              <select
                id="plan"
                name="plan"
                defaultValue={initialPlan}
                className="contact-field mt-2"
              >
                <option value="">Not sure yet / not applicable</option>
                <option>Pro</option>
                <option>Organisation</option>
              </select>
            </div>
            <div>
              <label htmlFor="message" className="text-sm font-medium">
                Your message *
              </label>
              <textarea
                id="message"
                name="message"
                rows={6}
                maxLength={5000}
                required
                className="contact-field mt-2 resize-y"
                aria-invalid={Boolean(errors.message)}
                aria-describedby={`message-help${errors.message ? " message-error" : ""}`}
              />
              <p
                id="message-help"
                className="mt-2 text-xs leading-relaxed text-muted-foreground"
              >
                Please leave employee review responses and other sensitive HR
                information out of your enquiry.
              </p>
              {errors.message ? (
                <p id="message-error" className="mt-2 text-sm text-destructive">
                  {errors.message}
                </p>
              ) : null}
            </div>
            <div hidden aria-hidden="true">
              <label htmlFor="website">Leave this field empty</label>
              <input
                id="website"
                name="website"
                defaultValue=""
                tabIndex={-1}
                autoComplete="off"
              />
            </div>
            <p className="text-xs leading-relaxed text-muted-foreground">
              We use your details to respond to this enquiry. Read our{" "}
              <a href={PRIVACY_URL} className="underline underline-offset-4">
                privacy policy
              </a>
              .
            </p>
            <Button size="lg" type="submit" className="w-full">
              {pending ? "Sending your enquiry…" : "Send enquiry"}
              <ArrowRight className="size-4" aria-hidden />
            </Button>
          </fieldset>
          <noscript>
            <p className="mt-4 text-sm">
              Enable JavaScript to send this form, or{" "}
              <a href="https://disclosurely.com/contact" className="underline">
                contact the Disclosurely team
              </a>
              .
            </p>
          </noscript>
        </form>
      ) : null}
    </div>
  );
}
