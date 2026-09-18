"use client";
import { useFormStatus } from "react-dom";
import { Button, type ButtonProps } from "@/components/ui/button";

export default function FormSubmit({
  children,
  pendingLabel = "Saving…",
  disabled,
  ...props
}: ButtonProps & { pendingLabel?: string }) {
  const { pending } = useFormStatus();
  return (
    <Button {...props} type="submit" disabled={disabled || pending}>
      {pending ? pendingLabel : children}
    </Button>
  );
}
