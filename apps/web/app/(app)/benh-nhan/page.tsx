'use client';
import { useEffect, useState } from 'react';
import { api, ApiError } from '@/lib/api';

const empty = { fullName: '', birthYear: '', gender: 'FEMALE', phone: '', address: '', occupation: '', consent: false };

export default function Patients() {
  const [q, setQ] = useState(''); const [list, setList] = useState<any[]>([]);
  const [form, setForm] = useState<any>(empty); const [show, setShow] = useState(false);
  const [dups, setDups] = useState<any[] | null>(null); const [msg, setMsg] = useState(''); const [err, setErr] = useState('');
  const [staff, setStaff] = useState<any[]>([]); const [doctor, setDoctor] = useState('');
  useEffect(() => { api('/users/staff').then(setStaff).catch(() => {}); }, []);
  useEffect(() => { const t = setTimeout(() => { q.trim().length >= 2 ? api(`/patients?q=${encodeURIComponent(q)}`).then(setList).catch((e) => setErr(e.message)) : setList([]); }, 250); return () => clearTimeout(t); }, [q]);

  const checkIn = async (id: string) => {
    setErr(''); setMsg('');
    try { const e = await api('/encounters/check-in', { body: { patientId: id, doctorId: doctor || undefined } }); setMsg(`Đã check-in: STT ${e.queueNo} – lần khám thứ ${e.visitNo}`); } catch (x: any) { setErr(x.message); }
  };
  const create = async (force = false) => {
    setErr(''); setMsg('');
    try {
      const p = await api('/patients', { body: { ...form, birthYear: Number(form.birthYear), force } });
      setMsg(`Đã tạo hồ sơ ${p.code}`); setShow(false); setForm(empty); setDups(null); setQ(p.code);
    } catch (x) { if (x instanceof ApiError && x.data?.code === 'POSSIBLE_DUPLICATE') setDups(x.data.duplicates); else setErr((x as Error).message); }
  };
  const set = (k: string) => (e: any) => setForm({ ...form, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });

  return (
    <>
      <h1>Bệnh nhân & Tiếp đón</h1>
      <div className="card">
        <label>Tìm theo SĐT, họ tên hoặc mã hồ sơ</label>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="VD: 0912… / Nguyễn / KPV-26-000001" autoFocus />
        <label>Bác sĩ phụ trách lượt khám (không bắt buộc)</label>
        <select value={doctor} onChange={(e) => setDoctor(e.target.value)}><option value="">— Chưa phân công —</option>{staff.filter((s) => s.role === 'DOCTOR').map((s) => <option key={s.id} value={s.id}>{s.fullName}</option>)}</select>
        {msg && <p className="ok"><b>{msg}</b></p>}{err && <div className="err">{err}</div>}
        <div className="tbl"><table><tbody>
          {list.map((p) => (
            <tr key={p.id}><td><b>{p.fullName}</b><br /><span className="mut">{p.code} · {p.birthYear} · {p.phone}</span></td><td style={{ textAlign: 'right' }}><button onClick={() => checkIn(p.id)}>Check-in</button></td></tr>
          ))}
        </tbody></table></div>
        {q.trim().length >= 2 && !list.length && <p className="mut">Không tìm thấy. Hãy tạo hồ sơ mới.</p>}
        <button className="sec" onClick={() => setShow(!show)}>{show ? 'Đóng' : '+ Bệnh nhân mới'}</button>
      </div>

      {show && (
        <form className="card" onSubmit={(e) => { e.preventDefault(); create(); }}>
          <h2>Hồ sơ mới</h2>
          <div className="grid2">
            <div><label>Họ và tên *</label><input value={form.fullName} onChange={set('fullName')} required /></div>
            <div><label>Số điện thoại *</label><input inputMode="tel" value={form.phone} onChange={set('phone')} required /></div>
            <div><label>Năm sinh *</label><input inputMode="numeric" value={form.birthYear} onChange={set('birthYear')} required /></div>
            <div><label>Giới tính *</label><select value={form.gender} onChange={set('gender')}><option value="FEMALE">Nữ</option><option value="MALE">Nam</option><option value="OTHER">Khác</option></select></div>
            <div><label>Nghề nghiệp</label><input value={form.occupation} onChange={set('occupation')} /></div>
            <div><label>Địa chỉ</label><input value={form.address} onChange={set('address')} /></div>
          </div>
          <label style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginTop: 14 }}>
            <input type="checkbox" style={{ width: 'auto', marginTop: 4 }} checked={form.consent} onChange={set('consent')} />
            <span>Bệnh nhân đã được giải thích và <b>đồng ý</b> cho phòng khám thu thập, xử lý dữ liệu cá nhân và dữ liệu sức khỏe để khám chữa bệnh.</span>
          </label>
          {dups && (
            <div className="card" style={{ background: '#fff8e1' }}>
              <b>Có thể đã có hồ sơ trùng (cùng SĐT và năm sinh):</b>
              {dups.map((d) => <div key={d.id}>{d.fullName} – {d.code} – {d.phone} <button type="button" className="sec" onClick={() => { setQ(d.code); setShow(false); }}>Dùng hồ sơ này</button></div>)}
              <button type="button" className="sec" onClick={() => create(true)}>Vẫn tạo hồ sơ mới</button>
            </div>
          )}
          <p><button disabled={!form.consent}>Lưu hồ sơ</button></p>
        </form>
      )}
    </>
  );
}
