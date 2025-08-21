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
