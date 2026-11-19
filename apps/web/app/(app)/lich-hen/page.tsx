'use client';
import { Suspense, useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { api, fmtTime, ROLE_LABEL, STATUS_LABEL } from '@/lib/api';

const today = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' }).format(new Date());

export default function AppointmentsPage() { return <Suspense><Appointments /></Suspense>; }

function Appointments() {
  const qs = useSearchParams();
  const [day, setDay] = useState(today()); const [appts, setAppts] = useState<any[]>([]);
  const [leads, setLeads] = useState<any[]>([]); const [sources, setSources] = useState<any[]>([]); const [staff, setStaff] = useState<any[]>([]);
  const [lead, setLead] = useState({ fullName: '', phone: '', sourceId: '', note: '' });
  const [ap, setAp] = useState<any>({ leadId: qs.get('lead') ?? '', patientId: qs.get('patient') ?? '', fullName: qs.get('name') ?? '', phone: qs.get('phone') ?? '', when: '', doctorId: '' });
  const [err, setErr] = useState(''); const [me, setMe] = useState<any>(null);

  const load = useCallback(() => {
    api(`/appointments?day=${day}`).then(setAppts).catch((e) => setErr(e.message));
    api('/leads').then(setLeads).catch(() => setLeads([]));
  }, [day]);
  useEffect(() => { load(); }, [load]);
  useEffect(() => { api('/leads/sources').then(setSources); api('/users/staff').then(setStaff); api('/auth/me').then(setMe); }, []);

  const canBook = me && ['SALE', 'RECEPTION', 'MANAGER'].includes(me.role);
  const addLead = async (e: React.FormEvent) => { e.preventDefault(); setErr(''); try { await api('/leads', { body: { ...lead, sourceId: lead.sourceId || undefined } }); setLead({ fullName: '', phone: '', sourceId: '', note: '' }); load(); } catch (x: any) { setErr(x.message); } };
  const book = async (e: React.FormEvent) => {
    e.preventDefault(); setErr('');
    try { await api('/appointments', { body: { leadId: ap.leadId || undefined, patientId: ap.patientId || undefined, fullName: ap.fullName, phone: ap.phone, startAt: new Date(ap.when).toISOString(), doctorId: ap.doctorId || undefined } }); setAp({ leadId: '', patientId: '', fullName: '', phone: '', when: '', doctorId: '' }); load(); } catch (x: any) { setErr(x.message); }
  };
  const pick = (id: string) => { const l = leads.find((x) => x.id === id); setAp({ ...ap, leadId: id, fullName: l?.fullName ?? ap.fullName, phone: l?.phone ?? ap.phone }); };
  const cancel = async (id: string) => { if (confirm('Hủy lịch hẹn này?')) { await api(`/appointments/${id}`, { method: 'PATCH', body: { status: 'CANCELLED' } }); load(); } };
  const nameOf = (id?: string) => staff.find((s) => s.id === id)?.fullName ?? '—';

  return (
    <>
      <h1>Khách & Lịch hẹn</h1>
      {err && <div className="err">{err}</div>}
      <div className="card">
        <div className="row" style={{ alignItems: 'end' }}><div><label>Ngày</label><input type="date" value={day} onChange={(e) => setDay(e.target.value)} /></div></div>
        <div className="tbl"><table>
          <thead><tr><th>Giờ</th><th>Khách</th><th>SĐT</th><th>Bác sĩ</th><th>Trạng thái</th><th></th></tr></thead>
          <tbody>
            {appts.map((a) => <tr key={a.id}><td>{fmtTime(a.startAt)}</td><td>{a.fullName}</td><td>{a.phone}</td><td>{nameOf(a.doctorId)}</td><td><span className="badge">{STATUS_LABEL[a.status]}</span></td>
              <td>{canBook && a.status === 'BOOKED' && <button className="sec" onClick={() => cancel(a.id)}>Hủy</button>}</td></tr>)}
            {!appts.length && <tr><td colSpan={6} className="mut">Không có lịch hẹn.</td></tr>}
          </tbody></table></div>
      </div>

      {canBook && <>
        <form className="card" onSubmit={book}>
          <h2>Đặt lịch hẹn</h2>
          <label>Chọn từ khách đã ghi nhận (không bắt buộc)</label>
          <select value={ap.leadId} onChange={(e) => pick(e.target.value)}><option value="">— Nhập tay —</option>{leads.filter((l) => l.status !== 'VISITED').map((l) => <option key={l.id} value={l.id}>{l.fullName} – {l.phone}</option>)}</select>
          <div className="grid2">
            <div><label>Họ tên</label><input value={ap.fullName} onChange={(e) => setAp({ ...ap, fullName: e.target.value })} required /></div>
            <div><label>SĐT</label><input inputMode="tel" value={ap.phone} onChange={(e) => setAp({ ...ap, phone: e.target.value })} required /></div>
            <div><label>Ngày giờ hẹn</label><input type="datetime-local" value={ap.when} onChange={(e) => setAp({ ...ap, when: e.target.value })} required /></div>
            <div><label>Bác sĩ</label><select value={ap.doctorId} onChange={(e) => setAp({ ...ap, doctorId: e.target.value })}><option value="">— Chưa chọn —</option>{staff.filter((s) => s.role === 'DOCTOR').map((s) => <option key={s.id} value={s.id}>{s.fullName}</option>)}</select></div>
          </div>
          <p><button>Đặt lịch</button></p>
        </form>

        {me.role !== 'RECEPTION' && <form className="card" onSubmit={addLead}>
          <h2>Ghi nhận khách mới (lead)</h2>
          <div className="grid2">
            <div><label>Họ tên</label><input value={lead.fullName} onChange={(e) => setLead({ ...lead, fullName: e.target.value })} required /></div>
            <div><label>SĐT</label><input inputMode="tel" value={lead.phone} onChange={(e) => setLead({ ...lead, phone: e.target.value })} required /></div>
            <div><label>Nguồn khách</label><select value={lead.sourceId} onChange={(e) => setLead({ ...lead, sourceId: e.target.value })}><option value="">—</option>{sources.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
            <div><label>Ghi chú</label><input value={lead.note} onChange={(e) => setLead({ ...lead, note: e.target.value })} /></div>
          </div>
          <p><button>Lưu khách</button></p>
        </form>}
      </>}

      <h2>Khách đã ghi nhận ({leads.length})</h2>
      <div className="card tbl"><table>
        <thead><tr><th>Khách</th><th>SĐT</th><th>Nguồn</th><th>Trạng thái</th></tr></thead>
        <tbody>{leads.map((l) => <tr key={l.id}><td>{l.fullName}</td><td>{l.phone}</td><td>{l.source?.name ?? '—'}</td><td><span className="badge">{STATUS_LABEL[l.status]}</span></td></tr>)}</tbody>
      </table></div>
      {me && <p className="mut">Bạn đang đăng nhập với vai trò {ROLE_LABEL[me.role as keyof typeof ROLE_LABEL]}. Sale không xem được nội dung bệnh án.</p>}
    </>
  );
}
