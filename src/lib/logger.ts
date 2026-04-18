// Logging service that strips logs in production
type LogLevel = 'debug' | 'info' | 'warn' | 'error';

class Logger {
  private isProduction = import.meta.env.PROD;

  private log(level: LogLevel, message: string, ...args: any[]) {
    if (this.isProduction && level === 'debug') return;
    console[level](`[${level.toUpperCase()}] ${message}`, ...args);
  }

  debug(message: string, ...args: any[]) {
    this.log('debug', message, ...args);
  }

  info(message: string, ...args: any[]) {
    this.log('info', message, ...args);
  }

  warn(message: string, ...args: any[]) {
    this.log('warn', message, ...args);
  }

  error(message: string, ...args: any[]) {
    this.log('error', message, ...args);
  }
}

export const logger = new Logger();