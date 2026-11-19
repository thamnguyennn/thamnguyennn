export class ApiError extends Error {
  constructor(public status: number, message: string, public data?: any) { super(message); }
}

export async function api<T = any>(path: string, opts: { method?: string; body?: unknown } = {}): Promise<T> {
  const res = await fetch(`/api${path}`, {
    method: opts.method ?? (opts.body ? 'POST' : 'GET'),
    headers: opts.body ? { 'Content-Type': 'application/json' } : undefined,
    body: opts.body ? JSON.stringify(opts.body) : undefined,
    credentials: 'same-origin',
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    if (res.status === 401 && !path.startsWith('/auth/')) location.href = '/login';
    const msg = Array.isArray(data?.message) ? data.message.join(', ') : data?.message ?? 'Có lỗi xảy ra';
    throw new ApiError(res.status, msg, data);
  }
  return data as T;
}

export type Role = 'SALE' | 'RECEPTION' | 'DOCTOR' | 'THERAPIST' | 'MANAGER';
export const ROLE_LABEL: Record<Role, string> = { SALE: 'Sale', RECEPTION: 'Lễ tân', DOCTOR: 'Bác sĩ', THERAPIST: 'Trị liệu viên', MANAGER: 'Quản lý' };
export const STATUS_LABEL: Record<string, string> = { WAITING: 'Chờ khám', IN_EXAM: 'Đang khám', IN_TREATMENT: 'Đang điều trị', CHECKOUT: 'Chờ thu ngân', DONE: 'Hoàn tất', CANCELLED: 'Đã hủy', BOOKED: 'Đã hẹn', CONFIRMED: 'Đã xác nhận', CHECKED_IN: 'Đã đến', NO_SHOW: 'Không đến', NEW: 'Mới', CONTACTED: 'Đã liên hệ', VISITED: 'Đã đến khám', LOST: 'Mất khách' };
export const fmtTime = (s: string) => new Date(s).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Ho_Chi_Minh' });
export const fmtDateTime = (s: string) => new Date(s).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
