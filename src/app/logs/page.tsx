
"use client";

import React, { useState, useEffect, useMemo } from 'react';
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
import { getLogs, clearLogs as apiClearLogs } from '@/app/actions/logs';
import { LogEntry, LogLevel } from '@/lib/logger';
import { format, parseISO } from 'date-fns';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { ListFilter, ArrowLeft, Trash2, Search, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"


type LevelFilter = LogLevel | 'all';

export default function LogsPage() {
  const [allLogs, setAllLogs] = useState<LogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [levelFilter, setLevelFilter] = useState<LevelFilter>('all');
  const { toast } = useToast();

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
        const logs = await getLogs();
        setAllLogs(logs);
    } catch(e) {
        toast({
            variant: "destructive",
            title: "Failed to fetch logs",
            description: "Could not retrieve system logs from the server."
        })
    } finally {
        setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchLogs();
  }, [toast]);
  
  const handleClearLogs = async () => {
    try {
        await apiClearLogs();
        setAllLogs([]);
        toast({
            title: "Logs Cleared",
            description: "The system logs have been successfully cleared."
        })
    } catch (e) {
         toast({
            variant: "destructive",
            title: "Failed to clear logs",
            description: "Could not clear system logs on the server."
        })
    }
  }


  const filteredLogs = useMemo(() => {
    return allLogs
      .filter((log) =>
        levelFilter === 'all' ? true : log.level === levelFilter
      )
      .filter((log) =>
        log.message.toLowerCase().includes(searchTerm.toLowerCase())
      );
  }, [allLogs, searchTerm, levelFilter]);

  const getLevelVariant = (level: LogLevel) => {
    switch (level) {
      case 'INFO':
        return 'secondary';
      case 'WARN':
        return 'default';
      case 'ERROR':
        return 'destructive';
    }
  };

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between space-y-2 md:space-y-0">
        <h2 className="text-3xl font-bold tracking-tight font-headline">
          System Logs ({filteredLogs.length})
        </h2>
        <div className="flex gap-2">
            <Button onClick={handleClearLogs} variant="destructive">
                <Trash2 className="mr-2 h-4 w-4" /> Clear Logs
            </Button>
            <Button asChild variant="outline">
                <Link href="/">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Home
                </Link>
            </Button>
        </div>
      </div>
      <div className="border rounded-lg">
        <div className="p-4 flex flex-col md:flex-row items-center gap-4">
          <div className="relative flex-1 w-full md:w-auto md:flex-grow">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
                placeholder="Filter logs by message..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 max-w-sm"
            />
          </div>
          <div className="flex gap-2 ml-auto">
            <Select
              value={levelFilter}
              onValueChange={(value) => setLevelFilter(value as LevelFilter)}
            >
              <SelectTrigger className="w-full md:w-[180px]">
                <ListFilter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                <SelectItem value="INFO">Info</SelectItem>
                <SelectItem value="WARN">Warning</SelectItem>
                <SelectItem value="ERROR">Error</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon" onClick={fetchLogs} disabled={isLoading}>
                {isLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                <span className="sr-only">Refresh Logs</span>
            </Button>
          </div>
        </div>
        <div className="max-h-[calc(100vh-250px)] overflow-auto">
        <Table>
          <TableHeader className="sticky top-0 bg-background z-10">
            <TableRow>
              <TableHead className="w-[100px]">Level</TableHead>
              <TableHead className="w-[200px]">Timestamp</TableHead>
              <TableHead>Message</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
                <TableRow>
                    <TableCell colSpan={3} className="h-24 text-center">
                        Loading logs...
                    </TableCell>
                </TableRow>
            ) : filteredLogs.length > 0 ? (
              filteredLogs.map((log) => (
                <React.Fragment key={log.id}>
                    <TableRow>
                    <TableCell>
                        <Badge variant={getLevelVariant(log.level)} className="capitalize">
                        {log.level}
                        </Badge>
                    </TableCell>
                    <TableCell>
                        <div className="flex flex-col">
                        <span className="font-mono text-sm">{format(parseISO(log.timestamp), 'yyyy-MM-dd HH:mm:ss.SSS')}</span>
                        </div>
                    </TableCell>
                    <TableCell>
                        <div className="font-mono text-sm">{log.message}</div>
                         {log.details && (
                             <Accordion type="single" collapsible className="w-full">
                                <AccordionItem value="item-1" className="border-b-0">
                                    <AccordionTrigger className="text-xs py-1 hover:no-underline text-muted-foreground">View Details</AccordionTrigger>
                                    <AccordionContent>
                                        <pre className="mt-2 w-full rounded-md bg-muted p-4 text-xs font-mono overflow-auto">
                                            {JSON.stringify(log.details, null, 2)}
                                        </pre>
                                    </AccordionContent>
                                </AccordionItem>
                            </Accordion>
                         )}
                    </TableCell>
                    </TableRow>
                </React.Fragment>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={3} className="h-24 text-center">
                  No logs found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        </div>
      </div>
    </div>
  );
}
