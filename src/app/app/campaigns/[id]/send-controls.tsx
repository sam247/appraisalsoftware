"use client";
import { useState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { sendCampaign } from "../actions";

function Submit({ later }: { later: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending
        ? "Preparing invitations…"
        : later
          ? "Schedule appraisal"
          : "Send appraisal"}
    </Button>
  );
}
export default function SendControls({ campaignId }: { campaignId: string }) {
  const [later, setLater] = useState(false);
  return (
    <form
      action={sendCampaign.bind(null, campaignId)}
      className="mt-6 space-y-5"
    >
      <fieldset>
        <legend className="text-sm font-medium mb-3">
          When should invitations go out?
        </legend>
        <div className="flex flex-wrap gap-6">
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
          <label htmlFor="send-date" className="block text-sm font-medium mb-2">
            Send date
          </label>
          <input
            id="send-date"
            name="opens_at"
            type="date"
            required
            className="rounded-lg border border-input bg-surface p-3"
          />
          <p className="mt-2 text-sm text-muted-foreground">
            Invitations are scheduled from 09:00 UTC (10:00 UK time during
            British Summer Time).
          </p>
        </div>
      )}
      <p className="text-sm text-muted-foreground">
        Sending or scheduling locks this campaign’s questions. Each reviewer
        receives their own secure email link.
      </p>
      <Submit later={later} />
    </form>
  );
}
