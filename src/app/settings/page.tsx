
"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ThemeToggle } from '@/components/theme-toggle';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarIcon, AlertTriangle, ArrowLeft, ShieldCheck, Trash2, PlusCircle } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { clearClosedData } from '@/lib/data';
import { getSettings, updateSettings } from '@/app/actions/settings';


export default function SettingsPage() {
    const { toast } = useToast();
    const [geminiApiKey, setGeminiApiKey] = useState('');
    const [clientApiSecretKey, setClientApiSecretKey] = useState('');
    const [purgePeriod, setPurgePeriod] = useState<string>('7d');
    const [customDate, setCustomDate] = useState<Date | undefined>();
    const [allowedDomains, setAllowedDomains] = useState<string[]>([]);
    const [newDomain, setNewDomain] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const storedKey = localStorage.getItem('gemini_api_key');
        if (storedKey) {
            setGeminiApiKey(storedKey);
        }
        
        async function fetchSettings() {
            try {
                setIsLoading(true);
                const settings = await getSettings();
                setAllowedDomains(settings.allowedDomains || []);
                setClientApiSecretKey(settings.clientApiSecretKey || '');
            } catch (error) {
                toast({
                    variant: 'destructive',
                    title: 'Error loading settings',
                    description: 'Could not fetch the current settings from the server.'
                });
            } finally {
                setIsLoading(false);
            }
        }
        fetchSettings();

    }, [toast]);
    
    const handleAddDomain = () => {
        if (newDomain && !allowedDomains.includes(newDomain)) {
            setAllowedDomains([...allowedDomains, newDomain.trim()]);
            setNewDomain('');
        }
    }

    const handleRemoveDomain = (domainToRemove: string) => {
        setAllowedDomains(allowedDomains.filter(d => d !== domainToRemove));
    }

    const handleSaveSettings = async () => {
        setIsSaving(true);
        try {
            await updateSettings({ allowedDomains, clientApiSecretKey });
            toast({
                title: 'Settings Saved',
                description: 'Your settings have been updated successfully.',
            });
        } catch (error) {
             toast({
                variant: 'destructive',
                title: 'Error Saving Settings',
                description: 'Could not save your settings. Please try again.',
            });
        } finally {
            setIsSaving(false);
        }
    }


    const handleSaveGeminiApiKey = () => {
        localStorage.setItem('gemini_api_key', geminiApiKey);
        toast({
            title: 'API Key Saved',
            description: 'Your Gemini API key has been saved to local storage.',
        });
    };
    
    const handlePurgeData = () => {
        let cutoff: Date;
        if (purgePeriod === 'custom' && customDate) {
            cutoff = customDate;
        } else {
            cutoff = new Date();
            if (purgePeriod === '24h') {
                cutoff.setDate(cutoff.getDate() - 1);
            } else if (purgePeriod === '7d') {
                cutoff.setDate(cutoff.getDate() - 7);
            } else if (purgePeriod === '30d') {
                cutoff.setDate(cutoff.getDate() - 30);
            }
        }

        try {
            clearClosedData(cutoff);
            toast({
                title: "Data Purged",
                description: `Closed tickets and chats older than ${format(cutoff, 'PPP')} have been cleared.`
            })
        } catch (error) {
             toast({
                variant: 'destructive',
                title: "Error Purging Data",
                description: "Could not purge data. Please try again."
            })
        }
    }


  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between">
            <h2 className="text-3xl font-bold tracking-tight font-headline">
                Settings
            </h2>
             <Button onClick={handleSaveSettings} disabled={isLoading || isSaving}>
                {isSaving ? 'Saving...' : 'Save All Settings'}
            </Button>
        </div>
      <Card>
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
          <CardDescription>
            Customize the look and feel of the application.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
             <div className="flex items-center justify-between">
                <Label htmlFor="theme" className="font-medium">
                    Theme
                </Label>
                <ThemeToggle />
            </div>
            <p className="text-sm text-muted-foreground">
                Select the color scheme for the dashboard.
            </p>
          </div>
        </CardContent>
      </Card>
      
      <Card>
          <CardHeader>
              <CardTitle>API Settings</CardTitle>
              <CardDescription>Manage your API keys for third-party services and client access.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
              <div className="space-y-2">
                  <Label htmlFor="clientApiSecretKey">Client API Secret Key</Label>
                   <div className="flex gap-2">
                    <Input 
                        id="clientApiSecretKey"
                        type="password"
                        placeholder="Enter a strong, unique secret key"
                        value={clientApiSecretKey}
                        onChange={(e) => setClientApiSecretKey(e.target.value)}
                    />
                  </div>
                  <p className="text-sm text-muted-foreground">
                      This secret key is used to generate HMAC signatures for securing your client-side API requests. It must match the key used in your client application.
                  </p>
              </div>
              <div className="space-y-2">
                  <Label htmlFor="geminiApiKey">Gemini API Key (Local)</Label>
                   <div className="flex gap-2">
                    <Input 
                        id="geminiApiKey"
                        type="password"
                        placeholder="Enter your Gemini API Key"
                        value={geminiApiKey}
                        onChange={(e) => setGeminiApiKey(e.target.value)}
                    />
                    <Button onClick={handleSaveGeminiApiKey} variant="outline">Save to Browser</Button>
                  </div>
                  <div className="flex items-start gap-2 p-2 rounded-lg border bg-muted/50 text-sm">
                      <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5" />
                      <div className="flex-1">
                          <p className="text-muted-foreground">
                              The Gemini key is stored only in your browser's local storage and is used for client-side AI operations. For server-side AI, you must configure it separately in your deployment environment.
                          </p>
                      </div>
                  </div>
              </div>
          </CardContent>
      </Card>

      <Card>
          <CardHeader>
              <CardTitle>Allowed Domains for API Access</CardTitle>
              <CardDescription>Manage the domains that can create new tickets or chats via the client API. Use <code className="font-mono bg-muted p-1 rounded-sm">*.example.com</code> for wildcards.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading ? (
                <p>Loading domains...</p>
            ) : (
                 <>
                    <div className="space-y-2">
                        {allowedDomains.length > 0 ? (
                             allowedDomains.map(domain => (
                                <div key={domain} className="flex items-center justify-between gap-2 text-sm p-2 bg-muted rounded-md">
                                    <div className="flex items-center gap-2">
                                        <ShieldCheck className="h-4 w-4 text-green-500"/>
                                        <span className="font-mono">{domain}</span>
                                    </div>
                                   <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleRemoveDomain(domain)}>
                                        <Trash2 className="h-4 w-4 text-red-500"/>
                                   </Button>
                                </div>
                            ))
                        ) : (
                             <p className="text-sm text-muted-foreground text-center py-4">No domains configured. All origins are currently allowed.</p>
                        )}
                     </div>
                    <div className="flex gap-2">
                        <Input 
                            placeholder="e.g., example.com or *.mydomain.com"
                            value={newDomain}
                            onChange={(e) => setNewDomain(e.target.value)}
                             onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    e.preventDefault();
                                    handleAddDomain();
                                }
                            }}
                        />
                        <Button variant="outline" onClick={handleAddDomain}><PlusCircle className="mr-2" /> Add</Button>
                    </div>
                 </>
            )}
          </CardContent>
      </Card>
      
       <Card>
          <CardHeader>
              <CardTitle>Data Management</CardTitle>
              <CardDescription>Manage your application's stored data.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Purge Closed Data</Label>
                <div className="flex flex-col md:flex-row gap-2">
                    <Select value={purgePeriod} onValueChange={setPurgePeriod}>
                        <SelectTrigger className="w-full md:w-[200px]">
                            <SelectValue placeholder="Select period" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="24h">Older than 24 hours</SelectItem>
                            <SelectItem value="7d">Older than 7 days</SelectItem>
                            <SelectItem value="30d">Older than 30 days</SelectItem>
                            <SelectItem value="custom">Custom date</SelectItem>
                        </SelectContent>
                    </Select>
                    
                    {purgePeriod === 'custom' && (
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant={"outline"}
                                    className={cn(
                                        "w-full md:w-[240px] justify-start text-left font-normal",
                                        !customDate && "text-muted-foreground"
                                    )}
                                    >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {customDate ? format(customDate, "PPP") : <span>Pick a date</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                    mode="single"
                                    selected={customDate}
                                    onSelect={setCustomDate}
                                    disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                                    initialFocus
                                />
                            </PopoverContent>
                        </Popover>
                    )}
                    
                    <Button onClick={handlePurgeData} variant="destructive" className="md:ml-auto">
                        Purge Data
                    </Button>
                </div>
                 <p className="text-sm text-muted-foreground">This will permanently delete all closed tickets and chat sessions older than the selected period.</p>
              </div>
          </CardContent>
      </Card>

    </div>
  );
}
