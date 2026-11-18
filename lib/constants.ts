export const PIPELINES = {
  services: {
    label: "Services (B2B)",
    stages: ["new", "contacted", "qualified", "call_booked", "proposal_sent", "negotiation", "won", "lost"],
  },
  academy: {
    label: "Academy (B2C)",
    stages: ["inquiry", "details_sent", "demo_counselling", "fee_pending", "enrolled", "lost"],
  },
} as const;

export type PipelineKey = keyof typeof PIPELINES;

export const STAGE_LABEL: Record<string, string> = {
  new: "New", contacted: "Contacted", qualified: "Qualified", call_booked: "Call booked",
  proposal_sent: "Proposal sent", negotiation: "Negotiation", won: "Won", lost: "Lost",
  inquiry: "Inquiry", details_sent: "Details sent", demo_counselling: "Demo / counselling",
  fee_pending: "Fee pending", enrolled: "Enrolled", active: "Active client", support: "Support",
};

export const label = (stage?: string | null) => (stage ? STAGE_LABEL[stage] ?? stage : "—");
