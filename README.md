# rest-framework

![Zero Dependencies](https://img.shields.io/badge/dependencies-0-brightgreen)
![TypeScript](https://img.shields.io/badge/TypeScript-4.1-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Node.js](https://img.shields.io/badge/node-%3E%3D12-green)

A lightweight REST framework built directly on the Node.js `http` module. Zero runtime dependencies. Express-like API, built from scratch.

## Why?

| Feature | Express | rest-framework |
|---------|---------|----------------|
| Dependencies | 30+ packages | **0** |
| Bundle size | ~550 KB | **~15 KB** |
| TypeScript | @types/express needed | **Built-in** |
| Body parsing | Requires body-parser | **Built-in** |
| CORS | Requires cors package | **Built-in** |
| Static files | express.static | **Built-in** |
| Learning curve | Large API surface | **Minimal, familiar** |

## Quick Start

```typescript
import { App } from './src/App';
import { bodyParser } from './src/middleware/bodyParser';
import { cors } from './src/middleware/cors';
import { logger } from './src/middleware/logger';

const app = new App();

app.use(logger());
app.use(cors());
app.use(bodyParser());

app.get('/hello', (req, res) => {
  res.json({ message: 'Hello, world!' });
});

app.get('/users/:id', (req, res) => {
  res.json({ userId: req.params.id });
});

app.post('/users', (req, res) => {
  res.status(201).json({ created: req.body });
});

app.listen(3000, () => console.log('Running on port 3000'));
```

## API

### App

Extends `Router`. The main application class.

```typescript
const app = new App();
app.listen(port, callback?);  // Start the server
app.close();                   // Stop the server
```

### Routing

```typescript
app.get(path, handler);     // GET route
app.post(path, handler);    // POST route
app.put(path, handler);     // PUT route
app.patch(path, handler);   // PATCH route
app.delete(path, handler);  // DELETE route
app.all(path, handler);     // Match any method
```

### Route Parameters

```typescript
app.get('/users/:id', (req, res) => {
  console.log(req.params.id); // extracted from URL
});

app.get('/posts/:postId/comments/:commentId', (req, res) => {
  // Multiple params supported
});
```

### Route Groups

```typescript
app.group('/api/v1', (router) => {
  router.get('/users', listUsers);
  router.post('/users', createUser);
  router.get('/users/:id', getUser);
});

// With group-level middleware
app.group('/admin', [authMiddleware], (router) => {
  router.get('/dashboard', dashboard);
});
```

### Request Object

Extended `IncomingMessage` with:
- `req.params` -- Route parameters (`:id` segments)
- `req.query` -- Parsed query string
- `req.body` -- Parsed request body
- `req.cookies` -- Parsed cookies
- `req.path` -- URL path without query string

### Response Object

Extended `ServerResponse` with:
- `res.json(data)` -- Send JSON response
- `res.send(body)` -- Send text/HTML response
- `res.status(code)` -- Set status code (chainable)
- `res.redirect(url, code?)` -- Redirect (302 default)
- `res.cookie(name, value, options?)` -- Set cookie

## Built-in Middleware

### Body Parser

```typescript
app.use(bodyParser({
  limit: 1024 * 1024,  // 1MB max (default)
  json: true,           // Parse JSON bodies
  urlencoded: true,     // Parse form bodies
}));
```

### CORS

```typescript
app.use(cors({
  origin: '*',                          // or ['https://example.com']
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type'],
  credentials: true,
  maxAge: 86400,
}));
```

### Static Files

```typescript
import { staticFiles } from './src/middleware/static';

app.use(staticFiles({
  root: './public',     // Directory to serve from
  prefix: '/static',    // URL prefix (optional)
  index: true,          // Serve index.html for directories
  etag: true,           // Enable ETag + 304 support
}));
```

### Logger

```typescript
app.use(logger({
  colors: true,  // Colored terminal output
  format: (method, url, status, duration) => {
    return `${method} ${url} -> ${status} (${duration}ms)`;
  },
}));
```

Output:
```
GET     /users 200 3ms
POST    /users 201 5ms
DELETE  /users/1 200 2ms
```

## Method Override

Support for clients that only send GET/POST:

```
POST /resource?_method=DELETE
```

Or via header:
```
X-HTTP-Method-Override: PUT
```

## Running the Example

```bash
npm run build
npm run example
```

Then test with curl:
```bash
curl http://localhost:3000/
curl http://localhost:3000/todos
curl -X POST http://localhost:3000/todos -H "Content-Type: application/json" -d '{"title":"New task"}'
curl -X PATCH http://localhost:3000/todos/1 -H "Content-Type: application/json" -d '{"done":true}'
curl -X DELETE http://localhost:3000/todos/1
```

## Project Structure

```
src/
  index.ts               Public API exports
  types.ts               TypeScript type definitions
  Router.ts              Route registration and matching
  App.ts                 HTTP server, request/response handling
  middleware/
    bodyParser.ts        JSON and form body parsing
    cors.ts              CORS headers and preflight
    static.ts            Static file serving with ETag
    logger.ts            Request logging with colors
  utils/
    mime.ts              MIME type lookup
    querystring.ts       Query string parse/serialize
examples/
  basic.ts               Todo API example
```

## License

MIT
