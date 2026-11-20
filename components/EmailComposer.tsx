"use client";
import { useActionState, useEffect, useRef } from "react";
import { sendEmail, type ActionState } from "@/lib/actions";

type Props = {
  leadId?: string | null;
  to?: string | null;
  subject?: string | null;
  replyToMessageId?: string | null;
  initialBody?: string | null;
  compact?: boolean;
  rows?: number;
  placeholder?: string;
  buttonLabel?: string;
};

export default function EmailComposer({
  leadId,
  to,
  subject,
  replyToMessageId,
  initialBody,
  compact,
  rows,
  placeholder,
  buttonLabel,
}: Props) {
  const [state, action, pending] = useActionState<ActionState, FormData>(sendEmail, undefined);
  const form = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state?.ok && !replyToMessageId) form.current?.reset();
  }, [state, replyToMessageId]);

  const isReply = !!replyToMessageId;
  const numRows = rows ?? (compact ? 3 : 8);

  return (
    <form ref={form} action={action} className="space-y-2">
      <input type="hidden" name="lead_id" value={leadId ?? ""} />
      <input type="hidden" name="reply_to_message_id" value={replyToMessageId ?? ""} />
      {!isReply && (
        <div className="grid gap-2 sm:grid-cols-2">
          <input className="input text-xs" name="to" placeholder="To" defaultValue={to ?? ""} required />
          <input className="input text-xs" name="subject" placeholder="Subject" defaultValue={subject ?? ""} required />
        </div>
      )}
      <textarea
        className="input font-[inherit] text-xs resize-y transition focus:ring-1"
        name="body"
        rows={numRows}
        defaultValue={initialBody ?? ""}
        placeholder={placeholder ?? (isReply ? "Write your reply or follow-up here..." : "Write your email...")}
      />
      <div className="flex items-center justify-between gap-3 pt-0.5">
        <div className="flex items-center gap-2">
          <button className="btn-primary py-1.5 px-3.5 text-xs font-bold" disabled={pending}>
            {pending ? "Sending..." : buttonLabel ?? (isReply ? "Send reply" : "Send email")}
          </button>
          {state?.ok && <span className="text-xs font-semibold text-emerald-600">✓ Sent successfully</span>}
          {state?.error && <span className="text-xs font-semibold text-red-600">{state.error}</span>}
        </div>
        <span className="text-[10px] text-slate-400">Direct Gmail sync</span>
      </div>
    </form>
  );
}
