export interface User {
  uuid: string;
  name: string;
  email: string;
  avatarUrl: string;
  planId: string;
  expiredAt: string;
}

export interface Ticket {
  id: string;
  subject: string;
  customer: User;
  status: 'open' | 'in-progress' | 'closed';
  lastUpdate: string;
  messages: ChatMessage[];
}

export interface ChatMessage {
  id: string;
  sender: 'customer' | 'agent';
  content: string;
  timestamp: string;
  attachment?: {
    type: 'image';
    url: string;
  };
}

export interface ChatSession {
  id: string;
  customer: User;
  messages: ChatMessage[];
}

// Type for the incoming data from the client webhook
export interface ClientWebhookPayload {
  email: string;
  last_login_at?: number | null;
  created_at: number;
  expired_at?: number | null;
  plan_id?: number | string | null;
  telegram_id?: number | null;
  uuid: string;
}
