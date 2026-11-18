export type Lead = {
  id: string; wa_id: string | null; phone: string | null; email: string | null; name: string | null;
  company: string | null; role: string | null; city_country: string | null; source: string | null;
  campaign: string | null; pipeline: "services" | "academy" | "client" | null; stage: string | null;
  enquiry_type: string | null; service_interest: string | null; requirement_summary: string | null;
  budget: string | null; timeline: string | null; temperature: "Hot" | "Warm" | "Cold" | null;
  language: string | null; decision_maker: boolean | null; asked_price_or_call: boolean;
  regulated_sector: boolean | null; is_student: boolean | null; extra: Record<string, string | null>;
  ai_notes: string | null; ai_paused: boolean; score: number; owner_id: string | null;
  owner_name?: string | null; next_follow_up: string | null; last_inbound_at: string | null;
  last_outbound_at: string | null; created_at: string; updated_at: string;
};

export type Activity = {
  id: number; type: string; channel: string | null; direction: "in" | "out" | null;
  actor: string | null; content: string | null; created_at: string;
};

export type Email = {
  id: number; lead_id: string | null; direction: "in" | "out"; gmail_message_id: string | null;
  gmail_thread_id: string | null; from_addr: string | null; to_addr: string | null; subject: string | null;
  body_text: string | null; ai_category: string | null; ai_suggested_reply: string | null;
  status: string; sent_by: string | null; created_at: string; lead_name?: string | null;
};

export type User = { id: string; name: string; role: string; email: string | null };
