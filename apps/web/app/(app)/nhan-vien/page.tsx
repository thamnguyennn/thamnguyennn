'use client';
import { useCallback, useEffect, useState } from 'react';
import { api, fmtDateTime, Role, ROLE_LABEL } from '@/lib/api';

export default function Staff() {
  const [users, setUsers] = useState<any[]>([]); const [audit, setAudit] = useState<any[]>([]); const [err, setErr] = useState(''); const [msg, setMsg] = useState('');
  const [f, setF] = useState({ username: '', fullName: '', role: 'THERAPIST' as Role, password: '' });
  const load = useCallback(() => { api('/users').then(setUsers).catch((e) => setErr(e.message)); api('/users/audit/recent').then(setAudit).catch(() => {}); }, []);
  useEffect(() => { load(); }, [load]);
  const act = async (fn: () => Promise<any>, ok?: string) => { setErr(''); setMsg(''); try { await fn(); if (ok) setMsg(ok); load(); } catch (e: any) { setErr(e.message); } };
  const create = (e: React.FormEvent) => { e.preventDefault(); act(async () => { await api('/users', { body: f }); setF({ ...f, username: '', fullName: '', password: '' }); }, 'Đã tạo tài khoản. Nhân viên sẽ phải đổi mật khẩu khi đăng nhập lần đầu.'); };
  const reset = (u: any) => { const password = prompt(`Mật khẩu tạm mới cho ${u.username} (≥10 ký tự, có chữ và số):`); if (password) act(() => api(`/users/${u.id}/reset-password`, { body: { password } }), 'Đã đặt lại mật khẩu'); };
  return (
    <>
      <h1>Nhân viên & Nhật ký truy cập</h1>
      {err && <div className="err">{err}</div>}{msg && <p className="ok">{msg}</p>}
      <div className="card tbl"><table>
        <thead><tr><th>Tài khoản</th><th>Họ tên</th><th>Vai trò</th><th>2FA</th><th></th></tr></thead>
        <tbody>{users.map((u) => <tr key={u.id} style={{ opacity: u.active ? 1 : .5 }}>
          <td>{u.username}</td><td>{u.fullName}</td><td>{ROLE_LABEL[u.role as Role]}</td><td>{u.totpEnabled ? '✔' : '—'}</td>
          <td><button className="sec" onClick={() => reset(u)}>Đặt lại MK</button>{' '}
            {u.totpEnabled && <button className="sec" onClick={() => confirm('Đặt lại 2FA (khi nhân viên mất điện thoại)?') && act(() => api(`/users/${u.id}/reset-2fa`, { body: {} }), 'Đã đặt lại 2FA')}>Đặt lại 2FA</button>}{' '}
            <button className="sec" onClick={() => act(() => api(`/users/${u.id}`, { method: 'PATCH', body: { active: !u.active } }))}>{u.active ? 'Khóa' : 'Mở khóa'}</button></td></tr>)}</tbody>
      </table></div>
      <form className="card" onSubmit={create}>
        <h2>Thêm nhân viên</h2>
        <div className="grid2">
          <div><label>Tên đăng nhập (chữ thường, không dấu)</label><input value={f.username} onChange={(e) => setF({ ...f, username: e.target.value.toLowerCase() })} pattern="[a-z0-9._-]{3,32}" required /></div>
          <div><label>Họ tên</label><input value={f.fullName} onChange={(e) => setF({ ...f, fullName: e.target.value })} required /></div>
          <div><label>Vai trò</label><select value={f.role} onChange={(e) => setF({ ...f, role: e.target.value as Role })}>{(Object.keys(ROLE_LABEL) as Role[]).map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}</select></div>
          <div><label>Mật khẩu tạm</label><input value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} required /></div>
        </div>
        <p><button>Tạo tài khoản</button></p>
      </form>
      <h2>Nhật ký truy cập (200 dòng gần nhất)</h2>
      <div className="card tbl"><table><thead><tr><th>Thời gian</th><th>Người dùng</th><th>Hành động</th><th>Đối tượng</th><th>IP</th></tr></thead>
        <tbody>{audit.map((a) => <tr key={a.id}><td>{fmtDateTime(a.at)}</td><td>{a.username ?? '—'}</td><td>{a.action}</td><td>{a.entity ?? ''} {a.entityId?.slice(0, 8) ?? ''}</td><td>{a.ip}</td></tr>)}</tbody></table></div>
    </>
  );
}
