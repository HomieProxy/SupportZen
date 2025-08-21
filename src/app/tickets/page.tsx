"use client";

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
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
import { getTickets } from '@/lib/data';
import { Ticket } from '@/types';
import { formatDistanceToNow } from 'date-fns';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { ListFilter, ArrowLeft } from 'lucide-react';

type Status = Ticket['status'] | 'all';

export default function TicketsPage() {
  const allTickets = useMemo(() => getTickets(), []);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<Status>('all');

  const filteredTickets = useMemo(() => {
    return allTickets
      .filter((ticket) =>
        statusFilter === 'all' ? true : ticket.status === statusFilter
      )
      .filter((ticket) =>
        ticket.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.id.toLowerCase().includes(searchTerm.toLowerCase())
      );
  }, [allTickets, searchTerm, statusFilter]);

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
    }
  };

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between space-y-2 md:space-y-0">
        <h2 className="text-3xl font-bold tracking-tight font-headline">
          Tickets ({filteredTickets.length})
        </h2>
        <Button asChild variant="outline">
            <Link href="/">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Home
            </Link>
        </Button>
      </div>
      <div className="border rounded-lg">
        <div className="p-4 flex flex-col md:flex-row items-center gap-4">
          <Input
            placeholder="Filter by keyword, name, or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
          <div className="flex gap-2 ml-auto">
            <Select
              value={statusFilter}
              onValueChange={(value) => setStatusFilter(value as Status)}
            >
              <SelectTrigger className="w-[180px]">
                <ListFilter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="in-progress">In Progress</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Status</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Subject</TableHead>
              <TableHead>Last Update</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTickets.length > 0 ? (
              filteredTickets.map((ticket) => (
                <TableRow key={ticket.id}>
                  <TableCell>
                    <Badge variant={getStatusVariant(ticket.status)} className="capitalize">
                      {ticket.status.replace('-', ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={ticket.customer.avatarUrl} alt={ticket.customer.name} />
                        <AvatarFallback>
                          {getInitials(ticket.customer.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="font-medium">{ticket.customer.name}</span>
                        <span className="text-xs text-muted-foreground">{ticket.customer.email}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                        <span className="font-medium">{ticket.subject}</span>
                        <span className="text-xs text-muted-foreground">{ticket.id}</span>
                    </div>
                    </TableCell>
                  <TableCell>
                    {formatDistanceToNow(new Date(ticket.lastUpdate), {
                      addSuffix: true,
                    })}
                  </TableCell>
                  <TableCell>
                    <Button variant="outline" size="sm">View</Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  No tickets found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
