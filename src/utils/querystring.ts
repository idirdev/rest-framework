/**
 * Parse a query string into a key-value object.
 * Supports duplicate keys (values become arrays).
 * Input should NOT include the leading '?'.
 */
export function parseQueryString(qs: string): Record<string, string | string[]> {
  const result: Record<string, string | string[]> = {};
  if (!qs) return result;

  qs.split('&').forEach(pair => {
    if (!pair) return;
    const eqIndex = pair.indexOf('=');
    let key: string;
    let val: string;
    if (eqIndex === -1) {
      key = decodeURIComponent(pair);
      val = '';
    } else {
      key = decodeURIComponent(pair.substring(0, eqIndex));
      val = decodeURIComponent(pair.substring(eqIndex + 1));
    }

    if (key in result) {
      const existing = result[key];
      if (Array.isArray(existing)) {
        existing.push(val);
      } else {
        result[key] = [existing, val];
      }
    } else {
      result[key] = val;
    }
  });

  return result;
}

/**
 * Serialize an object into a query string (without leading '?').
 */
export function serializeQueryString(params: Record<string, string | string[] | number | boolean>): string {
  const parts: string[] = [];
  for (const [key, value] of Object.entries(params)) {
    const encodedKey = encodeURIComponent(key);
    if (Array.isArray(value)) {
      for (const v of value) {
        parts.push(`${encodedKey}=${encodeURIComponent(v)}`);
      }
    } else {
      parts.push(`${encodedKey}=${encodeURIComponent(String(value))}`);
    }
  }
  return parts.join('&');
}
