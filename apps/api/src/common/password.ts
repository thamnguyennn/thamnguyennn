import * as argon2 from 'argon2';
export const hashPassword = (p: string) => argon2.hash(p, { type: argon2.argon2id });
export const checkPassword = (hash: string, p: string) => argon2.verify(hash, p).catch(() => false);
// Tối thiểu 10 ký tự, có chữ và số
export const passwordProblem = (p: string): string | null =>
  p.length < 10 ? 'Mật khẩu tối thiểu 10 ký tự' : !/[A-Za-z]/.test(p) || !/\d/.test(p) ? 'Mật khẩu cần có cả chữ và số' : null;
