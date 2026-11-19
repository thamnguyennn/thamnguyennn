'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { api, ApiError, fmtDateTime } from '@/lib/api';
import { Block, EXAM_SECTIONS, getPath, Opt, optL, optV, SCREENING, setPath, TESTS, VITALS } from '@/lib/exam-schema';

const SAVE_DELAY = 1500;

export default function ExamPage() {
  const { id } = useParams<{ id: string }>();
  const [me, setMe] = useState<any>(null); const [ctx, setCtx] = useState<any>(null);
  const [data, setData] = useState<any>({}); const [rev, setRev] = useState(0);
  const [save, setSave] = useState<'idle' | 'dirty' | 'saving' | 'saved' | 'error'>('idle'); const [err, setErr] = useState('');
  const [amend, setAmend] = useState(false); const [reason, setReason] = useState(''); const [history, setHistory] = useState<any[]>([]);
  const timer = useRef<any>(null); const latest = useRef({ data, rev }); latest.current = { data, rev };

  const load = useCallback(async () => {
    const r = await api(`/exams/by-encounter/${id}`);
    setCtx(r); setData(r.exam?.effective ?? {}); setRev(r.exam?.rev ?? 0); setSave('idle');
    api(`/exams/history/${r.patient.id}?exclude=${id}`).then(setHistory).catch(() => {});
  }, [id]);
  useEffect(() => { api('/auth/me').then(setMe); load().catch((e) => setErr(e.message)); }, [load]);

  const signed = ctx?.exam?.status === 'SIGNED';
  const canEdit = me?.role === 'DOCTOR' && (!signed || amend);

  const flush = useCallback(async () => {
    if (signed) return;
    setSave('saving');
    try { const r = await api(`/exams/by-encounter/${id}`, { method: 'PUT', body: { data: latest.current.data, rev: latest.current.rev } }); setRev(r.rev); setSave('saved'); setData((d: any) => ({ ...d, vitals: r.data.vitals ?? d.vitals })); }
    catch (e: any) { setSave('error'); setErr(e.message); }
  }, [id, signed]);

  const change = (path: string, val: any) => {
    let next = setPath(data, path, val);
    if (path === 'vitals.height' || path === 'vitals.weight') { const h = Number(next.vitals?.height), w = Number(next.vitals?.weight); next = setPath(next, 'vitals.bmi', h > 0 && w > 0 ? Math.round((w / ((h / 100) ** 2)) * 10) / 10 : ''); }
    setData(next); setErr('');
    if (!amend) { setSave('dirty'); clearTimeout(timer.current); timer.current = setTimeout(flush, SAVE_DELAY); }
  };
  useEffect(() => () => clearTimeout(timer.current), []);

  const sign = async () => {
    if (!confirm('Ký phiếu khám? Sau khi ký sẽ không sửa đè được, chỉ thêm bản điều chỉnh có lý do.')) return;
    clearTimeout(timer.current); setErr('');
    try { await flush(); await new Promise((r) => setTimeout(r, 50)); await api(`/exams/by-encounter/${id}/sign`, { body: { rev: latest.current.rev } }); await load(); } catch (e: any) { setErr(e.message); }
  };
  const submitAmend = async () => {
    setErr(''); try { await api(`/exams/by-encounter/${id}/amend`, { body: { reason, data } }); setAmend(false); setReason(''); await load(); } catch (e: any) { setErr(e.message); }
  };

  if (!ctx) return <div className="mut">{err || 'Đang tải…'}</div>;
  const p = ctx.patient; const concl = data.screening?.conclusion;

  return (
    <>
      <div className="row" style={{ alignItems: 'center' }}>
        <h1 style={{ flex: 3 }}>Phiếu khám ngoại trú</h1>
        <div style={{ textAlign: 'right' }}>
          <Link href={`/kham/${id}/in`} target="_blank"><button className="sec">In phiếu</button></Link>
        </div>
      </div>
      <div className="card">
        <b>{p.fullName}</b> · {p.code} · {p.birthYear} · {p.gender === 'MALE' ? 'Nam' : p.gender === 'FEMALE' ? 'Nữ' : 'Khác'} · {p.phone}
        <div className="mut">Lần khám thứ {ctx.encounter.visitNo} · {fmtDateTime(ctx.encounter.visitDate)}{p.address ? ` · ${p.address}` : ''}{p.occupation ? ` · ${p.occupation}` : ''}</div>
      </div>

      {concl && concl !== 'ACCEPT' && <div className="card" style={{ background: concl === 'DEFER' ? '#fdecea' : '#fff3cd', borderColor: concl === 'DEFER' ? '#c62828' : '#b26a00' }}>
        <b>{concl === 'DEFER' ? '⛔ HOÃN / CHUYỂN TUYẾN' : '⚠️ THẬN TRỌNG khi điều trị'}</b>
        {(data.screening?.cautions ?? []).length > 0 && <div>Thận trọng / chống chỉ định: {(data.screening.cautions as string[]).join(', ')}</div>}
        {(data.screening?.redFlags ?? []).length > 0 && <div>Dấu hiệu cảnh báo: {(data.screening.redFlags as string[]).join(', ')}</div>}
      </div>}

      {history.length > 0 && <details className="card"><summary><b>Các lần khám trước ({history.length})</b></summary>
        {history.map((h) => <div key={h.id} style={{ marginTop: 8 }}><b>Lần {h.visitNo}</b> – {fmtDateTime(h.visitDate)}<br />Lý do: {h.reason || '—'}<br />Chẩn đoán: {h.diagnosis?.modernMain || h.diagnosis?.tcmName || '—'}</div>)}
      </details>}

      {signed && !amend && <div className="card" style={{ background: '#e8f5e9' }}>
        ✔ Đã ký bởi <b>{ctx.exam.signedBy?.fullName}</b> lúc {fmtDateTime(ctx.exam.signedAt)}.
        {ctx.exam.amendments.length > 0 && <> Có {ctx.exam.amendments.length} bản điều chỉnh (hiển thị bản mới nhất).</>}
        {me?.role === 'DOCTOR' && <> <button className="sec" onClick={() => setAmend(true)}>Thêm bản điều chỉnh</button></>}
        {ctx.exam.amendments.map((a: any) => <div key={a.id} className="mut">• Điều chỉnh #{a.version} ({fmtDateTime(a.at)}): {a.reason}</div>)}
      </div>}
      {amend && <div className="card" style={{ background: '#fff8e1' }}>
        <b>Điều chỉnh phiếu đã ký</b> – bản gốc được giữ nguyên.
        <label>Lý do điều chỉnh (bắt buộc)</label><input value={reason} onChange={(e) => setReason(e.target.value)} />
        <p><button disabled={reason.trim().length < 5} onClick={submitAmend}>Lưu bản điều chỉnh</button> <button className="sec" onClick={() => { setAmend(false); load(); }}>Hủy</button></p>
      </div>}
      {err && <div className="err">{err}</div>}

      <fieldset disabled={!canEdit} style={{ border: 0, padding: 0, margin: 0, minWidth: 0 }}>
        {EXAM_SECTIONS.map((s) => (
          <div className="card" key={s.no}>
            <h2 style={{ marginTop: 0 }}>{s.no}. {s.title}</h2>
            {s.blocks.map((b, i) => <BlockView key={i} b={b} data={data} change={change} />)}
          </div>
        ))}
      </fieldset>

      {me?.role === 'DOCTOR' && !signed && (
        <div className="card" style={{ position: 'sticky', bottom: 8, display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <span className="mut" style={{ flex: 1 }}>{{ idle: '', dirty: 'Chưa lưu…', saving: 'Đang lưu…', saved: '✔ Đã lưu nháp', error: '⚠ Lưu lỗi' }[save]}</span>
          <button className="sec" onClick={() => { clearTimeout(timer.current); flush(); }}>Lưu nháp</button>
          <button onClick={sign}>Ký phiếu</button>
        </div>
      )}
    </>
  );
}

function BlockView({ b, data, change }: { b: Block; data: any; change: (p: string, v: any) => void }) {
  switch (b.t) {
    case 'sub': return <h2 style={{ fontSize: '1rem', color: 'var(--gold-d)' }}>{b.label}</h2>;
    case 'text': return <div style={{ maxWidth: b.w }}><label>{b.label}</label>{(b.rows ?? 1) > 1
      ? <textarea rows={b.rows} value={getPath(data, b.k) ?? ''} onChange={(e) => change(b.k, e.target.value)} />
      : <input value={getPath(data, b.k) ?? ''} onChange={(e) => change(b.k, e.target.value)} />}</div>;
    case 'checks': case 'radio': {
      const val = getPath(data, b.k); const isC = b.t === 'checks'; const cur: string[] = isC ? val ?? [] : [];
      return <div><label>{b.label}</label><div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 16px' }}>
        {b.options.map((o) => { const v = optV(o); const on = isC ? cur.includes(v) : val === v;
          return <label key={v} style={{ display: 'flex', gap: 6, alignItems: 'center', margin: 0, color: 'var(--ink)', fontSize: '1rem', minHeight: 32 }}>
            <input style={{ width: 'auto' }} type={isC ? 'checkbox' : 'radio'} name={b.k} checked={on} onChange={() => change(b.k, isC ? (on ? cur.filter((x) => x !== v) : [...cur, v]) : v)} />{optL(o)}</label>; })}
      </div>{b.other && <input style={{ marginTop: 6 }} placeholder="Khác / ghi chú…" value={getPath(data, b.other) ?? ''} onChange={(e) => change(b.other!, e.target.value)} />}</div>;
    }
    case 'vitals': return <div className="grid2" style={{ gridTemplateColumns: 'repeat(auto-fill,minmax(150px,1fr))' }}>
      {VITALS.map((v) => <div key={v.k}><label>{v.label} ({v.unit})</label><input inputMode="decimal" readOnly={v.auto} value={getPath(data, `vitals.${v.k}`) ?? ''} onChange={(e) => change(`vitals.${v.k}`, e.target.value)} /></div>)}</div>;
    case 'tests': return <div>{TESTS.map((g) => <div key={g.group}><label>{g.group}</label><div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 18px' }}>
      {g.items.map((t) => { const k = `msk.neuro.tests.${t}`; const v = getPath(data, k); return <span key={t}>{t}: {['-', '+'].map((x) => <label key={x} style={{ display: 'inline-flex', gap: 3, margin: '0 6px 0 4px', color: 'var(--ink)', fontSize: '1rem' }}><input style={{ width: 'auto' }} type="radio" name={k} checked={v === x} onChange={() => change(k, x)} />{x}</label>)}</span>; })}</div></div>)}</div>;
    case 'icd': return <IcdField b={b} data={data} change={change} />;
    case 'drugs': { const rows: { name: string; dose: string }[] = getPath(data, 'drugs') ?? [];
      const set = (r: typeof rows) => change('drugs', r);
      return <div>{rows.map((r, i) => <div className="row" key={i} style={{ marginBottom: 6 }}>
        <input placeholder="Tên thuốc" value={r.name} onChange={(e) => set(rows.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))} />
        <input placeholder="Liều / cách dùng" value={r.dose} onChange={(e) => set(rows.map((x, j) => (j === i ? { ...x, dose: e.target.value } : x)))} />
        <button type="button" className="sec" style={{ flex: '0 0 auto' }} onClick={() => set(rows.filter((_, j) => j !== i))}>Xóa</button></div>)}
        <button type="button" className="sec" onClick={() => set([...rows, { name: '', dose: '' }])}>+ Thêm thuốc</button>
        <p className="mut">Chỉ kê thuốc thành phẩm. Đơn thuốc in riêng và trừ kho sẽ làm ở giai đoạn thuốc.</p></div>; }
  }
}

function IcdField({ b, data, change }: { b: Extract<Block, { t: 'icd' }>; data: any; change: (p: string, v: any) => void }) {
  const [opts, setOpts] = useState<{ code: string; name: string }[]>([]); const val = getPath(data, b.k) ?? ''; const lid = `icd-${b.k}`;
  const t = useRef<any>(null);
  const onChange = (v: string) => { change(b.k, v); clearTimeout(t.current); const q = v.split('–')[0].trim(); if (q.length >= 2) t.current = setTimeout(() => api(`/exams/icd10?q=${encodeURIComponent(q)}`).then(setOpts).catch(() => {}), 250); };
  return <div><label>{b.label} (gõ mã ICD-10 hoặc tên để gợi ý, vẫn nhập tự do được)</label>
    <input list={lid} value={val} onChange={(e) => onChange(e.target.value)} />
    <datalist id={lid}>{opts.map((o) => <option key={o.code} value={`${o.code} – ${o.name}`} />)}</datalist></div>;
}
