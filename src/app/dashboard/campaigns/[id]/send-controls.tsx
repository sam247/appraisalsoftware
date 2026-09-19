"use client";
import { useState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { sendCampaign } from "../actions";

function Submit({ later, feedback }: { later: boolean; feedback: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending
        ? "Preparing invitations…"
        : later
          ? feedback
            ? "Schedule feedback"
            : "Schedule appraisal"
          : feedback
            ? "Send feedback"
            : "Send appraisal"}
    </Button>
  );
}
export default function SendControls({
  campaignId,
  timezone,
  feedback = false,
}: {
  campaignId: string;
  timezone: string;
  feedback?: boolean;
}) {
  const [later, setLater] = useState(false);
  return (
    <form
      action={sendCampaign.bind(null, campaignId)}
      className="mt-4 space-y-3"
    >
      <fieldset>
        <legend className="mb-2 text-sm font-medium">
          When should invitations go out?
        </legend>
        <div className="flex flex-wrap gap-5">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              name="delivery"
              value="now"
              defaultChecked
              onChange={() => setLater(false)}
            />
            Send now
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              name="delivery"
              value="later"
              onChange={() => setLater(true)}
            />
            Schedule for later
          </label>
        </div>
      </fieldset>
      {later && (
        <div>
          <label htmlFor="send-date" className="mb-1.5 block text-sm font-medium">
            Send date
          </label>
          <input
            id="send-date"
            name="opens_at"
            type="date"
            required
            className="rounded-lg border border-input bg-surface px-3 py-2 text-sm"
          />
          <p className="mt-1.5 text-xs text-muted-foreground">
            Invitations are scheduled from 09:00 in {timezone}.
          </p>
        </div>
      )}
      <p className="text-xs text-muted-foreground">
        Sending or scheduling locks this campaign’s questions. Each reviewer
        receives their own secure email link.
      </p>
      <Submit later={later} feedback={feedback} />
    </form>
  );
}
