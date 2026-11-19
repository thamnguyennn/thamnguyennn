import { createCipheriv, createDecipheriv, createHash, createHmac, randomBytes, timingSafeEqual } from 'crypto';

function dataKey(): Buffer {
  const hex = process.env.DATA_KEY ?? '';
  if (!/^[0-9a-f]{64}$/i.test(hex)) throw new Error('DATA_KEY phải là 64 ký tự hex');
  return Buffer.from(hex, 'hex');
}

export function encrypt(plain: string): string {
  const iv = randomBytes(12);
  const c = createCipheriv('aes-256-gcm', dataKey(), iv);
  const enc = Buffer.concat([c.update(plain, 'utf8'), c.final()]);
  return [iv, c.getAuthTag(), enc].map((b) => b.toString('base64')).join('.');
}

export function decrypt(blob: string): string {
  const [iv, tag, enc] = blob.split('.').map((s) => Buffer.from(s, 'base64'));
  const d = createDecipheriv('aes-256-gcm', dataKey(), iv);
  d.setAuthTag(tag);
  return Buffer.concat([d.update(enc), d.final()]).toString('utf8');
}

export const sha256 = (s: string) => createHash('sha256').update(s).digest('hex');
export const newToken = () => randomBytes(32).toString('base64url');

// "Vé" ngắn hạn giữa bước mật khẩu và bước mã 2FA
export function signTicket(userId: string, ttlSec = 300): string {
  const body = Buffer.from(JSON.stringify({ u: userId, e: Date.now() + ttlSec * 1000 })).toString('base64url');
  const sig = createHmac('sha256', process.env.APP_SECRET ?? '').update(body).digest('base64url');
  return `${body}.${sig}`;
}

export function verifyTicket(ticket: string): string | null {
  const [body, sig] = (ticket ?? '').split('.');
  if (!body || !sig) return null;
  const exp = createHmac('sha256', process.env.APP_SECRET ?? '').update(body).digest('base64url');
  const a = Buffer.from(sig), b = Buffer.from(exp);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  const p = JSON.parse(Buffer.from(body, 'base64url').toString());
  return p.e > Date.now() ? p.u : null;
}
