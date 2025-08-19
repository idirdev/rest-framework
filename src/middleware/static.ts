import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { Middleware, Request, Response } from '../types';
import { getMimeType } from '../utils/mime';

export interface StaticOptions {
  /** Root directory to serve files from */
  root: string;
  /** URL prefix to strip before looking up files (default: '') */
  prefix?: string;
  /** Serve index.html for directory requests (default: true) */
  index?: boolean;
  /** Enable ETag headers (default: true) */
  etag?: boolean;
}

export function staticFiles(options: StaticOptions): Middleware {
  const root = path.resolve(options.root);
  const prefix = options.prefix || '';
  const serveIndex = options.index !== false;
  const enableEtag = options.etag !== false;

  return (req: Request, res: Response, next: () => void): void => {
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      next();
      return;
    }

    let urlPath = req.path;

    // Strip prefix if configured
    if (prefix && urlPath.startsWith(prefix)) {
      urlPath = urlPath.substring(prefix.length) || '/';
    }

    // Prevent directory traversal
    const safePath = path.normalize(urlPath).replace(/^(\.\.[/\\])+/, '');
    let filePath = path.join(root, safePath);

    try {
      const stat = fs.statSync(filePath);

      if (stat.isDirectory()) {
        if (serveIndex) {
          filePath = path.join(filePath, 'index.html');
          if (!fs.existsSync(filePath)) { next(); return; }
        } else {
          next();
          return;
        }
      }

      const ext = path.extname(filePath);
      const mimeType = getMimeType(ext);
      const content = fs.readFileSync(filePath);

      // ETag support
      if (enableEtag) {
        const hash = crypto.createHash('md5').update(content).digest('hex');
        const etag = `"${hash}"`;
        res.setHeader('ETag', etag);

        // 304 Not Modified
        const ifNoneMatch = req.headers['if-none-match'];
        if (ifNoneMatch === etag) {
          res.statusCode = 304;
          res.end();
          return;
        }
      }

      res.statusCode = 200;
      res.setHeader('Content-Type', mimeType);
      res.setHeader('Content-Length', content.length);
      res.setHeader('Cache-Control', 'public, max-age=3600');

      if (req.method === 'HEAD') {
        res.end();
      } else {
        res.end(content);
      }
    } catch {
      // File not found, pass to next middleware/route
      next();
    }
  };
}
