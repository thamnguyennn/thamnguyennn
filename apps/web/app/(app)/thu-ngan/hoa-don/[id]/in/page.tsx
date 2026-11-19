'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { api, fmtDateTime, INV_STATUS, METHOD_LABEL, vnd } from '@/lib/api';

export default function PrintInvoice() {
  const { id } = useParams<{ id: string }>(); const [i, setI] = useState<any>(null);
  useEffect(() => { api(`/invoices/${id}`).then(setI); }, [id]);
  useEffect(() => { if (i) setTimeout(() => window.print(), 500); }, [i]);
  if (!i) return <div>Đang tải…</div>;
  return (
    <div className="inv">
      <style>{`@page{size:A5;margin:8mm}.inv{font:12px/1.4 "Times New Roman",serif;color:#000;max-width:130mm;margin:0 auto;background:#fff}.inv table{width:100%;border-collapse:collapse}.inv td,.inv th{padding:3px 2px;border-bottom:1px dotted #777;text-align:left}.inv .r{text-align:right}.inv .hd{text-align:center;border-bottom:2px solid #000;padding-bottom:4px}.inv .hd img{width:60px}@media screen{body{background:#eee}.inv{padding:8mm;box-shadow:0 0 6px #0003;margin:10px auto}}`}</style>
      <div className="hd"><img src="/logo.jpg" alt="" /><h3 style={{ margin: '2px 0' }}>PHIẾU THU</h3><div>Số: <b>{i.code}</b> · {fmtDateTime(i.createdAt)}</div></div>
      <p>Khách hàng: <b>{i.patient?.fullName ?? i.customerName}</b>{i.patient ? ` (${i.patient.code})` : ''}</p>
      <table><thead><tr><th>Nội dung</th><th className="r">SL</th><th className="r">Đơn giá</th><th className="r">Thành tiền</th></tr></thead><tbody>
        {i.lines.map((l: any) => <tr key={l.id}><td>{l.name}</td><td className="r">{l.qty}</td><td className="r">{vnd(l.unitPrice)}</td><td className="r">{vnd(l.amount)}</td></tr>)}</tbody></table>
      {i.discount > 0 && <p className="r">Giảm giá: −{vnd(i.discount)}</p>}
      <p className="r"><b>Tổng cộng: {vnd(i.total)}</b><br />Đã thanh toán: {vnd(i.paid)} ({i.payments.map((p: any) => METHOD_LABEL[p.method]).join(', ')}){i.total > i.paid && <><br /><b>Còn nợ: {vnd(i.total - i.paid)}</b></>}</p>
      {i.status === 'VOID' && <p><b>PHIẾU ĐÃ HỦY</b></p>}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 18, textAlign: 'center' }}><div>Khách hàng<br /><i>(Ký, ghi rõ họ tên)</i></div><div>Người thu tiền<br /><i>(Ký, ghi rõ họ tên)</i></div></div>
      <p style={{ textAlign: 'center', fontSize: 10 }}>Phiếu thu nội bộ – {INV_STATUS[i.status]}</p>
    </div>
  );
}
