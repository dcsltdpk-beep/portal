"use client";
import { useActionState, useEffect, useRef } from "react";
import { sendEmail, type ActionState } from "@/lib/actions";

type Props = { leadId?: string | null; to?: string | null; subject?: string | null; replyToMessageId?: string | null; initialBody?: string | null; compact?: boolean };

export default function EmailComposer({ leadId, to, subject, replyToMessageId, initialBody, compact }: Props) {
  const [state, action, pending] = useActionState<ActionState, FormData>(sendEmail, undefined);
  const form = useRef<HTMLFormElement>(null);
  useEffect(() => { if (state?.ok && !replyToMessageId) form.current?.reset(); }, [state, replyToMessageId]);
  const isReply = !!replyToMessageId;
  return (
    <form ref={form} action={action} className="space-y-2">
      <input type="hidden" name="lead_id" value={leadId ?? ""} />
      <input type="hidden" name="reply_to_message_id" value={replyToMessageId ?? ""} />
      {!isReply && (
        <div className="grid gap-2 sm:grid-cols-2">
          <input className="input" name="to" placeholder="To" defaultValue={to ?? ""} required />
          <input className="input" name="subject" placeholder="Subject" defaultValue={subject ?? ""} required />
        </div>
      )}
      <textarea className="input font-[inherit]" name="body" rows={compact ? 6 : 8} defaultValue={initialBody ?? ""}
        placeholder={isReply ? "Write your reply..." : "Write your email..."} />
      <div className="flex items-center gap-3">
        <button className="btn-primary" disabled={pending}>{pending ? "Sending..." : isReply ? "Send reply" : "Send email"}</button>
        {state?.ok && <span className="text-sm text-emerald-600">Sent.</span>}
        {state?.error && <span className="text-sm text-red-600">{state.error}</span>}
      </div>
    </form>
  );
}
