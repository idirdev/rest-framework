import { describe, it, expect } from 'vitest';
import { Router } from '../src/Router';
import { parseQueryString, serializeQueryString } from '../src/utils/querystring';
import { getMimeType } from '../src/utils/mime';

describe('Router', () => {
  it('registers and matches a GET route', () => {
    const router = new Router();
    router.get('/users', () => {});
    const result = router.matchRoute('GET', '/users');
    expect(result).not.toBeNull();
    expect(result!.route.method).toBe('GET');
    expect(result!.route.path).toBe('/users');
  });

  it('registers and matches routes for different methods', () => {
    const router = new Router();
    router.post('/items', () => {});
    router.put('/items/:id', () => {});
    router.delete('/items/:id', () => {});
    router.patch('/items/:id', () => {});

    expect(router.matchRoute('POST', '/items')).not.toBeNull();
    expect(router.matchRoute('PUT', '/items/1')).not.toBeNull();
    expect(router.matchRoute('DELETE', '/items/1')).not.toBeNull();
    expect(router.matchRoute('PATCH', '/items/1')).not.toBeNull();
  });

  it('extracts route parameters', () => {
    const router = new Router();
    router.get('/users/:id', () => {});
    const result = router.matchRoute('GET', '/users/42');
    expect(result).not.toBeNull();
    expect(result!.params).toEqual({ id: '42' });
  });

  it('extracts multiple route parameters', () => {
    const router = new Router();
    router.get('/users/:userId/posts/:postId', () => {});
    const result = router.matchRoute('GET', '/users/5/posts/10');
    expect(result).not.toBeNull();
    expect(result!.params).toEqual({ userId: '5', postId: '10' });
  });

  it('returns null for unmatched routes', () => {
    const router = new Router();
    router.get('/users', () => {});
    expect(router.matchRoute('GET', '/posts')).toBeNull();
  });

  it('returns null for wrong method', () => {
    const router = new Router();
    router.get('/users', () => {});
    expect(router.matchRoute('POST', '/users')).toBeNull();
  });

  it('matches ALL method for any HTTP method', () => {
    const router = new Router();
    router.all('/health', () => {});
    expect(router.matchRoute('GET', '/health')).not.toBeNull();
    expect(router.matchRoute('POST', '/health')).not.toBeNull();
    expect(router.matchRoute('DELETE', '/health')).not.toBeNull();
  });

  it('normalizes paths with trailing slashes', () => {
    const router = new Router();
    router.get('/users/', () => {});
    const result = router.matchRoute('GET', '/users');
    expect(result).not.toBeNull();
  });

  it('handles route groups with prefix', () => {
    const router = new Router();
    router.group('/api', (sub) => {
      sub.get('/users', () => {});
      sub.post('/users', () => {});
    });
    expect(router.matchRoute('GET', '/api/users')).not.toBeNull();
    expect(router.matchRoute('POST', '/api/users')).not.toBeNull();
    expect(router.matchRoute('GET', '/users')).toBeNull();
  });

  it('decodes URL-encoded route parameters', () => {
    const router = new Router();
    router.get('/search/:query', () => {});
    const result = router.matchRoute('GET', '/search/hello%20world');
    expect(result).not.toBeNull();
    expect(result!.params.query).toBe('hello world');
  });
});

describe('parseQueryString', () => {
  it('parses simple key-value pairs', () => {
    expect(parseQueryString('a=1&b=2')).toEqual({ a: '1', b: '2' });
  });

  it('returns empty object for empty string', () => {
    expect(parseQueryString('')).toEqual({});
  });

  it('handles keys without values', () => {
    expect(parseQueryString('flag')).toEqual({ flag: '' });
  });

  it('handles duplicate keys as arrays', () => {
    const result = parseQueryString('tag=a&tag=b&tag=c');
    expect(result.tag).toEqual(['a', 'b', 'c']);
  });

  it('decodes URI components', () => {
    const result = parseQueryString('name=hello%20world&q=a%26b');
    expect(result.name).toBe('hello world');
    expect(result.q).toBe('a&b');
  });
});

describe('serializeQueryString', () => {
  it('serializes simple key-value pairs', () => {
    expect(serializeQueryString({ a: '1', b: '2' })).toBe('a=1&b=2');
  });

  it('serializes arrays as duplicate keys', () => {
    const result = serializeQueryString({ tag: ['a', 'b'] });
    expect(result).toBe('tag=a&tag=b');
  });

  it('encodes special characters', () => {
    const result = serializeQueryString({ q: 'hello world' });
    expect(result).toBe('q=hello%20world');
  });

  it('handles numeric and boolean values', () => {
    const result = serializeQueryString({ n: 42, flag: true });
    expect(result).toContain('n=42');
    expect(result).toContain('flag=true');
  });
});

describe('getMimeType', () => {
  it('returns correct MIME types', () => {
    expect(getMimeType('.html')).toBe('text/html; charset=utf-8');
    expect(getMimeType('.css')).toBe('text/css; charset=utf-8');
    expect(getMimeType('.js')).toBe('application/javascript; charset=utf-8');
    expect(getMimeType('.json')).toBe('application/json; charset=utf-8');
    expect(getMimeType('.png')).toBe('image/png');
    expect(getMimeType('.jpg')).toBe('image/jpeg');
  });

  it('returns octet-stream for unknown extensions', () => {
    expect(getMimeType('.xyz')).toBe('application/octet-stream');
  });

  it('is case-insensitive', () => {
    expect(getMimeType('.HTML')).toBe('text/html; charset=utf-8');
    expect(getMimeType('.PNG')).toBe('image/png');
  });
});
