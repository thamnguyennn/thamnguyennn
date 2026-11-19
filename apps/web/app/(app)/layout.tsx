'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { api, Role, ROLE_LABEL } from '@/lib/api';

type Me = { fullName: string; role: Role; mustChangePassword: boolean };
const NAV: { href: string; label: string; roles: Role[] }[] = [
  { href: '/hom-nay', label: 'Hôm nay / Hàng đợi', roles: ['RECEPTION', 'DOCTOR', 'THERAPIST', 'MANAGER'] },
  { href: '/benh-nhan', label: 'Bệnh nhân & Tiếp đón', roles: ['RECEPTION', 'MANAGER'] },
  { href: '/lieu-trinh', label: 'Liệu trình', roles: ['RECEPTION', 'DOCTOR', 'THERAPIST', 'MANAGER'] },
  { href: '/nhac-lich', label: 'Nhắc lịch & chăm sóc', roles: ['SALE', 'RECEPTION', 'MANAGER'] },
  { href: '/thu-ngan', label: 'Thu ngân', roles: ['RECEPTION', 'MANAGER'] },
  { href: '/thuoc', label: 'Thuốc & kho', roles: ['RECEPTION', 'DOCTOR', 'MANAGER'] },
  { href: '/goi', label: 'Gói liệu trình', roles: ['RECEPTION', 'MANAGER', 'DOCTOR'] },
  { href: '/lich-hen', label: 'Khách & Lịch hẹn', roles: ['SALE', 'RECEPTION', 'DOCTOR', 'THERAPIST', 'MANAGER'] },
  { href: '/nhan-vien', label: 'Nhân viên & Nhật ký', roles: ['MANAGER'] },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [me, setMe] = useState<Me | null>(null); const [open, setOpen] = useState(false);
  const path = usePathname();
  useEffect(() => { api('/auth/me').then(setMe).catch(() => {}); }, []);
  useEffect(() => setOpen(false), [path]);
  if (!me) return <div className="center mut">Đang tải…</div>;
  if (me.mustChangePassword) return <ChangePassword />;
  const nav = NAV.filter((n) => n.roles.includes(me.role));
  const logout = async () => { await api('/auth/logout', { method: 'POST', body: {} }); location.href = '/login'; };
  return (
    <div className="shell">
      <div className="top"><button className="sec" onClick={() => setOpen(!open)} aria-label="Menu">☰</button><img src="/logo.jpg" alt="" /><b>{me.fullName}</b></div>
      <aside className={`side ${open ? 'open' : ''}`}>
        <img src="/logo.jpg" alt="Khởi Phúc Việt Movia" />
        {nav.map((n) => <Link key={n.href} href={n.href} className={`nav ${path.startsWith(n.href) ? 'on' : ''}`}>{n.label}</Link>)}
        <div style={{ marginTop: 'auto' }} className="mut">
          <div><b>{me.fullName}</b></div><div>{ROLE_LABEL[me.role]}</div>
          <button className="sec" style={{ marginTop: 8, width: '100%' }} onClick={logout}>Đăng xuất</button>
        </div>
      </aside>
      <main className="main">{children}</main>
    </div>
  );
}

function ChangePassword() {
  const [o, setO] = useState(''); const [n, setN] = useState(''); const [err, setErr] = useState('');
  const submit = async (e: React.FormEvent) => { e.preventDefault(); setErr(''); try { await api('/auth/change-password', { body: { oldPassword: o, newPassword: n } }); location.reload(); } catch (x: any) { setErr(x.message); } };
  return (
    <div className="center"><img src="/logo.jpg" alt="" />
      <form className="card" onSubmit={submit}>
        <b>Đổi mật khẩu lần đầu</b>
        <label>Mật khẩu hiện tại</label><input type="password" value={o} onChange={(e) => setO(e.target.value)} required />
        <label>Mật khẩu mới (≥ 10 ký tự, có chữ và số)</label><input type="password" value={n} onChange={(e) => setN(e.target.value)} required />
        {err && <div className="err">{err}</div>}<p><button style={{ width: '100%' }}>Đổi mật khẩu</button></p>
      </form></div>
  );
}
