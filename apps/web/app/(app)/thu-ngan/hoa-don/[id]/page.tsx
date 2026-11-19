'use client';
import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { api, fmtDateTime, INV_STATUS, METHOD_LABEL, vnd } from '@/lib/api';

export default function Invoice() {
  const { id } = useParams<{ id: string }>(); const [i, setI] = useState<any>(null); const [me, setMe] = useState<any>(null); const [err, setErr] = useState('');
  const [amt, setAmt] = useState(''); const [method, setMethod] = useState('CASH');
  const load = useCallback(() => api(`/invoices/${id}`).then(setI).catch((e) => setErr(e.message)), [id]);
  useEffect(() => { api('/auth/me').then(setMe); load(); }, [load]);
  const pay = async () => { setErr(''); try { await api(`/invoices/${id}/payments`, { body: { method, amount: Number(amt) } }); setAmt(''); load(); } catch (x: any) { setErr(x.message); } };
  const voidIt = async () => { const reason = prompt('Lý do hủy phiếu (bắt buộc):'); if (reason) { try { await api(`/invoices/${id}/void`, { body: { reason } }); load(); } catch (x: any) { setErr(x.message); } } };
  if (!i) return <div className="mut">{err || 'Đang tải…'}</div>;
  return (
    <>
      <div className="row" style={{ alignItems: 'center' }}><h1 style={{ flex: 3 }}>Phiếu thu {i.code}</h1><div style={{ textAlign: 'right' }}><Link href={`/thu-ngan/hoa-don/${id}/in`} target="_blank"><button className="sec">In phiếu thu</button></Link></div></div>
      <div className="card">
        <b>{i.patient?.fullName ?? i.customerName}</b> {i.patient && <span className="mut">· {i.patient.code}</span>} · {fmtDateTime(i.createdAt)} · <span className="badge">{INV_STATUS[i.status]}</span>
        {i.status === 'VOID' && <div className="err">Đã hủy {fmtDateTime(i.voidedAt)} – {i.voidReason}</div>}
        <div className="tbl"><table><tbody>{i.lines.map((l: any) => <tr key={l.id}><td>{l.name}</td><td>{l.qty}</td><td>{vnd(l.unitPrice)}</td><td style={{ textAlign: 'right' }}>{vnd(l.amount)}</td></tr>)}</tbody></table></div>
        {i.discount > 0 && <div>Giảm giá: −{vnd(i.discount)} <span className="mut">({i.discountReason})</span></div>}
        <h2>Tổng: {vnd(i.total)} · Đã thu {vnd(i.paid)}{i.total > i.paid && i.status !== 'VOID' ? <span style={{ color: 'var(--warn)' }}> · Còn nợ {vnd(i.total - i.paid)}</span> : ''}</h2>
        {i.payments.map((p: any) => <div key={p.id} className="mut">• {fmtDateTime(p.at)} – {METHOD_LABEL[p.method]} {vnd(p.amount)} {p.ref ?? ''}</div>)}
      </div>
      {err && <div className="err">{err}</div>}
      {i.status !== 'VOID' && i.total > i.paid && <div className="card"><b>Thu thêm</b><div className="row"><select value={method} onChange={(e) => setMethod(e.target.value)}>{Object.entries(METHOD_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select><input inputMode="numeric" placeholder={`Tối đa ${i.total - i.paid}`} value={amt} onChange={(e) => setAmt(e.target.value)} /><button onClick={pay} disabled={!amt}>Ghi nhận</button></div></div>}
      {me?.role === 'MANAGER' && i.status !== 'VOID' && <button className="danger" onClick={voidIt}>Hủy phiếu (hoàn kho, hoàn buổi gói)</button>}
    </>
  );
}
