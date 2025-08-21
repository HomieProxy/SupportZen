
'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getTicketById, addMessageToTicket, updateTicketStatus } from '@/lib/data';
import { Ticket, ChatMessage, User } from '@/types';
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
import { Badge } from '@/components/ui/badge';
import { Send, ArrowLeft, Bot, Sparkles, Image as ImageIcon, Briefcase, Calendar, Mail, User as UserIcon, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ImageAnnotator } from '@/components/image-annotator';

function CustomerInfo({ user }: { user: User }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline text-lg">{user.name}</CardTitle>
        <CardDescription>{user.email}</CardDescription>
      </CardHeader>
      <CardContent className="text-sm space-y-2">
        <div className="flex items-center gap-2"><UserIcon className="w-4 h-4 text-muted-foreground" /> <span>UUID: {user.uuid}</span></div>
        <div className="flex items-center gap-2"><Briefcase className="w-4 h-4 text-muted-foreground" /> <span>Plan: {user.planId}</span></div>
        <div className="flex items-center gap-2"><Calendar className="w-4 h-4 text-muted-foreground" /> <span>Expires: {user.expiredAt}</span></div>
      </CardContent>
    </Card>
  );
}

function TicketConversation({ ticket, onStatusChange }: { ticket: Ticket, onStatusChange: (status: Ticket['status']) => void }) {
  const [newMessage, setNewMessage] = useState('');
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [annotatedImage, setAnnotatedImage] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({ top: scrollAreaRef.current.scrollHeight });
    }
  }, [ticket.messages]);

  const handleSendMessage = () => {
    if (newMessage.trim() === '') return;

    const message: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'agent',
      content: newMessage,
      timestamp: new Date().toISOString(),
    };
    addMessageToTicket(ticket.id, message);
    setNewMessage('');
  };

  const getStatusVariant = (status: Ticket['status']) => {
    switch (status) {
      case 'open': return 'destructive';
      case 'in-progress': return 'secondary';
      case 'closed': return 'default';
    }
  };
  
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const oneDay = 24 * 60 * 60 * 1000;

    if (now.getTime() - date.getTime() < oneDay) {
        return format(date, 'p');
    }
    return format(date, 'PP p');
  }
  
  const handleOpenAnnotator = (url: string) => {
    setAnnotatedImage(url);
    setIsModalOpen(true);
  }

  return (
    <Card className="flex flex-col h-full">
      <CardHeader className="flex flex-row justify-between items-start">
        <div>
            <div className="flex items-center gap-2">
                <Badge variant={getStatusVariant(ticket.status)} className="capitalize text-sm">{ticket.status.replace('-', ' ')}</Badge>
                <CardTitle className="font-headline">{ticket.subject}</CardTitle>
            </div>
            <CardDescription className="mt-2">Ticket ID: {ticket.id} &middot; Created on {format(new Date(ticket.createdAt), "PPP")}</CardDescription>
        </div>
        <div className="flex gap-2">
            {ticket.status !== 'in-progress' && <Button size="sm" variant="outline" onClick={() => onStatusChange('in-progress')}>Mark as In Progress</Button>}
            {ticket.status !== 'closed' && <Button size="sm" variant="destructive" onClick={() => onStatusChange('closed')}><X className="mr-2" /> Close Ticket</Button>}
            {ticket.status === 'closed' && <Button size="sm" onClick={() => onStatusChange('open')}><Check className="mr-2" /> Re-open Ticket</Button>}
        </div>
      </CardHeader>
      <div className="flex-1 flex flex-col overflow-hidden">
        <ScrollArea className="flex-1 p-6" ref={scrollAreaRef}>
          <div className="space-y-4">
            {ticket.messages.map((message) => (
              <div
                key={message.id}
                className={cn('flex items-end gap-2', message.sender === 'agent' ? 'justify-end' : 'justify-start')}
              >
                {message.sender === 'customer' && (
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={ticket.customer.avatarUrl} />
                    <AvatarFallback>{ticket.customer.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                )}
                <div
                  className={cn(
                    'rounded-lg px-3 py-2 max-w-lg group',
                    message.sender === 'agent' ? 'bg-primary text-primary-foreground' : 'bg-muted'
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
        <div className="p-4 border-t bg-background rounded-b-lg">
          <div className="relative">
            <Textarea
              placeholder="Type your response..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              className="pr-20"
              disabled={ticket.status === 'closed'}
            />
            <div className="absolute top-1/2 -translate-y-1/2 right-3 flex gap-1">
              <Button size="icon" className="h-8 w-8" onClick={handleSendMessage} disabled={ticket.status === 'closed'}>
                <Send className="h-4 w-4" />
                <span className="sr-only">Send</span>
              </Button>
            </div>
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
    </Card>
  );
}

export default function TicketPage({ params }: { params: { id: string } }) {
  // Use a state variable to force re-renders when data changes
  const [ticketState, setTicketState] = useState(getTicketById(params.id));
  const { toast } = useToast();
  
  if (!ticketState) {
    return notFound();
  }

  const handleStatusChange = (status: Ticket['status']) => {
    updateTicketStatus(ticketState.id, status);
    // Create a new object to trigger a state update
    const updatedTicket = getTicketById(params.id);
    if (updatedTicket) {
      setTicketState({ ...updatedTicket });
    }
    toast({
        title: "Ticket Status Updated",
        description: `Ticket has been marked as ${status.replace('-', ' ')}.`
    })
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6 h-full">
      <div className="flex items-center justify-between">
        <Button asChild variant="outline">
          <Link href="/tickets">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Tickets
          </Link>
        </Button>
      </div>
      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4 h-[calc(100%-60px)]">
        <div className="md:col-span-2 lg:col-span-3 h-full">
          <TicketConversation ticket={ticketState} onStatusChange={handleStatusChange} />
        </div>
        <div className="lg:col-span-1 h-full">
          <CustomerInfo user={ticketState.customer} />
        </div>
      </div>
    </div>
  );
}
