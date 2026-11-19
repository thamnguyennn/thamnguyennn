'use client';
import { Suspense, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import { api, fmtDate, PP_HINT, PP_LABEL } from '@/lib/api';

type Line = { serviceCode: string; minutes: string; detail: string };
const todayVN = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' }).format(new Date());

export default function PlanWrap() { return <Suspense><Plan /></Suspense>; }

function Plan() {
  const { id } = useParams<{ id: string }>(); const enc = useSearchParams().get('enc');
  const [plan, setPlan] = useState<any>(null); const [services, setServices] = useState<any[]>([]); const [me, setMe] = useState<any>(null);
  const [lines, setLines] = useState<Line[]>([]); const [progress, setProgress] = useState(''); const [note, setNote] = useState(''); const [adverse, setAdverse] = useState(false);
  const [ack, setAck] = useState(false); const [editing, setEditing] = useState<string | null>(null); const [err, setErr] = useState(''); const [ok, setOk] = useState('');

  const svc = (code: string) => services.find((s) => s.code === code);
  const blank = useCallback((p: any, sv: any[]) => setLines(p.items.map((i: any) => ({ serviceCode: i.serviceCode, minutes: String(sv.find((s) => s.code === i.serviceCode)?.durationMin ?? ''), detail: i.region ?? '' }))), []);
  const load = useCallback(async () => {
    const [p, sv] = await Promise.all([api(`/plans/${id}`), api('/services')]);
    setPlan(p); setServices(sv); blank(p, sv);
  }, [id, blank]);
  useEffect(() => { api('/auth/me').then(setMe); load().catch((e) => setErr(e.message)); }, [load]);

  const canRecord = me && ['THERAPIST', 'DOCTOR'].includes(me.role);
  const save = async (e: React.FormEvent) => {
    e.preventDefault(); setErr(''); setOk('');
    const body = { encounterId: enc ?? undefined, progress, note, adverse, acknowledgeRisk: ack, lines: lines.filter((l) => l.serviceCode).map((l) => ({ serviceCode: l.serviceCode, minutes: l.minutes ? Number(l.minutes) : undefined, detail: l.detail || undefined })) };
    try {
      if (editing) await api(`/plans/${id}/sessions/${editing}`, { method: 'PATCH', body }); else await api(`/plans/${id}/sessions`, { body });
      setOk(editing ? 'Đã cập nhật buổi điều trị' : 'Đã ghi buổi điều trị. Khách chuyển sang bước thu ngân.');
      setProgress(''); setNote(''); setAdverse(false); setEditing(null); await load();
    } catch (x: any) { setErr(x.message); }
  };
  const edit = (s: any) => { setEditing(s.id); setProgress(s.progress ?? ''); setNote(s.note ?? ''); setAdverse(s.adverse); setLines(s.lines.map((l: any) => ({ serviceCode: l.serviceCode, minutes: l.minutes ? String(l.minutes) : '', detail: l.detail ?? '' }))); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  const setStatus = async (status: string) => { if (confirm(status === 'CANCELLED' ? 'Hủy liệu trình này?' : 'Thay đổi trạng thái?')) { await api(`/plans/${id}`, { method: 'PATCH', body: { status } }); load(); } };
  const extend = async () => { const n = prompt('Tổng số buổi mới:', String(plan.totalSessions + 5)); if (n) { try { await api(`/plans/${id}`, { method: 'PATCH', body: { totalSessions: Number(n), status: 'ACTIVE' } }); load(); } catch (x: any) { setErr((x as Error).message); } } };

  if (!plan) return <div className="mut">{err || 'Đang tải…'}</div>;
  const p = plan.patient; const sf = plan.safety; const pct = Math.min(100, Math.round((plan.used / plan.totalSessions) * 100));
  const planCodes = plan.items.map((i: any) => i.serviceCode);
  const today = todayVN();

  return (
    <>
      <div className="row" style={{ alignItems: 'center' }}><h1 style={{ flex: 3 }}>Liệu trình điều trị</h1><div style={{ textAlign: 'right' }}><Link href={`/lieu-trinh/${id}/in`} target="_blank"><button className="sec">In phiếu theo dõi</button></Link></div></div>
      <div className="card">
        <b>{p.fullName}</b> · {p.code} · {p.birthYear} · {p.phone}
        <div className="mut">Chẩn đoán: {plan.diagnosis || '—'} · BS {plan.doctorName} · KTV {plan.therapistName ?? '—'}</div>
        <div style={{ background: '#eee', borderRadius: 8, height: 12, margin: '10px 0 4px' }}><div style={{ width: `${pct}%`, height: 12, borderRadius: 8, background: 'var(--gold)' }} /></div>
        <b>Đã thực hiện {plan.used}/{plan.totalSessions} buổi</b> <span className="mut">(còn {plan.remaining}){plan.frequency ? ` · ${plan.frequency}` : ''}</span>
        {plan.reevalDue && <div className="badge" style={{ background: '#fff3cd', marginTop: 6 }}>Đến hạn tái lượng giá (sau {plan.reevalAfter} buổi) – báo bác sĩ</div>}
        {plan.note && <div style={{ marginTop: 6 }}>📝 {plan.note}</div>}
        <div style={{ marginTop: 6 }}>{plan.items.map((i: any) => <span key={i.id} className="badge" style={{ marginRight: 6 }}>{PP_LABEL[i.serviceCode]}{i.region ? ` · ${i.region}` : ''}</span>)}</div>
      </div>

      {sf.conclusion && sf.conclusion !== 'ACCEPT' && <div className="card" style={{ background: sf.conclusion === 'DEFER' ? '#fdecea' : '#fff3cd', borderColor: sf.conclusion === 'DEFER' ? '#c62828' : '#b26a00' }}>
        <b>{sf.conclusion === 'DEFER' ? '⛔ Sàng lọc: HOÃN / CHUYỂN TUYẾN' : '⚠️ Sàng lọc: THẬN TRỌNG khi điều trị'}</b>
        {sf.cautions.length > 0 && <div>Thận trọng / chống chỉ định: {sf.cautions.join(', ')}</div>}{sf.redFlags.length > 0 && <div>Dấu hiệu cảnh báo: {sf.redFlags.join(', ')}</div>}
      </div>}

      {plan.status !== 'ACTIVE' && <div className="card">Liệu trình: <b>{plan.status === 'COMPLETED' ? 'đã hoàn thành' : 'đã hủy'}</b>. {me?.role === 'DOCTOR' && <button className="sec" onClick={extend}>Gia hạn / mở lại</button>}</div>}
      {ok && <p className="ok"><b>{ok}</b></p>}{err && <div className="err">{err}</div>}

      {canRecord && (plan.status === 'ACTIVE' || editing) && (
        <form className="card" onSubmit={save}>
          <h2 style={{ marginTop: 0 }}>{editing ? 'Sửa buổi đã ghi' : `Ghi buổi ${plan.used + 1}`}</h2>
          <label>Diễn tiến</label><textarea rows={2} value={progress} onChange={(e) => setProgress(e.target.value)} placeholder="Triệu chứng, mức đau, đáp ứng so với buổi trước…" />
          <label>Phương pháp đã thực hiện</label>
          {lines.map((l, i) => (
            <div key={i} style={{ border: '1px solid var(--line)', borderRadius: 8, padding: 8, marginBottom: 8 }}>
              <div className="row">
                <select value={l.serviceCode} onChange={(e) => setLines(lines.map((x, j) => (j === i ? { ...x, serviceCode: e.target.value, minutes: x.minutes || String(svc(e.target.value)?.durationMin ?? '') } : x)))}>
                  <option value="">— PP —</option>{[...planCodes, ...services.filter((s) => s.kind === 'SINGLE' && !planCodes.includes(s.code)).map((s) => s.code)].map((c) => <option key={c} value={c}>{PP_LABEL[c]} – {svc(c)?.name}</option>)}</select>
                <input style={{ maxWidth: 90 }} inputMode="numeric" placeholder="TG (phút)" value={l.minutes} onChange={(e) => setLines(lines.map((x, j) => (j === i ? { ...x, minutes: e.target.value } : x)))} />
              </div>
              <input style={{ marginTop: 6 }} placeholder={`Thông số / vùng${PP_HINT[l.serviceCode] ? ` (${PP_HINT[l.serviceCode]})` : ''}`} value={l.detail} onChange={(e) => setLines(lines.map((x, j) => (j === i ? { ...x, detail: e.target.value } : x)))} />
              <button type="button" className="sec" style={{ marginTop: 6 }} onClick={() => setLines(lines.filter((_, j) => j !== i))}>Bỏ dòng</button>
            </div>))}
          <button type="button" className="sec" onClick={() => setLines([...lines, { serviceCode: '', minutes: '', detail: '' }])}>+ Thêm phương pháp</button>
          <label style={{ display: 'flex', gap: 8, alignItems: 'center', color: 'var(--ink)', fontSize: '1rem', marginTop: 12 }}><input type="checkbox" style={{ width: 'auto' }} checked={adverse} onChange={(e) => setAdverse(e.target.checked)} /> Có phản ứng bất thường (báo bác sĩ)</label>
          <label>Ghi chú</label><input value={note} onChange={(e) => setNote(e.target.value)} />
          {sf.conclusion === 'DEFER' && !editing && <label style={{ display: 'flex', gap: 8, alignItems: 'flex-start', color: 'var(--err)', fontSize: '1rem' }}><input type="checkbox" style={{ width: 'auto', marginTop: 4 }} checked={ack} onChange={(e) => setAck(e.target.checked)} /> Tôi đã xác nhận lại với bác sĩ trước khi điều trị.</label>}
          <p><button disabled={sf.conclusion === 'DEFER' && !editing && !ack} style={{ width: '100%' }}>{editing ? 'Lưu thay đổi' : 'Lưu buổi điều trị'}</button>{editing && <button type="button" className="sec" style={{ width: '100%', marginTop: 6 }} onClick={() => { setEditing(null); blank(plan, services); }}>Hủy sửa</button>}</p>
        </form>
      )}

      <h2>Phiếu theo dõi ({plan.used} buổi)</h2>
      {[...plan.sessions].reverse().map((s: any) => (
        <div className="card" key={s.id} style={s.adverse ? { borderColor: 'var(--err)' } : undefined}>
          <b>Buổi {s.sessionNo}</b> · {fmtDate(s.date)} · {s.performedByName} {s.adverse && <span className="badge" style={{ background: '#fdecea', color: 'var(--err)' }}>Phản ứng bất thường</span>}
          {s.progress && <div>{s.progress}</div>}
          {s.lines.map((l: any) => <div key={l.id} className="mut">• <b>{PP_LABEL[l.serviceCode]}</b> {l.minutes ? `${l.minutes}′` : ''} {l.detail ?? ''}</div>)}
          {s.note && <div className="mut">Ghi chú: {s.note}</div>}
          {canRecord && String(new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' }).format(new Date(s.createdAt))) === today && (s.performedById === me.id || me.role === 'DOCTOR') && <button className="sec" style={{ marginTop: 6 }} onClick={() => edit(s)}>Sửa (trong ngày)</button>}
        </div>
      ))}
      {!plan.sessions.length && <p className="mut">Chưa có buổi nào.</p>}
      {me?.role === 'DOCTOR' && plan.status === 'ACTIVE' && <p><button className="sec danger" style={{ color: '#fff' }} onClick={() => setStatus('CANCELLED')}>Hủy liệu trình</button></p>}
    </>
  );
}
