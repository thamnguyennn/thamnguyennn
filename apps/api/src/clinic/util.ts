export const VN_TZ = 'Asia/Ho_Chi_Minh';
// Ngày theo giờ Việt Nam, dạng YYYY-MM-DD
export const vnDay = (d = new Date()) => new Intl.DateTimeFormat('en-CA', { timeZone: VN_TZ }).format(d);
export const dayRange = (day: string) => ({ gte: new Date(`${day}T00:00:00+07:00`), lt: new Date(new Date(`${day}T00:00:00+07:00`).getTime() + 86400000) });
// Chuẩn hóa SĐT Việt Nam: bỏ ký tự lạ, +84 → 0
export const normPhone = (p: string) => p.replace(/[^\d+]/g, '').replace(/^\+?84/, '0');
