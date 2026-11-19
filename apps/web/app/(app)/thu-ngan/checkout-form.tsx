'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, METHOD_LABEL, vnd } from '@/lib/api';

type L = { kind: 'SERVICE' | 'PRODUCT' | 'PACKAGE_SALE' | 'PACKAGE_USE'; key: string; name: string; price: number; qty: number; serviceCode?: string; productId?: string; templateId?: string; patientPackageId?: string };

export default function CheckoutForm({ encId }: { encId?: string }) {
  const router = useRouter();
  const [me, setMe] = useState<any>(null); const [ctx, setCtx] = useState<any>(null);
  const [services, setServices] = useState<any[]>([]); const [products, setProducts] = useState<any[]>([]); const [tpls, setTpls] = useState<any[]>([]);
  const [lines, setLines] = useState<L[]>([]); const [discount, setDiscount] = useState(''); const [reason, setReason] = useState(''); const [note, setNote] = useState('');
  const [pays, setPays] = useState<{ method: string; amount: string; ref: string }[]>([]); const [err, setErr] = useState('');
  const [customer, setCustomer] = useState(''); const [q, setQ] = useState(''); const [found, setFound] = useState<any[]>([]); const [patient, setPatient] = useState<any>(null);
  const [pk, setPk] = useState<any[]>([]);

  useEffect(() => { (async () => {
    const [m, sv, pr, tp] = await Promise.all([api('/auth/me'), api('/services'), api('/products'), api('/packages/templates')]);
    setMe(m); setServices(sv); setProducts(pr); setTpls(tp);
    if (encId) {
      const c = await api(`/invoices/checkout/${encId}`); setCtx(c); setPk(c.packages);
      const init: L[] = [
        ...c.suggestedServices.map((s: any) => ({ kind: 'SERVICE' as const, key: `s${s.code}`, name: s.name, price: s.price, qty: 1, serviceCode: s.code })),
        ...c.suggestedProducts.map((p: any) => ({ kind: 'PRODUCT' as const, key: `p${p.productId}`, name: p.name, price: p.price, qty: p.qty, productId: p.productId })),
      ];
      setLines(init);
    }
  })().catch((e) => setErr(e.message)); }, [encId]);
  useEffect(() => { const t = setTimeout(() => { if (!encId && q.trim().length >= 2) api(`/patients?q=${encodeURIComponent(q)}`).then(setFound).catch(() => {}); }, 250); return () => clearTimeout(t); }, [q, encId]);
  useEffect(() => { if (patient) api(`/packages/patient/${patient.id}`).then((r) => setPk(r.filter((x: any) => x.status === 'ACTIVE' && x.remaining > 0))); }, [patient]);

  const add = (l: Omit<L, 'key'>) => setLines((x) => [...x, { ...l, key: `${l.kind}${Math.random()}` }]);
  const subtotal = lines.reduce((a, l) => a + l.price * l.qty, 0);
  const disc = Math.min(Number(discount) || 0, subtotal); const total = subtotal - disc;
  const paid = pays.reduce((a, p) => a + (Number(p.amount) || 0), 0);
  const isMgr = me?.role === 'MANAGER';
  const pid = ctx?.patient?.id ?? patient?.id;

  const submit = async () => {
    setErr('');
    try {
      const inv = await api('/invoices', { body: {
        encounterId: encId, patientId: encId ? undefined : patient?.id, customerName: !encId && !patient ? customer : undefined,
        lines: lines.map((l) => ({ kind: l.kind, serviceCode: l.serviceCode, productId: l.productId, templateId: l.templateId, patientPackageId: l.patientPackageId, qty: l.qty })),
        discount: disc || undefined, discountReason: reason || undefined, note: note || undefined,
        payments: pays.filter((p) => Number(p.amount) > 0).map((p) => ({ method: p.method, amount: Number(p.amount), ref: p.ref || undefined })),
      } });
      router.push(`/thu-ngan/hoa-don/${inv.id}`);
    } catch (x: any) { setErr(x.message); }
  };

  if (ctx?.existingInvoice) return <div className="card">Lượt khám này đã có phiếu thu <b>{ctx.existingInvoice.code}</b>. <a href={`/thu-ngan`}>Quay lại</a></div>;
  return (
    <>
      <h1>{encId ? 'Thu ngân' : 'Bán lẻ tại quầy'}</h1>
      {ctx && <div className="card"><b>{ctx.patient.fullName}</b> · {ctx.patient.code} · lần khám {ctx.encounter.visitNo}</div>}
      {!encId && <div className="card">
        {patient ? <div><b>{patient.fullName}</b> · {patient.code} <button className="sec" onClick={() => setPatient(null)}>Đổi</button></div> : <>
          <label>Khách (tìm bệnh nhân theo SĐT/tên, hoặc nhập tên khách mua lẻ)</label>
          <input value={q} onChange={(e) => { setQ(e.target.value); setCustomer(e.target.value); }} placeholder="SĐT / tên" />
          {found.map((p) => <div key={p.id} style={{ padding: '6px 0' }}>{p.fullName} · {p.code} · {p.phone} <button className="sec" onClick={() => { setPatient(p); setFound([]); }}>Chọn</button></div>)}</>}
      </div>}

      <div className="card">
        <h2 style={{ marginTop: 0 }}>Các mục thu</h2>
        {encId && ctx?.suggestedServices.length > 0 && <p className="mut">Đã điền sẵn các kỹ thuật thực hiện hôm nay theo giá lẻ. Nếu tính theo <b>combo</b> hoặc <b>trừ buổi từ gói</b>, hãy bỏ các dòng lẻ và thêm combo/gói bên dưới.</p>}
        <div className="tbl"><table><thead><tr><th>Mục</th><th>SL</th><th>Đơn giá</th><th>Thành tiền</th><th></th></tr></thead><tbody>
          {lines.map((l) => <tr key={l.key}><td>{l.name}</td>
            <td>{l.kind === 'PACKAGE_USE' ? 1 : <input style={{ width: 64 }} inputMode="numeric" value={l.qty} onChange={(e) => setLines(lines.map((x) => (x.key === l.key ? { ...x, qty: Math.max(1, Number(e.target.value) || 1) } : x)))} />}</td>
            <td>{vnd(l.price)}</td><td>{vnd(l.price * l.qty)}</td><td><button className="sec" onClick={() => setLines(lines.filter((x) => x.key !== l.key))}>✕</button></td></tr>)}
          {!lines.length && <tr><td colSpan={5} className="mut">Chưa có mục nào.</td></tr>}
        </tbody></table></div>
        <div className="grid2" style={{ marginTop: 10 }}>
          <select value="" onChange={(e) => { const s = services.find((x) => x.code === e.target.value); if (s) add({ kind: 'SERVICE', name: s.name, price: s.price, qty: 1, serviceCode: s.code }); }}><option value="">+ Dịch vụ / combo…</option>{services.map((s) => <option key={s.code} value={s.code}>{s.name} – {vnd(s.price)}</option>)}</select>
          <select value="" onChange={(e) => { const p = products.find((x) => x.id === e.target.value); if (p) add({ kind: 'PRODUCT', name: `${p.name} (${p.unit})`, price: p.price, qty: 1, productId: p.id }); }}><option value="">+ Thuốc…</option>{products.map((p) => <option key={p.id} value={p.id} disabled={p.stock <= 0}>{p.name} – {vnd(p.price)} (tồn {p.stock})</option>)}</select>
          {(encId || patient) && <select value="" onChange={(e) => { const t = tpls.find((x) => x.id === e.target.value); if (t) add({ kind: 'PACKAGE_SALE', name: `Gói: ${t.name}`, price: t.price, qty: 1, templateId: t.id }); }}><option value="">+ Bán gói liệu trình…</option>{tpls.map((t) => <option key={t.id} value={t.id}>{t.name} – {vnd(t.price)}</option>)}</select>}
          {pk.length > 0 && <select value="" onChange={(e) => { const g = pk.find((x) => x.id === e.target.value); if (g && !lines.some((l) => l.patientPackageId === g.id)) add({ kind: 'PACKAGE_USE', name: `Trừ 1 buổi – ${g.name}`, price: 0, qty: 1, patientPackageId: g.id }); }}><option value="">+ Trừ buổi từ gói đã mua…</option>{pk.map((g) => <option key={g.id} value={g.id}>{g.name} (còn {g.remaining} buổi)</option>)}</select>}
        </div>
      </div>

      <div className="card">
        <div className="row" style={{ alignItems: 'end' }}>
          <div><b>Tạm tính: {vnd(subtotal)}</b></div>
          {isMgr ? <><div><label>Giảm giá (đ)</label><input inputMode="numeric" value={discount} onChange={(e) => setDiscount(e.target.value)} /></div>{disc > 0 && <div><label>Lý do giảm giá *</label><input value={reason} onChange={(e) => setReason(e.target.value)} /></div>}</> : <div className="mut">Giảm giá cần quản lý thực hiện.</div>}
        </div>
        <h2>Phải thu: {vnd(total)}</h2>
        {pays.map((p, i) => <div className="row" key={i} style={{ marginBottom: 6 }}>
          <select value={p.method} onChange={(e) => setPays(pays.map((x, j) => (j === i ? { ...x, method: e.target.value } : x)))}>{Object.entries(METHOD_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
          <input inputMode="numeric" placeholder="Số tiền" value={p.amount} onChange={(e) => setPays(pays.map((x, j) => (j === i ? { ...x, amount: e.target.value } : x)))} />
          {p.method !== 'CASH' && <input placeholder="Mã giao dịch" value={p.ref} onChange={(e) => setPays(pays.map((x, j) => (j === i ? { ...x, ref: e.target.value } : x)))} />}
          <button className="sec" style={{ flex: '0 0 auto' }} onClick={() => setPays(pays.filter((_, j) => j !== i))}>✕</button></div>)}
        <button className="sec" onClick={() => setPays([...pays, { method: 'CASH', amount: String(Math.max(total - paid, 0)), ref: '' }])}>+ Thêm khoản thu</button>
        <p>Đã nhận: <b>{vnd(paid)}</b> · {paid >= total ? <span className="ok">Đủ</span> : <span style={{ color: 'var(--warn)' }}>Còn nợ {vnd(total - paid)}</span>}</p>
        <label>Ghi chú</label><input value={note} onChange={(e) => setNote(e.target.value)} />
        {err && <div className="err">{err}</div>}
        <p><button disabled={!lines.length || (disc > 0 && reason.trim().length < 3)} onClick={submit} style={{ width: '100%' }}>Lập phiếu thu</button></p>
      </div>
    </>
  );
}
