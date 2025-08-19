import { Middleware, Request, Response } from '../types';

interface BodyParserOptions {
  /** Maximum body size in bytes (default: 1MB) */
  limit?: number;
  /** Enable JSON parsing (default: true) */
  json?: boolean;
  /** Enable URL-encoded form parsing (default: true) */
  urlencoded?: boolean;
}

export function bodyParser(options: BodyParserOptions = {}): Middleware {
  const limit = options.limit || 1024 * 1024; // 1MB default
  const parseJson = options.json !== false;
  const parseUrlencoded = options.urlencoded !== false;

  return (req: Request, res: Response, next: () => void): void => {
    const method = req.method?.toUpperCase();
    if (!method || method === 'GET' || method === 'HEAD' || method === 'OPTIONS') {
      req.body = null;
      next();
      return;
    }

    const contentType = (req.headers['content-type'] || '').toLowerCase();
    const contentLength = parseInt(req.headers['content-length'] || '0', 10);

    // Check content-length limit upfront if available
    if (contentLength > limit) {
      res.status(413).json({ error: 'Payload Too Large', limit });
      return;
    }

    // Detect multipart (not parsed, just flagged)
    if (contentType.includes('multipart/form-data')) {
      req.body = null;
      next();
      return;
    }

    const chunks: Buffer[] = [];
    let totalSize = 0;

    req.on('data', (chunk: Buffer) => {
      totalSize += chunk.length;
      if (totalSize > limit) {
        res.status(413).json({ error: 'Payload Too Large', limit });
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });

    req.on('end', () => {
      const raw = Buffer.concat(chunks).toString('utf-8');

      if (parseJson && contentType.includes('application/json')) {
        try {
          req.body = JSON.parse(raw);
        } catch {
          res.status(400).json({ error: 'Invalid JSON body' });
          return;
        }
      } else if (parseUrlencoded && contentType.includes('application/x-www-form-urlencoded')) {
        req.body = parseForm(raw);
      } else {
        req.body = raw || null;
      }

      next();
    });

    req.on('error', () => {
      res.status(400).json({ error: 'Request body read error' });
    });
  };
}

function parseForm(raw: string): Record<string, string> {
  const result: Record<string, string> = {};
  if (!raw) return result;
  raw.split('&').forEach(pair => {
    const eqIndex = pair.indexOf('=');
    if (eqIndex === -1) {
      result[decodeURIComponent(pair)] = '';
    } else {
      const key = decodeURIComponent(pair.substring(0, eqIndex));
      const val = decodeURIComponent(pair.substring(eqIndex + 1));
      result[key] = val;
    }
  });
  return result;
}
