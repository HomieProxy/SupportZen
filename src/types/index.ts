
export interface User {
  auth_token: string;
  name: string;
  email: string;
  uuid: string; // Add uuid for HMAC
  avatarUrl: string;
  planId: string;
  expiredAt: string;
  createdAt: string;
}

export interface Ticket {
  id: string;
  subject: string;
  customer: User;
  status: 'open' | 'in-progress' | 'closed';
  createdAt: string;
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
  status: 'active' | 'closed';
}

// Type for the incoming data from the client webhook
export interface ClientWebhookPayload {
  // User information
  email: string;
  uuid: string; // Add uuid for HMAC
  name?: string;
  created_at: number;
  expired_at?: number | null;
  plan_id?: number | string | null;
  auth_token?: string; // This will now be the HMAC hash
  
  // Support request information
  message: string;
  image_url?: string;
  ticket_id?: string; // Optional: to append to an existing ticket
}
