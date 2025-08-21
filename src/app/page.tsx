
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getActiveChats, getOpenTickets, getTickets, getChatSessions } from '@/lib/data';
import { Ticket } from '@/types';
import { MessageSquare, Ticket as TicketIcon, CheckCircle, Users } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function Dashboard() {
  const allTickets = getTickets();
  const allChats = getChatSessions();
  const activeChats = getActiveChats();
  const openTickets = getOpenTickets();

  const recentTickets = openTickets.slice(0, 5);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('');
  };

  const getStatusVariant = (status: Ticket['status']) => {
    switch (status) {
      case 'open':
        return 'destructive';
      case 'in-progress':
        return 'secondary';
      case 'closed':
        return 'default';
      default:
        return 'default';
    }
  };

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <h2 className="text-3xl font-bold tracking-tight font-headline">
        Dashboard
      </h2>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tickets</CardTitle>
            <TicketIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{allTickets.length}</div>
            <p className="text-xs text-muted-foreground">
              All tickets ever created
            </p>
          </CardContent>
        </Card>
         <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open Tickets</CardTitle>
            <TicketIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{openTickets.length}</div>
            <p className="text-xs text-muted-foreground">
              Tickets needing attention
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Chats</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{allChats.length}</div>
            <p className="text-xs text-muted-foreground">
              All chat sessions initiated
            </p>
          </CardContent>
        </Card>
         <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Chats</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeChats.length}</div>
            <p className="text-xs text-muted-foreground">
              Live conversations right now
            </p>
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Recent Open Tickets</CardTitle>
            <CardDescription>
              Your most recently updated open and in-progress tickets.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                   <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentTickets.map((ticket) => (
                  <TableRow key={ticket.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={ticket.customer.avatarUrl} alt={ticket.customer.name} />
                          <AvatarFallback>
                            {getInitials(ticket.customer.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="font-medium">{ticket.customer.name}</div>
                      </div>
                    </TableCell>
                    <TableCell>{ticket.subject}</TableCell>
                    <TableCell className="text-right">
                      <Badge variant={getStatusVariant(ticket.status)} className="capitalize">
                        {ticket.status.replace('-', ' ')}
                      </Badge>
                    </TableCell>
                     <TableCell className="text-right">
                        <Button asChild variant="outline" size="sm">
                            <Link href={`/tickets/${ticket.id}`}>View</Link>
                        </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        <Card className="col-span-4 lg:col-span-3">
          <CardHeader>
            <CardTitle>Active Conversations</CardTitle>
            <CardDescription>
              Jump into an ongoing chat session.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {activeChats.map((chat) => (
                <div key={chat.id} className="flex items-center">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={chat.customer.avatarUrl} alt={chat.customer.name} />
                    <AvatarFallback>{getInitials(chat.customer.name)}</AvatarFallback>
                  </Avatar>
                  <div className="ml-4 space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {chat.customer.name}
                    </p>
                    <p className="text-sm text-muted-foreground truncate max-w-xs">
                      {chat.messages[chat.messages.length -1].content}
                    </p>
                  </div>
                  <Button asChild variant="ghost" size="sm" className="ml-auto">
                    <Link href={`/chat?id=${chat.id}`}>Join</Link>
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
