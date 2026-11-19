'use client';
import { useCallback, useEffect, useState } from 'react';
import { api, vnd } from '@/lib/api';

export default function Packages() {
  const [rows, setRows] = useState<any[]>([]); const [me, setMe] = useState<any>(null); const [err, setErr] = useState('');
  const [f, setF] = useState({ name: '', sessions: '10', price: '', validDays: '180', description: '' });
  const load = useCallback(() => api('/packages/templates?all=1').then(setRows).catch((e) => setErr(e.message)), []);
  useEffect(() => { api('/auth/me').then(setMe); load(); }, [load]);
  const mgr = me?.role === 'MANAGER';
  const run = async (fn: () => Promise<any>) => { setErr(''); try { await fn(); await load(); } catch (x: any) { setErr(x.message); } };
  const edit = (t: any) => { const price = prompt(`Giá mới cho "${t.name}" (đ):`, String(t.price)); if (price) run(() => api(`/packages/templates/${t.id}`, { method: 'PATCH', body: { price: Number(price) } })); };
  return (
    <>
      <h1>Gói liệu trình trả trước</h1>
      {rows.some((r) => r.sample) && <div className="card" style={{ background: '#fff8e1' }}>⚠️ Các gói ghi "(mẫu)" là dữ liệu thử. {mgr ? 'Hãy sửa giá/số buổi hoặc ngừng bán và tạo gói thật của phòng khám.' : 'Quản lý cần cập nhật gói thật.'}</div>}
      {err && <div className="err">{err}</div>}
      <div className="card tbl"><table><thead><tr><th>Tên gói</th><th>Số buổi</th><th>Giá</th><th>Giá/buổi</th><th>Hạn dùng</th><th></th></tr></thead><tbody>
        {rows.map((t) => <tr key={t.id} style={{ opacity: t.active ? 1 : .5 }}><td>{t.name}</td><td>{t.sessions}</td><td>{vnd(t.price)}</td><td>{vnd(Math.round(t.price / t.sessions))}</td><td>{t.validDays} ngày</td>
          <td>{mgr && <><button className="sec" onClick={() => edit(t)}>Sửa giá</button> <button className="sec" onClick={() => run(() => api(`/packages/templates/${t.id}`, { method: 'PATCH', body: { active: !t.active } }))}>{t.active ? 'Ngừng bán' : 'Bán lại'}</button></>}</td></tr>)}
      </tbody></table></div>
      {mgr && <form className="card" onSubmit={(e) => { e.preventDefault(); run(() => api('/packages/templates', { body: { name: f.name, sessions: Number(f.sessions), price: Number(f.price), validDays: Number(f.validDays), description: f.description || undefined } }).then(() => setF({ ...f, name: '', price: '' }))); }}>
        <h2 style={{ marginTop: 0 }}>Thêm gói</h2>
        <div className="grid2"><div><label>Tên gói</label><input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} required /></div><div><label>Số buổi</label><input inputMode="numeric" value={f.sessions} onChange={(e) => setF({ ...f, sessions: e.target.value })} required /></div>
          <div><label>Giá (đ)</label><input inputMode="numeric" value={f.price} onChange={(e) => setF({ ...f, price: e.target.value })} required /></div><div><label>Hạn dùng (ngày)</label><input inputMode="numeric" value={f.validDays} onChange={(e) => setF({ ...f, validDays: e.target.value })} /></div></div>
        <p><button>Thêm gói</button></p></form>}
    </>
  );
}
