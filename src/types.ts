import { IncomingMessage, ServerResponse } from 'http';

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'OPTIONS' | 'HEAD' | 'ALL';

export interface Request extends IncomingMessage {
  /** Route parameters extracted from path patterns like /users/:id */
  params: Record<string, string>;
  /** Parsed query string parameters */
  query: Record<string, string | string[]>;
  /** Parsed request body (JSON or form data) */
  body: any;
  /** Parsed cookies from Cookie header */
  cookies: Record<string, string>;
  /** Original URL path without query string */
  path: string;
  /** HTTP method in uppercase */
  methodOverride?: string;
}

export interface Response extends ServerResponse {
  /** Send a JSON response with appropriate Content-Type header */
  json(data: any): void;
  /** Send a text or HTML response */
  send(body: string): void;
  /** Set the HTTP status code and return the response for chaining */
  status(code: number): Response;
  /** Send a redirect response (302 by default, or custom code) */
  redirect(url: string, code?: number): void;
  /** Set a cookie with optional options */
  cookie(name: string, value: string, options?: CookieOptions): Response;
  /** Status code to use (set by .status() for chaining) */
  _statusCode?: number;
}

export interface CookieOptions {
  maxAge?: number;
  expires?: Date;
  path?: string;
  domain?: string;
  secure?: boolean;
  httpOnly?: boolean;
  sameSite?: 'Strict' | 'Lax' | 'None';
}

export type Middleware = (req: Request, res: Response, next: () => void) => void | Promise<void>;

export type RouteHandler = (req: Request, res: Response) => void | Promise<void>;

export interface Route {
  method: HttpMethod;
  path: string;
  pattern: RegExp;
  paramNames: string[];
  handler: RouteHandler;
}

export interface RouteGroup {
  prefix: string;
  middleware: Middleware[];
  routes: Route[];
}
