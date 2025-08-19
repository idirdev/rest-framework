import { Route, RouteHandler, HttpMethod, Middleware, Request, Response } from './types';

export class Router {
  protected routes: Route[] = [];
  protected middlewares: Middleware[] = [];

  use(middleware: Middleware): void {
    this.middlewares.push(middleware);
  }

  get(path: string, handler: RouteHandler): void {
    this.addRoute('GET', path, handler);
  }

  post(path: string, handler: RouteHandler): void {
    this.addRoute('POST', path, handler);
  }

  put(path: string, handler: RouteHandler): void {
    this.addRoute('PUT', path, handler);
  }

  patch(path: string, handler: RouteHandler): void {
    this.addRoute('PATCH', path, handler);
  }

  delete(path: string, handler: RouteHandler): void {
    this.addRoute('DELETE', path, handler);
  }

  all(path: string, handler: RouteHandler): void {
    this.addRoute('ALL', path, handler);
  }

  /**
   * Create a route group with a shared prefix and optional middleware.
   * Callback receives a sub-router whose routes are mounted under the prefix.
   */
  group(prefix: string, callback: (router: Router) => void): void;
  group(prefix: string, middleware: Middleware[], callback: (router: Router) => void): void;
  group(prefix: string, middlewareOrCb: Middleware[] | ((router: Router) => void), callback?: (router: Router) => void): void {
    const mw = Array.isArray(middlewareOrCb) ? middlewareOrCb : [];
    const cb = typeof middlewareOrCb === 'function' ? middlewareOrCb : callback!;

    const subRouter = new Router();
    cb(subRouter);

    for (const route of subRouter.routes) {
      const fullPath = this.normalizePath(prefix + route.path);
      const { pattern, paramNames } = this.compilePath(fullPath);

      // Wrap handler with group middleware
      const wrappedHandler: RouteHandler = async (req: Request, res: Response) => {
        let index = 0;
        const runMiddleware = (): void => {
          if (index < mw.length) {
            const current = mw[index++];
            current(req, res, runMiddleware);
          } else {
            route.handler(req, res);
          }
        };
        runMiddleware();
      };

      this.routes.push({
        method: route.method,
        path: fullPath,
        pattern,
        paramNames,
        handler: wrappedHandler,
      });
    }
  }

  protected addRoute(method: HttpMethod, path: string, handler: RouteHandler): void {
    const normalizedPath = this.normalizePath(path);
    const { pattern, paramNames } = this.compilePath(normalizedPath);
    this.routes.push({ method, path: normalizedPath, pattern, paramNames, handler });
  }

  protected compilePath(path: string): { pattern: RegExp; paramNames: string[] } {
    const paramNames: string[] = [];
    const regexStr = path.replace(/:([a-zA-Z_][a-zA-Z0-9_]*)/g, (_, name) => {
      paramNames.push(name);
      return '([^/]+)';
    });
    const pattern = new RegExp(`^${regexStr}$`);
    return { pattern, paramNames };
  }

  matchRoute(method: string, path: string): { route: Route; params: Record<string, string> } | null {
    const effectiveMethod = method.toUpperCase();
    for (const route of this.routes) {
      if (route.method !== 'ALL' && route.method !== effectiveMethod) continue;
      const match = route.pattern.exec(path);
      if (match) {
        const params: Record<string, string> = {};
        route.paramNames.forEach((name, i) => {
          params[name] = decodeURIComponent(match[i + 1]);
        });
        return { route, params };
      }
    }
    return null;
  }

  protected normalizePath(path: string): string {
    if (!path.startsWith('/')) path = '/' + path;
    if (path.length > 1 && path.endsWith('/')) path = path.slice(0, -1);
    return path.replace(/\/+/g, '/');
  }
}
