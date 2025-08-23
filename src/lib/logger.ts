export type LogLevel = 'INFO' | 'WARN' | 'ERROR';

export interface LogEntry {
  id: number;
  timestamp: string;
  level: LogLevel;
  message: string;
  details?: object;
}

// This will store logs in memory. In a real production app, you'd write this to a file or a logging service.
let logs: LogEntry[] = [];
let logIdCounter = 0;

export async function addLog(level: LogLevel, message: string, details?: object): Promise<void> {
  const newLog: LogEntry = {
    id: logIdCounter++,
    timestamp: new Date().toISOString(),
    level,
    message,
    ...(details && { details: { ...details } }),
  };
  
  // Keep the log in memory
  logs.unshift(newLog);

  // Optional: Also log to the console for real-time debugging
  switch(level) {
    case 'INFO':
        console.info(`[${newLog.timestamp}] INFO: ${message}`, details || '');
        break;
    case 'WARN':
        console.warn(`[${newLog.timestamp}] WARN: ${message}`, details || '');
        break;
    case 'ERROR':
        console.error(`[${newLog.timestamp}] ERROR: ${message}`, details || '');
        break;
  }

  // To prevent memory leaks, cap the number of logs stored
  if (logs.length > 500) {
    logs = logs.slice(0, 500);
  }
}

export async function getLogs(): Promise<LogEntry[]> {
  return [...logs];
}

export async function clearLogs(): Promise<void> {
    logs = [];
    logIdCounter = 0;
}
