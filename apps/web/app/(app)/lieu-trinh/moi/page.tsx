'use client';
import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { api, PP_LABEL } from '@/lib/api';
import { NON_DRUG_MANUAL, NON_DRUG_PT } from '@/lib/exam-schema';

export default function NewPlanWrap() { return <Suspense><NewPlan /></Suspense>; }

function NewPlan() {
  const enc = useSearchParams().get('enc'); const router = useRouter();
  const [ctx, setCtx] = useState<any>(null); const [services, setServices] = useState<any[]>([]); const [staff, setStaff] = useState<any[]>([]);
  const [sel, setSel] = useState<Record<string, { on: boolean; region: string }>>({}); const [f, setF] = useState({ total: '10', frequency: '', reeval: '', therapistId: '', note: '' }); const [err, setErr] = useState('');

  useEffect(() => { (async () => {
    const [c, sv, st] = await Promise.all([api(`/exams/by-encounter/${enc}`), api('/services'), api('/users/staff')]);
    setCtx(c); setServices(sv.filter((s: any) => s.kind === 'SINGLE')); setStaff(st.filter((s: any) => s.role === 'THERAPIST'));
    // Điền sẵn từ phiếu khám: mục X (liệu trình) và mục XI (thủ thuật đã chọn)
    const d = c.exam?.effective ?? {}; const chosen = new Set<string>([...(d.nondrug?.pt ?? []), ...(d.nondrug?.manual ?? [])]);
    const pre: Record<string, { on: boolean; region: string }> = {};
    [...NON_DRUG_PT, ...NON_DRUG_MANUAL].forEach((o) => { if (o.code && chosen.has(o.v)) pre[o.code] = { on: true, region: '' }; });
    setSel(pre); setF((x) => ({ ...x, total: d.plan?.sessions || '10', frequency: d.plan?.frequency || '', reeval: d.plan?.reeval || '', therapistId: c.encounter.therapistId ?? '' }));
  })().catch((e) => setErr(e.message)); }, [enc]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setErr('');
    try {
      const items = Object.entries(sel).filter(([, v]) => v.on).map(([serviceCode, v]) => ({ serviceCode, region: v.region || undefined }));
      const p = await api('/plans', { body: { encounterId: enc, totalSessions: Number(f.total), frequency: f.frequency || undefined, reevalAfter: f.reeval ? Number(f.reeval) : undefined, therapistId: f.therapistId || undefined, note: f.note || undefined, items } });
      router.push(`/lieu-trinh/${p.id}`);
    } catch (x: any) { setErr(x.message); }
  };
  if (!ctx) return <div className="mut">{err || 'Đang tải…'}</div>;
  return (
    <form onSubmit={submit}>
      <h1>Chỉ định liệu trình</h1>
      <div className="card"><b>{ctx.patient.fullName}</b> · {ctx.patient.code}<div className="mut">Điền sẵn từ phiếu khám (mục X, XI). Bác sĩ chỉnh lại nếu cần.</div></div>
      <div className="card">
        <h2 style={{ marginTop: 0 }}>Thủ thuật mỗi buổi</h2>
        {services.map((s) => { const v = sel[s.code]; return (
          <div key={s.code} style={{ borderBottom: '1px solid var(--line)', padding: '8px 0' }}>
            <label style={{ display: 'flex', gap: 8, alignItems: 'center', margin: 0, color: 'var(--ink)', fontSize: '1rem' }}>
              <input type="checkbox" style={{ width: 'auto' }} checked={!!v?.on} onChange={(e) => setSel({ ...sel, [s.code]: { on: e.target.checked, region: v?.region ?? '' } })} />
              <b>{PP_LABEL[s.code]}</b> {s.name} <span className="mut">· {s.durationMin}′ · {s.price.toLocaleString('vi-VN')}đ</span></label>
            {v?.on && <input style={{ marginTop: 6 }} placeholder="Vùng / huyệt vị điều trị" value={v.region} onChange={(e) => setSel({ ...sel, [s.code]: { on: true, region: e.target.value } })} />}
          </div>); })}
      </div>
      <div className="card"><div className="grid2">
        <div><label>Tổng số buổi</label><input inputMode="numeric" value={f.total} onChange={(e) => setF({ ...f, total: e.target.value })} required /></div>
        <div><label>Tần suất</label><input value={f.frequency} onChange={(e) => setF({ ...f, frequency: e.target.value })} placeholder="VD: 3 buổi/tuần" /></div>
        <div><label>Tái lượng giá sau … buổi</label><input inputMode="numeric" value={f.reeval} onChange={(e) => setF({ ...f, reeval: e.target.value })} /></div>
        <div><label>Trị liệu viên phụ trách</label><select value={f.therapistId} onChange={(e) => setF({ ...f, therapistId: e.target.value })}><option value="">— Chưa phân công —</option>{staff.map((s) => <option key={s.id} value={s.id}>{s.fullName}</option>)}</select></div>
      </div><label>Ghi chú cho trị liệu viên</label><textarea rows={2} value={f.note} onChange={(e) => setF({ ...f, note: e.target.value })} /></div>
      {err && <div className="err">{err}</div>}
      <button>Tạo liệu trình</button>
    </form>
  );
}
