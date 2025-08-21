import { User, Ticket, ChatSession, ChatMessage, ClientWebhookPayload } from '@/types';
import { subDays, formatISO, fromUnixTime, format, isBefore } from 'date-fns';

const users: User[] = [
  {
    uuid: 'user-1',
    name: 'Alice Johnson',
    email: 'alice.j@example.com',
    avatarUrl: 'https://placehold.co/100x100/EEDD82/333333.png',
    planId: 'premium-monthly',
    expiredAt: '2024-12-31',
  },
  {
    uuid: 'user-2',
    name: 'Bob Williams',
    email: 'bob.w@example.com',
    avatarUrl: 'https://placehold.co/100x100/82E0AA/333333.png',
    planId: 'basic-yearly',
    expiredAt: '2025-06-15',
  },
  {
    uuid: 'user-3',
    name: 'Charlie Brown',
    email: 'charlie.b@example.com',
    avatarUrl: 'https://placehold.co/100x100/A9CCE3/333333.png',
    planId: 'free-tier',
    expiredAt: 'N/A',
  },
    {
    uuid: 'user-4',
    name: 'Diana Prince',
    email: 'diana.p@example.com',
    avatarUrl: 'https://placehold.co/100x100/F5B7B1/333333.png',
    planId: 'premium-yearly',
    expiredAt: '2026-01-20',
  },
];

let tickets: Ticket[] = [
  {
    id: 'TKT-001',
    subject: 'Cannot login to my account',
    customer: users[0],
    status: 'open',
    createdAt: formatISO(subDays(new Date(), 1)),
    lastUpdate: formatISO(subDays(new Date(), 1)),
    messages: [
      { id: 'msg-t1-1', sender: 'customer', content: 'I am unable to log into my account. It says "Invalid credentials" but I am sure my password is correct.', timestamp: formatISO(subDays(new Date(), 1)) },
      { id: 'msg-t1-2', sender: 'agent', content: 'Have you tried resetting your password?', timestamp: formatISO(subDays(new Date(), 1)) },
    ],
  },
  {
    id: 'TKT-002',
    subject: 'Billing issue with last invoice',
    customer: users[1],
    status: 'in-progress',
    createdAt: formatISO(subDays(new Date(), 2)),
    lastUpdate: formatISO(subDays(new Date(), 2)),
    messages: [
      { id: 'msg-t2-1', sender: 'customer', content: 'I was overcharged on my last invoice. Can you please check?', timestamp: formatISO(subDays(new Date(), 2)) },
    ],
  },
  {
    id: 'TKT-003',
    subject: 'Feature request: Dark mode',
    customer: users[2],
    status: 'closed',
    createdAt: formatISO(subDays(new Date(), 10)),
    lastUpdate: formatISO(subDays(new Date(), 9)),
    messages: [
        { id: 'msg-t3-1', sender: 'customer', content: 'It would be great if you could add a dark mode to the app.', timestamp: formatISO(subDays(new Date(), 10)) },
        { id: 'msg-t3-2', sender: 'agent', content: 'Thank you for your suggestion! We have added it to our product roadmap.', timestamp: formatISO(subDays(new Date(), 9)) }
    ],
  },
  {
    id: 'TKT-004',
    subject: 'App crashing on startup',
    customer: users[3],
    status: 'open',
    createdAt: formatISO(subDays(new Date(), 0)),
    lastUpdate: formatISO(subDays(new Date(), 0)),
    messages: [
        { id: 'msg-t4-1', sender: 'customer', content: 'My app crashes every time I open it on my new phone. Here is a screenshot of the error.', timestamp: formatISO(subDays(new Date(), 0)), attachment: { type: 'image', url: 'https://placehold.co/600x400.png' } },
    ]
  }
];

let chatSessions: ChatSession[] = [
  {
    id: 'CHAT-001',
    customer: users[0],
    messages: [
      { id: 'msg-c1-1', sender: 'customer', content: 'Hi, I need help upgrading my plan.', timestamp: formatISO(new Date()) },
      { id: 'msg-c1-2', sender: 'agent', content: 'Hello Alice! I can certainly help with that. Which plan are you interested in?', timestamp: formatISO(new Date()) },
    ],
    status: 'active',
  },
  {
    id: 'CHAT-002',
    customer: users[2],
    messages: [
      { id: 'msg-c2-1', sender: 'customer', content: 'My file upload is not working.', timestamp: formatISO(new Date()) },
    ],
    status: 'active',
  },
  {
    id: 'CHAT-003',
    customer: users[3],
    messages: [
      { id: 'msg-c3-1', sender: 'customer', content: 'Can you show me how to use the new analytics feature?', timestamp: formatISO(new Date()) },
      { id: 'msg-c3-2', sender: 'customer', content: 'I have attached a screenshot of what I am seeing.', timestamp: formatISO(new Date()), attachment: { type: 'image', url: 'https://placehold.co/600x400.png' }},
    ],
    status: 'active',
  }
];

const findOrAddUser = (payload: ClientWebhookPayload): User => {
  let user = users.find(u => u.uuid === payload.uuid);

  if (user) {
    // Update existing user's details if they have changed
    user.email = payload.email;
    user.planId = payload.plan_id ? String(payload.plan_id) : 'N/A';
    user.expiredAt = payload.expired_at ? format(fromUnixTime(payload.expired_at), 'yyyy-MM-dd') : 'N/A';
  } else {
    // Add new user
    const newUser: User = {
      uuid: payload.uuid,
      email: payload.email,
      planId: payload.plan_id ? String(payload.plan_id) : 'N/A',
      expiredAt: payload.expired_at ? format(fromUnixTime(payload.expired_at), 'yyyy-MM-dd') : 'N/A',
      name: payload.email.split('@')[0], // Create a name from email
      avatarUrl: `https://placehold.co/100x100.png`, // Generic placeholder
    };
    users.push(newUser);
    user = newUser;
  }
  return user;
}

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

  // If no ticket_id is provided, or the provided one doesn't exist, create a new ticket.
  const newTicketId = `TKT-${String(tickets.length + 1).padStart(3, '0')}`;
  const newTicket: Ticket = {
    id: newTicketId,
    customer: customer,
    subject: payload.message.substring(0, 50) + '...', // Use first 50 chars of message as subject
    status: 'open',
    createdAt: formatISO(now),
    lastUpdate: formatISO(now),
    messages: [newMessage],
  };

  tickets.push(newTicket);
  console.log('Created new ticket:', newTicket.id);
  return newTicket;
}


export const getTickets = () => tickets;
export const getTicketById = (id: string) => tickets.find(t => t.id === id);
export const getOpenTickets = () => tickets.filter(t => t.status !== 'closed');
export const getActiveChats = () => chatSessions.filter(c => c.status === 'active');
export const getChatById = (id: string) => chatSessions.find(c => c.id === id);
export const addMessageToChat = (chatId: string, message: ChatMessage) => {
    const chat = chatSessions.find(c => c.id === chatId);
    if(chat) {
        chat.messages.push(message);
    }
}
export const clearClosedData = (cutoffDate: Date) => {
    const originalTicketCount = tickets.length;
    
    // In a real app, you might "close" a chat session.
    // For this mock data, we'll assume any chat that hasn't had a message
    // in 2 days is "closed" for purging purposes.
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
        if (!lastMessage) return true; // Keep empty chats?
        return !isBefore(new Date(lastMessage.timestamp), cutoffDate);
    });

    console.log(`Purged ${originalTicketCount - tickets.length} closed tickets.`);
    console.log(`Purged ${chatSessions.length - closedChatsPurged.length} closed chats.`);
    
    chatSessions = closedChatsPurged;
};
