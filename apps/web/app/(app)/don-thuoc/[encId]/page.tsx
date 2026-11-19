'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { api, vnd } from '@/lib/api';

type L = { productId?: string; name: string; qty: number; dosage: string };

export default function Rx() {
  const { encId } = useParams<{ encId: string }>(); const [me, setMe] = useState<any>(null); const [products, setProducts] = useState<any[]>([]);
  const [lines, setLines] = useState<L[]>([]); const [note, setNote] = useState(''); const [locked, setLocked] = useState(false); const [msg, setMsg] = useState(''); const [err, setErr] = useState(''); const [pt, setPt] = useState<any>(null);
  useEffect(() => { (async () => {
    const [m, pr, r, ex] = await Promise.all([api('/auth/me'), api('/products'), api(`/prescriptions/by-encounter/${encId}`), api(`/exams/by-encounter/${encId}`).catch(() => null)]);
    setMe(m); setProducts(pr); setLocked(r.dispensed); setPt(ex?.patient ?? null);
    if (r.rx) { setLines(r.rx.lines.map((l: any) => ({ productId: l.productId ?? undefined, name: l.name, qty: l.qty, dosage: l.dosage ?? '' }))); setNote(r.rx.note ?? ''); }
  })().catch((e) => setErr(e.message)); }, [encId]);
  const canEdit = me?.role === 'DOCTOR' && !locked;
  const save = async () => { setErr(''); setMsg(''); try { await api(`/prescriptions/by-encounter/${encId}`, { method: 'PUT', body: { note: note || undefined, lines: lines.filter((l) => l.name.trim()).map((l) => ({ ...l, dosage: l.dosage || undefined })) } }); setMsg('Đã lưu đơn thuốc'); } catch (x: any) { setErr(x.message); } };
  return (
    <>
      <div className="row" style={{ alignItems: 'center' }}><h1 style={{ flex: 3 }}>Đơn thuốc</h1><div style={{ textAlign: 'right' }}><Link href={`/don-thuoc/${encId}/in`} target="_blank"><button className="sec">In đơn</button></Link></div></div>
      {pt && <div className="card"><b>{pt.fullName}</b> · {pt.code}</div>}
      {locked && <div className="card" style={{ background: '#e8f5e9' }}>Thuốc đã được bán theo đơn này nên không sửa được.</div>}
      <div className="card">
        {lines.map((l, i) => <div key={i} style={{ borderBottom: '1px solid var(--line)', paddingBottom: 8, marginBottom: 8 }}>
          <div className="row"><input disabled={!canEdit} placeholder="Tên thuốc" value={l.name} onChange={(e) => setLines(lines.map((x, j) => (j === i ? { ...x, name: e.target.value, productId: undefined } : x)))} />
            <input disabled={!canEdit} style={{ maxWidth: 90 }} inputMode="numeric" value={l.qty} onChange={(e) => setLines(lines.map((x, j) => (j === i ? { ...x, qty: Math.max(1, Number(e.target.value) || 1) } : x)))} /></div>
          <input disabled={!canEdit} style={{ marginTop: 6 }} placeholder="Liều / cách dùng" value={l.dosage} onChange={(e) => setLines(lines.map((x, j) => (j === i ? { ...x, dosage: e.target.value } : x)))} />
          {!l.productId && l.name && <div className="mut">⚠ Thuốc ngoài danh mục: khách mua ở nơi khác, quầy sẽ không bán/trừ kho.</div>}
          {canEdit && <button className="sec" style={{ marginTop: 6 }} onClick={() => setLines(lines.filter((_, j) => j !== i))}>Xóa</button>}</div>)}
        {canEdit && <select value="" onChange={(e) => { const p = products.find((x) => x.id === e.target.value); if (p) setLines([...lines, { productId: p.id, name: p.name, qty: 1, dosage: '' }]); }}><option value="">+ Chọn thuốc trong danh mục…</option>{products.map((p) => <option key={p.id} value={p.id}>{p.name} – {vnd(p.price)} (tồn {p.stock})</option>)}</select>}
        {canEdit && <p><button className="sec" onClick={() => setLines([...lines, { name: '', qty: 1, dosage: '' }])}>+ Thuốc ngoài danh mục</button></p>}
        <label>Lời dặn</label><textarea rows={2} disabled={!canEdit} value={note} onChange={(e) => setNote(e.target.value)} />
        {msg && <p className="ok">{msg}</p>}{err && <div className="err">{err}</div>}
        {canEdit && <p><button onClick={save}>Lưu đơn thuốc</button></p>}
      </div>
    </>
  );
}
