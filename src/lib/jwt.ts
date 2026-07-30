/**
 * Direct port of train-db-frontend/lib/jwt.ts. Decodes (does NOT verify -
 * that's the backend's job) a JWT payload to read its `exp` claim, so the
 * app can proactively refresh a near-expiry access token instead of waiting
 * for an API call to fail with 401 first.
 *
 * Base64 is decoded by hand rather than via `atob`/`Buffer` - neither is
 * guaranteed to exist (and isn't typed) in a bare Hermes/RN environment
 * without extra polyfills, and this is a tiny, dependency-free amount of
 * logic to own directly.
 */
const BASE64_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

function decodeBase64(input: string): string {
  const clean = input.replace(/=+$/, '');
  let bits = '';
  for (const char of clean) {
    const index = BASE64_CHARS.indexOf(char);
    if (index === -1) continue;
    bits += index.toString(2).padStart(6, '0');
  }

  let output = '';
  for (let i = 0; i + 8 <= bits.length; i += 8) {
    output += String.fromCharCode(parseInt(bits.slice(i, i + 8), 2));
  }
  return output;
}

export function getJwtExpiryMillis(token: string): number | null {
  try {
    const [, payloadSegment] = token.split('.');
    if (!payloadSegment) return null;

    const base64 = payloadSegment.replace(/-/g, '+').replace(/_/g, '/');
    const bytes = decodeBase64(base64);
    // Bytes are Latin-1-per-char at this point; decodeURIComponent + escape
    // turns that back into a proper UTF-8 string for JSON.parse.
    const json = decodeURIComponent(
      bytes
        .split('')
        .map((c) => '%' + c.charCodeAt(0).toString(16).padStart(2, '0'))
        .join(''),
    );
    const payload = JSON.parse(json) as { exp?: number };

    return typeof payload.exp === 'number' ? payload.exp * 1000 : null;
  } catch {
    return null;
  }
}
