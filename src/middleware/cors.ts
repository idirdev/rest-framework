import { Middleware, Request, Response } from '../types';

export interface CorsOptions {
  /** Allowed origins. '*' for all, or array of specific origins */
  origin?: string | string[];
  /** Allowed HTTP methods */
  methods?: string[];
  /** Allowed request headers */
  allowedHeaders?: string[];
  /** Headers exposed to the client */
  exposedHeaders?: string[];
  /** Allow credentials (cookies, auth headers) */
  credentials?: boolean;
  /** Preflight cache duration in seconds */
  maxAge?: number;
}

export function cors(options: CorsOptions = {}): Middleware {
  const origin = options.origin || '*';
  const methods = options.methods || ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'];
  const allowedHeaders = options.allowedHeaders || ['Content-Type', 'Authorization', 'X-Requested-With'];
  const exposedHeaders = options.exposedHeaders || [];
  const credentials = options.credentials || false;
  const maxAge = options.maxAge || 86400;

  return (req: Request, res: Response, next: () => void): void => {
    const requestOrigin = req.headers.origin || '';

    // Determine the allowed origin for this request
    let allowOrigin = '*';
    if (typeof origin === 'string') {
      allowOrigin = origin;
    } else if (Array.isArray(origin)) {
      allowOrigin = origin.includes(requestOrigin) ? requestOrigin : origin[0];
    }

    res.setHeader('Access-Control-Allow-Origin', allowOrigin);
    res.setHeader('Access-Control-Allow-Methods', methods.join(', '));
    res.setHeader('Access-Control-Allow-Headers', allowedHeaders.join(', '));

    if (exposedHeaders.length > 0) {
      res.setHeader('Access-Control-Expose-Headers', exposedHeaders.join(', '));
    }

    if (credentials) {
      res.setHeader('Access-Control-Allow-Credentials', 'true');
    }

    // Handle preflight OPTIONS request
    if (req.method === 'OPTIONS') {
      res.setHeader('Access-Control-Max-Age', String(maxAge));
      res.statusCode = 204;
      res.end();
      return;
    }

    next();
  };
}
