import { Middleware, Request, Response } from '../types';

export interface LoggerOptions {
  /** Enable colored output (default: true) */
  colors?: boolean;
  /** Custom format function */
  format?: (method: string, url: string, status: number, duration: number) => string;
}

const COLORS = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  dim: '\x1b[2m',
  magenta: '\x1b[35m',
  blue: '\x1b[34m',
};

function colorForStatus(status: number): string {
  if (status >= 500) return COLORS.red;
  if (status >= 400) return COLORS.yellow;
  if (status >= 300) return COLORS.cyan;
  if (status >= 200) return COLORS.green;
  return COLORS.reset;
}

function colorForMethod(method: string): string {
  switch (method) {
    case 'GET': return COLORS.green;
    case 'POST': return COLORS.blue;
    case 'PUT': case 'PATCH': return COLORS.yellow;
    case 'DELETE': return COLORS.red;
    default: return COLORS.magenta;
  }
}

export function logger(options: LoggerOptions = {}): Middleware {
  const useColors = options.colors !== false;
  const formatFn = options.format;

  return (req: Request, res: Response, next: () => void): void => {
    const startTime = Date.now();
    const method = req.method || 'GET';
    const url = req.url || '/';

    // Hook into response finish event to log after response is sent
    res.on('finish', () => {
      const duration = Date.now() - startTime;
      const status = res.statusCode;

      if (formatFn) {
        console.log(formatFn(method, url, status, duration));
        return;
      }

      if (useColors) {
        const mc = colorForMethod(method);
        const sc = colorForStatus(status);
        console.log(
          `${mc}${method.padEnd(7)}${COLORS.reset} ${url} ${sc}${status}${COLORS.reset} ${COLORS.dim}${duration}ms${COLORS.reset}`
        );
      } else {
        console.log(`${method.padEnd(7)} ${url} ${status} ${duration}ms`);
      }
    });

    next();
  };
}
