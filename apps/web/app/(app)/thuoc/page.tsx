'use client';
import { useCallback, useEffect, useState } from 'react';
import { api, fmtDateTime, vnd } from '@/lib/api';

export default function Products() {
  const [rows, setRows] = useState<any[]>([]); const [me, setMe] = useState<any>(null); const [err, setErr] = useState(''); const [msg, setMsg] = useState('');
  const [f, setF] = useState({ code: '', name: '', unit: 'hộp', price: '', costPrice: '', minStock: '5' });
  const [sel, setSel] = useState<any>(null); const [mv, setMv] = useState<any[]>([]);
  const [inn, setInn] = useState({ qty: '', unitCost: '', lot: '', expiryDate: '' }); const [adj, setAdj] = useState({ delta: '', reason: '' });
  const load = useCallback(() => api('/products?all=1').then(setRows).catch((e) => setErr(e.message)), []);
  useEffect(() => { api('/auth/me').then(setMe); load(); }, [load]);
  const mgr = me?.role === 'MANAGER';
  const act = async (fn: () => Promise<any>, ok: string) => { setErr(''); setMsg(''); try { await fn(); setMsg(ok); await load(); if (sel) api(`/products/${sel.id}/movements`).then(setMv); } catch (x: any) { setErr(x.message); } };
  const open = (p: any) => { setSel(p); if (mgr) api(`/products/${p.id}/movements`).then(setMv); };
  return (
    <>
      <h1>Thuốc thành phẩm & tồn kho</h1>
      {err && <div className="err">{err}</div>}{msg && <p className="ok">{msg}</p>}
      <div className="card tbl"><table><thead><tr><th>Mã</th><th>Tên thuốc</th><th>ĐVT</th><th>Giá bán</th>{mgr && <th>Giá nhập</th>}<th>Tồn</th><th></th></tr></thead><tbody>
        {rows.map((p) => <tr key={p.id} style={{ opacity: p.active ? 1 : .5 }}><td>{p.code}</td><td>{p.name}{p.expiresSoon && <><br /><span className="badge" style={{ background: '#fff3cd' }}>Có lô sắp hết hạn</span></>}</td><td>{p.unit}</td><td>{vnd(p.price)}</td>{mgr && <td>{vnd(p.costPrice)}</td>}
          <td><b style={p.low ? { color: 'var(--err)' } : undefined}>{p.stock}</b>{p.low && <><br /><span className="mut">sắp hết (≤{p.minStock})</span></>}</td>
          <td>{mgr && <button className="sec" onClick={() => open(p)}>Nhập kho / điều chỉnh</button>}</td></tr>)}
      </tbody></table></div>

      {mgr && sel && <div className="card">
        <h2 style={{ marginTop: 0 }}>{sel.name} – tồn {sel.stock}</h2>
        <b>Nhập kho</b>
        <div className="grid2"><div><label>Số lượng</label><input inputMode="numeric" value={inn.qty} onChange={(e) => setInn({ ...inn, qty: e.target.value })} /></div><div><label>Giá nhập / đơn vị</label><input inputMode="numeric" value={inn.unitCost} onChange={(e) => setInn({ ...inn, unitCost: e.target.value })} /></div>
          <div><label>Số lô (không bắt buộc)</label><input value={inn.lot} onChange={(e) => setInn({ ...inn, lot: e.target.value })} /></div><div><label>Hạn dùng (không bắt buộc)</label><input type="date" value={inn.expiryDate} onChange={(e) => setInn({ ...inn, expiryDate: e.target.value })} /></div></div>
        <p><button disabled={!inn.qty} onClick={() => act(() => api(`/products/${sel.id}/stock-in`, { body: { qty: Number(inn.qty), unitCost: inn.unitCost ? Number(inn.unitCost) : undefined, lot: inn.lot || undefined, expiryDate: inn.expiryDate || undefined } }).then(() => setInn({ qty: '', unitCost: '', lot: '', expiryDate: '' })), 'Đã nhập kho')}>Nhập kho</button></p>
        <b>Kiểm kê / điều chỉnh (+/−, bắt buộc lý do)</b>
        <div className="row"><input inputMode="numeric" placeholder="VD: -2" value={adj.delta} onChange={(e) => setAdj({ ...adj, delta: e.target.value })} /><input placeholder="Lý do" value={adj.reason} onChange={(e) => setAdj({ ...adj, reason: e.target.value })} /><button className="sec" disabled={!adj.delta || adj.reason.length < 5} onClick={() => act(() => api(`/products/${sel.id}/adjust`, { body: { delta: Number(adj.delta), reason: adj.reason } }).then(() => setAdj({ delta: '', reason: '' })), 'Đã điều chỉnh')}>Điều chỉnh</button></div>
        <h2>Lịch sử kho</h2><div className="tbl"><table><tbody>{mv.map((m) => <tr key={m.id}><td>{fmtDateTime(m.at)}</td><td>{({ IN: 'Nhập', SALE: 'Bán', ADJUST: 'Điều chỉnh', VOID: 'Hoàn (hủy phiếu)' } as any)[m.type]}</td><td><b>{m.qty > 0 ? `+${m.qty}` : m.qty}</b></td><td className="mut">{m.lot ?? ''} {m.note ?? ''}</td></tr>)}</tbody></table></div>
      </div>}

      {mgr && <form className="card" onSubmit={(e) => { e.preventDefault(); act(() => api('/products', { body: { code: f.code, name: f.name, unit: f.unit, price: Number(f.price), costPrice: f.costPrice ? Number(f.costPrice) : undefined, minStock: Number(f.minStock) || 0 } }).then(() => setF({ ...f, code: '', name: '', price: '', costPrice: '' })), 'Đã thêm thuốc'); }}>
        <h2 style={{ marginTop: 0 }}>Thêm thuốc mới</h2>
        <div className="grid2"><div><label>Mã</label><input value={f.code} onChange={(e) => setF({ ...f, code: e.target.value })} required /></div><div><label>Tên thuốc</label><input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} required /></div>
          <div><label>Đơn vị tính</label><input value={f.unit} onChange={(e) => setF({ ...f, unit: e.target.value })} required /></div><div><label>Giá bán</label><input inputMode="numeric" value={f.price} onChange={(e) => setF({ ...f, price: e.target.value })} required /></div>
          <div><label>Giá nhập</label><input inputMode="numeric" value={f.costPrice} onChange={(e) => setF({ ...f, costPrice: e.target.value })} /></div><div><label>Cảnh báo khi tồn ≤</label><input inputMode="numeric" value={f.minStock} onChange={(e) => setF({ ...f, minStock: e.target.value })} /></div></div>
        <p><button>Thêm</button></p></form>}
    </>
  );
}
