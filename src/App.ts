import * as http from 'http';
import { Router } from './Router';
import { Request, Response, Middleware, CookieOptions } from './types';
import { parseQueryString } from './utils/querystring';

export class App extends Router {
  private server: http.Server | null = null;

  listen(port: number, callback?: () => void): http.Server {
    this.server = http.createServer((req, res) => this.handleRequest(req, res));
    this.server.listen(port, callback);
    return this.server;
  }

  close(): void {
    if (this.server) this.server.close();
  }

  private async handleRequest(rawReq: http.IncomingMessage, rawRes: http.ServerResponse): Promise<void> {
    const req = rawReq as Request;
    const res = rawRes as Response;

    // Parse URL
    const urlObj = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
    req.path = urlObj.pathname;
    req.query = parseQueryString(urlObj.search.slice(1));
    req.params = {};
    req.body = null;
    req.cookies = this.parseCookies(req.headers.cookie || '');

    // Method override support (via X-HTTP-Method-Override header or _method query)
    if (req.query._method && typeof req.query._method === 'string') {
      req.methodOverride = req.query._method.toUpperCase();
    } else if (req.headers['x-http-method-override']) {
      req.methodOverride = (req.headers['x-http-method-override'] as string).toUpperCase();
    }

    // Enhance response with helper methods
    this.enhanceResponse(res);

    // Run middleware stack, then route matching
    try {
      await this.runMiddlewareStack(req, res, this.middlewares, async () => {
        const method = req.methodOverride || req.method || 'GET';
        const result = this.matchRoute(method, req.path);

        if (!result) {
          res.status(404).json({ error: 'Not Found', path: req.path, method });
          return;
        }

        req.params = result.params;
        await result.route.handler(req, res);
      });
    } catch (err: any) {
      console.error('Unhandled error:', err);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Internal Server Error', message: err.message || 'Unknown error' });
      }
    }
  }

  private enhanceResponse(res: Response): void {
    res._statusCode = 200;

    res.status = function (code: number): Response {
      res._statusCode = code;
      res.statusCode = code;
      return res;
    };

    res.json = function (data: any): void {
      const body = JSON.stringify(data);
      res.statusCode = res._statusCode || 200;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.setHeader('Content-Length', Buffer.byteLength(body));
      res.end(body);
    };

    res.send = function (body: string): void {
      res.statusCode = res._statusCode || 200;
      const contentType = body.trim().startsWith('<') ? 'text/html' : 'text/plain';
      res.setHeader('Content-Type', `${contentType}; charset=utf-8`);
      res.setHeader('Content-Length', Buffer.byteLength(body));
      res.end(body);
    };

    res.redirect = function (url: string, code?: number): void {
      res.statusCode = code || 302;
      res.setHeader('Location', url);
      res.end();
    };

    res.cookie = function (name: string, value: string, options?: CookieOptions): Response {
      let cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)}`;
      if (options) {
        if (options.maxAge != null) cookie += `; Max-Age=${options.maxAge}`;
        if (options.expires) cookie += `; Expires=${options.expires.toUTCString()}`;
        if (options.path) cookie += `; Path=${options.path}`;
        if (options.domain) cookie += `; Domain=${options.domain}`;
        if (options.secure) cookie += `; Secure`;
        if (options.httpOnly) cookie += `; HttpOnly`;
        if (options.sameSite) cookie += `; SameSite=${options.sameSite}`;
      }
      res.setHeader('Set-Cookie', cookie);
      return res;
    };
  }

  private parseCookies(header: string): Record<string, string> {
    const cookies: Record<string, string> = {};
    if (!header) return cookies;
    header.split(';').forEach(pair => {
      const eqIndex = pair.indexOf('=');
      if (eqIndex === -1) return;
      const key = decodeURIComponent(pair.substring(0, eqIndex).trim());
      const val = decodeURIComponent(pair.substring(eqIndex + 1).trim());
      cookies[key] = val;
    });
    return cookies;
  }

  private runMiddlewareStack(req: Request, res: Response, stack: Middleware[], final: () => void | Promise<void>): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      let index = 0;
      const next = (): void => {
        if (res.headersSent) { resolve(); return; }
        if (index >= stack.length) {
          Promise.resolve(final()).then(resolve).catch(reject);
          return;
        }
        const mw = stack[index++];
        try {
          const result = mw(req, res, next);
          if (result && typeof result.catch === 'function') {
            result.catch(reject);
          }
        } catch (err) {
          reject(err);
        }
      };
      next();
    });
  }
}
