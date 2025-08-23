
'use client';

import React, { useState, useEffect, useMemo, useRef, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  getActiveChats,
  getChatById,
  addMessageToChat,
  addTicket,
  closeChat,
} from '@/lib/data';
import { ChatSession, ChatMessage, User } from '@/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Send, Bot, Sparkles, Image as ImageIcon, Briefcase, Calendar, Mail, User as UserIcon, ArrowLeft, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { suggestResponse } from '@/ai/flows/suggest-response';
import { createTicketFromChat } from '@/ai/flows/create-ticket-from-chat';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ImageAnnotator } from '@/components/image-annotator';
import { format, formatDistanceToNow } from 'date-fns';

function ChatList({
  chats,
  selectedChatId,
  onSelectChat,
}: {
  chats: ChatSession[];
  selectedChatId: string | null;
  onSelectChat: (id: string) => void;
}) {
  const getInitials = (name: string) => name.split(' ').map((n) => n[0]).join('');

  return (
    <Card className="w-full md:w-1/3 lg:w-1/4 h-full flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="font-headline">Conversations</CardTitle>
        <Button asChild variant="outline" size="icon" className="h-8 w-8">
            <Link href="/">
                <ArrowLeft className="h-4 w-4" />
                <span className="sr-only">Back to Home</span>
            </Link>
        </Button>
      </CardHeader>
      <ScrollArea className="flex-1">
        {chats.map((chat) => (
          <div
            key={chat.id}
            onClick={() => onSelectChat(chat.id)}
            className={cn(
              'flex items-center p-4 cursor-pointer border-b',
              selectedChatId === chat.id
                ? 'bg-muted'
                : 'hover:bg-muted/50'
            )}
          >
            <Avatar className="h-10 w-10">
              <AvatarImage src={chat.customer.avatarUrl} alt={chat.customer.name} />
              <AvatarFallback>{getInitials(chat.customer.name)}</AvatarFallback>
            </Avatar>
            <div className="ml-4 flex-1 truncate">
              <p className="font-semibold">{chat.customer.name}</p>
              <p className="text-sm text-muted-foreground truncate">
                {chat.messages[chat.messages.length - 1].content}
              </p>
            </div>
          </div>
        ))}
      </ScrollArea>
    </Card>
  );
}

function CustomerInfo({ user }: { user: User }) {
  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle className="font-headline text-lg">{user.name}</CardTitle>
        <CardDescription>{user.email}</CardDescription>
      </CardHeader>
      <CardContent className="text-sm space-y-2">
        <div className="flex items-center gap-2"><UserIcon className="w-4 h-4 text-muted-foreground" /> <span>Token: {user.auth_token}</span></div>
        <div className="flex items-center gap-2"><Briefcase className="w-4 h-4 text-muted-foreground" /> <span>Plan: {user.planId}</span></div>
        <div className="flex items-center gap-2"><Calendar className="w-4 h-4 text-muted-foreground" /> <span>Expires: {user.expiredAt}</span></div>
      </CardContent>
    </Card>
  );
}


function ChatWindow({ chat, onChatClose }: { chat: ChatSession, onChatClose: (id: string) => void }) {
  const [newMessage, setNewMessage] = useState('');
  const [isAiEnabled, setIsAiEnabled] = useState(false);
  const [suggestedResponse, setSuggestedResponse] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [annotatedImage, setAnnotatedImage] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (scrollAreaRef.current) {
        scrollAreaRef.current.scrollTo({ top: scrollAreaRef.current.scrollHeight });
    }
  }, [chat.messages]);
  
  const handleSendMessage = () => {
    if (newMessage.trim() === '') return;

    const message: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'agent',
      content: newMessage,
      timestamp: new Date().toISOString(),
    };
    addMessageToChat(chat.id, message);
    setNewMessage('');
    setSuggestedResponse(null);
  };
  
  const handleCustomerMessage = async (customerMessage: string) => {
    if (isAiEnabled) {
      setIsGenerating(true);
      setSuggestedResponse(null);
      try {
        const conversationHistory = chat.messages
          .map(
            (m) =>
              `${m.sender === 'agent' ? 'Agent' : 'Customer'}: ${m.content}`
          )
          .join('\n');
        
        const result = await suggestResponse({ customerMessage, conversationHistory });
        setSuggestedResponse(result.suggestedResponse);
      } catch (error) {
        toast({
          variant: "destructive",
          title: "AI Error",
          description: "Could not generate a response.",
        });
      } finally {
        setIsGenerating(false);
      }
    }
  };

  useEffect(() => {
    const lastMessage = chat.messages[chat.messages.length - 1];
    if (lastMessage && lastMessage.sender === 'customer') {
      handleCustomerMessage(lastMessage.content);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chat.messages, isAiEnabled]);


  const handleCreateTicket = async () => {
      try {
        const { customer } = chat;
        const conversationText = chat.messages
            .map(m => `${m.sender}: ${m.content}`)
            .join('\n');

        const aiResult = await createTicketFromChat({
            conversationText,
            customerEmail: customer.email,
            customerPlanId: customer.planId,
            customerExpiredAt: customer.expiredAt,
            customerUuid: customer.auth_token
        });

        const newTicket = addTicket({
          subject: aiResult.summary,
          customer: customer,
          status: 'open',
          messages: chat.messages
        });

        toast({
            title: "Ticket Created",
            description: `Ticket ${newTicket.id} created successfully.`,
        });

        onChatClose(chat.id);

      } catch(e) {
        console.error(e);
        toast({
            variant: "destructive",
            title: "Error creating ticket",
            description: "Could not create a ticket from this conversation."
        })
      }
  }

  const handleCloseChat = () => {
    closeChat(chat.id);
    onChatClose(chat.id);
    toast({
      title: "Chat Closed",
      description: `The conversation with ${chat.customer.name} has been closed.`
    });
  }

  const handleOpenAnnotator = (url: string) => {
    setAnnotatedImage(url);
    setIsModalOpen(true);
  }
  
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const oneDay = 24 * 60 * 60 * 1000;

    if (now.getTime() - date.getTime() < oneDay) {
        return format(date, 'p');
    }
    return format(date, 'PP p');
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-card rounded-lg">
      <div className="p-4 border-b flex justify-between items-center">
        <h3 className="font-semibold text-lg font-headline">{chat.customer.name}</h3>
        <div className="flex items-center gap-4">
            <Button onClick={handleCreateTicket} variant="outline" size="sm">Create Ticket</Button>
            <Button onClick={handleCloseChat} variant="destructive" size="sm"><X className="mr-2 h-4 w-4"/>Close Chat</Button>
            <div className="flex items-center space-x-2">
                <Switch id="ai-mode" checked={isAiEnabled} onCheckedChange={setIsAiEnabled} />
                <Label htmlFor="ai-mode" className="flex items-center gap-1">
                <Bot className="w-4 h-4" /> AI Assist
                </Label>
            </div>
        </div>
      </div>
      <div className="flex-1 flex overflow-hidden">
        <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
          <div className="space-y-4">
            {chat.messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  'flex items-end gap-2',
                  message.sender === 'agent' ? 'justify-end' : 'justify-start'
                )}
              >
                {message.sender === 'customer' && (
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={chat.customer.avatarUrl} />
                    <AvatarFallback>{chat.customer.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                )}
                <div
                  className={cn(
                    'rounded-lg px-3 py-2 max-w-sm group',
                    message.sender === 'agent'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  )}
                >
                  <p className="text-sm">{message.content}</p>
                  {message.attachment?.type === 'image' && (
                    <button onClick={() => handleOpenAnnotator(message.attachment!.url)} className="mt-2 block">
                        <img src={message.attachment.url} alt="attachment" className="rounded-md max-w-xs cursor-pointer" data-ai-hint="receipt document" />
                    </button>
                  )}
                  <div className="text-xs opacity-0 group-hover:opacity-100 transition-opacity duration-300 mt-1"
                       style={{color: message.sender === 'agent' ? 'hsl(var(--primary-foreground) / 0.7)' : 'hsl(var(--muted-foreground))'}}>
                       {formatTimestamp(message.timestamp)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
        <aside className="w-1/3 border-l p-4 hidden lg:block">
            <CustomerInfo user={chat.customer} />
        </aside>
      </div>

      {(isGenerating || suggestedResponse) && (
        <div className="p-4 border-t">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <Sparkles className="w-4 h-4 text-accent" />
            <span>AI Suggestion</span>
          </div>
          {isGenerating ? (
            <p className="text-sm text-muted-foreground italic">Generating response...</p>
          ) : (
            <div className="bg-muted p-2 rounded-md">
              <p className="text-sm">{suggestedResponse}</p>
              <Button size="sm" variant="ghost" className="mt-2" onClick={() => setNewMessage(suggestedResponse || '')}>Use this response</Button>
            </div>
          )}
        </div>
      )}

      <div className="p-4 border-t bg-background rounded-b-lg">
        <div className="relative">
          <Textarea
            placeholder="Type your message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            className="pr-20"
          />
          <div className="absolute top-1/2 -translate-y-1/2 right-3 flex gap-1">
             <Button variant="ghost" size="icon" className="h-8 w-8">
                <ImageIcon className="h-4 w-4" />
                <span className="sr-only">Attach image</span>
            </Button>
            <Button size="icon" className="h-8 w-8" onClick={handleSendMessage}>
                <Send className="h-4 w-4" />
                <span className="sr-only">Send</span>
            </Button>
          </div>
        </div>
      </div>
       <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-4xl h-[80vh]">
          <DialogHeader>
            <DialogTitle>Image Annotator</DialogTitle>
          </DialogHeader>
          {annotatedImage && <ImageAnnotator imageUrl={annotatedImage} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}


function ChatPageContent({ chatId }: { chatId: string | null }) {
  const router = useRouter();
  const [allChats, setAllChats] = useState(() => getActiveChats());
  
  useEffect(() => {
    const activeChats = getActiveChats();
    setAllChats(activeChats);
  }, [chatId]);

  const selectedChat = useMemo(() => {
    // If no chatId, or if the chatId from the URL isn't in our active chats, return null.
    if (!chatId || !allChats.some(c => c.id === chatId)) {
        return null;
    }
    return getChatById(chatId);
  }, [chatId, allChats]);
  
  const handleSelectChat = (id: string) => {
    // Navigate to the new chat URL without a full page reload.
    router.push(`/chat?id=${id}`, { scroll: false });
  }

  const handleChatClose = (closedChatId: string) => {
    const updatedChats = getActiveChats();
    setAllChats(updatedChats);

    // If the closed chat was the one being viewed
    if (chatId === closedChatId) {
        if (updatedChats.length > 0) {
            const newId = updatedChats[0].id;
            router.replace(`/chat?id=${newId}`);
        } else {
            router.replace('/chat');
        }
    }
  };

  return (
     <div className="flex h-[calc(100vh-60px)]">
        <ChatList
            chats={allChats}
            selectedChatId={chatId}
            onSelectChat={handleSelectChat}
        />
        <Separator orientation="vertical" />
        <div className="flex-1 p-4">
            {selectedChat ? (
            <ChatWindow chat={selectedChat} onChatClose={handleChatClose} />
            ) : (
            <div className="flex items-center justify-center h-full">
                <p className="text-muted-foreground">{ allChats.length > 0 ? "Select a conversation to start chatting" : "No active conversations"}</p>
            </div>
            )}
        </div>
    </div>
  )
}

function Page() {
  const searchParams = useSearchParams();
  const chatId = searchParams.get('id');
  return <ChatPageContent chatId={chatId} />;
}

export default function ChatPage() {
  return (
    <Suspense fallback={<div className="flex-1 p-4">Loading...</div>}>
      <Page />
    </Suspense>
  )
}
