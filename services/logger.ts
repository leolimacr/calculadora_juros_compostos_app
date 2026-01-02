/// <reference types="vite/client" />

type LogLevel = "info" | "warn" | "error";

export function logEvent(level: LogLevel, message: string, context?: Record<string, any>) {
  // Em produção, você poderia enviar isso para o Sentry ou Firebase Crashlytics
  if (import.meta.env.DEV) {
    const timestamp = new Date().toISOString();
    const style = level === 'error' ? 'color: red' : level === 'warn' ? 'color: orange' : 'color: cyan';
    console.groupCollapsed(`%c[FINPRO][${level.toUpperCase()}] ${message}`, style);
    console.log('Time:', timestamp);
    if (context) console.log('Context:', context);
    console.groupEnd();
  }
}