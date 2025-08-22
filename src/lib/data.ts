import { User, Ticket, ChatSession, ChatMessage, ClientWebhookPayload } from '@/types';
import { subDays, formatISO, fromUnixTime, format, isBefore } from 'date-fns';

let users: User[] = [];
let tickets: Ticket[] = [];
let chatSessions: ChatSession[] = [];

const findOrAddUser = (payload: ClientWebhookPayload): User => {
  let user = users.find(u => u.uuid === payload.uuid);

  if (user) {
    user.email = payload.email;
    user.planId = payload.plan_id ? String(payload.plan_id) : 'N/A';
    user.expiredAt = payload.expired_at ? format(fromUnixTime(payload.expired_at), 'yyyy-MM-dd') : 'N/A';
  } else {
    const newUser: User = {
      uuid: payload.uuid,
      email: payload.email,
      planId: payload.plan_id ? String(payload.plan_id) : 'N/A',
      expiredAt: payload.expired_at ? format(fromUnixTime(payload.expired_at), 'yyyy-MM-dd') : 'N/A',
      name: payload.email.split('@')[0], 
      avatarUrl: `https://placehold.co/100x100.png`,
    };
    users.push(newUser);
    user = newUser;
  }
  return user;
}

export const createChatFromWebhook = (payload: ClientWebhookPayload): ChatSession => {
  const customer = findOrAddUser(payload);
  const now = new Date();

  const newMessage: ChatMessage = {
    id: `msg-${now.getTime()}`,
    sender: 'customer',
    content: payload.message,
    timestamp: formatISO(now),
    ...(payload.image_url && { attachment: { type: 'image', url: payload.image_url }})
  };

  const newChatId = `chat-${chatSessions.length + 1}`;
  const newChatSession: ChatSession = {
    id: newChatId,
    customer: customer,
    status: 'active',
    messages: [newMessage],
  };

  chatSessions.push(newChatSession);
  console.log('Created new chat session:', newChatSession.id);
  return newChatSession;
};

export const createOrUpdateTicketFromWebhook = (payload: ClientWebhookPayload): Ticket => {
  const customer = findOrAddUser(payload);
  const now = new Date();

  const newMessage: ChatMessage = {
    id: `msg-${now.getTime()}`,
    sender: 'customer',
    content: payload.message,
    timestamp: formatISO(now),
    ...(payload.image_url && { attachment: { type: 'image', url: payload.image_url }})
  };
  
  if (payload.ticket_id) {
    const existingTicket = tickets.find(t => t.id === payload.ticket_id);
    if(existingTicket) {
      existingTicket.messages.push(newMessage);
      existingTicket.lastUpdate = formatISO(now);
      if (existingTicket.status === 'closed') {
        existingTicket.status = 'open';
      }
      console.log('Updated ticket:', existingTicket.id);
      return existingTicket;
    }
  }

  const newTicketId = `TKT-${String(tickets.length + 1).padStart(3, '0')}`;
  const newTicket: Ticket = {
    id: newTicketId,
    customer: customer,
    subject: payload.message.substring(0, 50) + '...',
    status: 'open',
    createdAt: formatISO(now),
    lastUpdate: formatISO(now),
    messages: [newMessage],
  };

  tickets.push(newTicket);
  console.log('Created new ticket:', newTicket.id);
  return newTicket;
}

export const addTicket = (ticket: Omit<Ticket, 'id' | 'createdAt' | 'lastUpdate'>): Ticket => {
    const now = new Date();
    const newTicket: Ticket = {
        ...ticket,
        id: `TKT-${String(tickets.length + 1).padStart(3, '0')}`,
        createdAt: formatISO(now),
        lastUpdate: formatISO(now),
    };
    tickets.unshift(newTicket);
    return newTicket;
}

export const addMessageToTicket = (ticketId: string, message: ChatMessage) => {
    const ticket = tickets.find(t => t.id === ticketId);
    if(ticket) {
        ticket.messages.push(message);
        ticket.lastUpdate = formatISO(new Date());
    }
}

export const updateTicketStatus = (ticketId: string, status: Ticket['status']) => {
    const ticket = tickets.find(t => t.id === ticketId);
    if(ticket) {
        ticket.status = status;
        ticket.lastUpdate = formatISO(new Date());
    }
}

export const getTickets = () => tickets;
export const getTicketById = (id: string) => tickets.find(t => t.id === id);
export const getOpenTickets = () => tickets.filter(t => t.status !== 'closed');
export const getChatSessions = () => chatSessions;
export const getActiveChats = () => chatSessions.filter(c => c.status === 'active');
export const getChatById = (id: string) => chatSessions.find(c => c.id === id);

export const addMessageToChat = (chatId: string, message: ChatMessage) => {
    const chat = chatSessions.find(c => c.id === chatId);
    if(chat) {
        chat.messages.push(message);
    }
}

export const closeChat = (chatId: string) => {
    const chat = chatSessions.find(c => c.id === chatId);
    if (chat) {
        chat.status = 'closed';
    }
}

export const clearClosedData = (cutoffDate: Date) => {
    const originalTicketCount = tickets.length;
    
    const twoDaysAgo = subDays(new Date(), 2);
    chatSessions.forEach(chat => {
        const lastMessage = chat.messages[chat.messages.length - 1];
        if (lastMessage && isBefore(new Date(lastMessage.timestamp), twoDaysAgo)) {
            chat.status = 'closed';
        }
    });

    tickets = tickets.filter(ticket => {
        if (ticket.status !== 'closed') return true;
        return !isBefore(new Date(ticket.lastUpdate), cutoffDate);
    });

    const closedChatsPurged = chatSessions.filter(chat => {
        if (chat.status !== 'closed') return true;
        const lastMessage = chat.messages[chat.messages.length - 1];
        if (!lastMessage) return true;
        return !isBefore(new Date(lastMessage.timestamp), cutoffDate);
    });

    console.log(`Purged ${originalTicketCount - tickets.length} closed tickets.`);
    console.log(`Purged ${chatSessions.length - closedChatsPurged.length} closed chats.`);
    
    chatSessions = closedChatsPurged;
};
