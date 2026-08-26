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
    const json = decodeURIComponent(
      bytes
        .split('')
        .map((c) => '%' + c.charCodeAt(0).toString(16).padStart(2, '0'))
        .join(''),
    );
    const payload = JSON.parse(json) as {
      exp?: number;
    };
    return typeof payload.exp === 'number' ? payload.exp * 1000 : null;
  } catch {
    return null;
  }
}
