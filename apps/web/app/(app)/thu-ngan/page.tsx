'use client';
import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { api, fmtTime, INV_STATUS, vnd } from '@/lib/api';

export default function Cashier() {
  const [queue, setQueue] = useState<any[]>([]); const [invs, setInvs] = useState<any[]>([]); const [err, setErr] = useState('');
  const load = useCallback(() => { api('/encounters/queue').then((r) => setQueue(r.filter((e: any) => e.status === 'CHECKOUT'))).catch((e) => setErr(e.message)); api('/invoices').then(setInvs).catch(() => {}); }, []);
  useEffect(() => { load(); const t = setInterval(load, 15000); return () => clearInterval(t); }, [load]);
  const live = invs.filter((i) => i.status !== 'VOID');
  const byMethod = (m: string) => live.flatMap((i) => i.payments).filter((p: any) => p.method === m).reduce((a: number, p: any) => a + p.amount, 0);
  return (
    <>
      <div className="row" style={{ alignItems: 'center' }}><h1 style={{ flex: 3 }}>Thu ngân</h1><div style={{ textAlign: 'right' }}><Link href="/thu-ngan/ban-le"><button className="sec">Bán lẻ tại quầy</button></Link></div></div>
      {err && <div className="err">{err}</div>}
      <h2>Chờ thu ngân ({queue.length})</h2>
      <div className="card tbl"><table><tbody>
        {queue.map((e) => <tr key={e.id}><td><b>STT {e.queueNo}</b></td><td>{e.patient.fullName}<br /><span className="mut">{e.patient.code}</span></td><td style={{ textAlign: 'right' }}><Link href={`/thu-ngan/${e.id}`}><button>Thu tiền</button></Link></td></tr>)}
        {!queue.length && <tr><td className="mut">Không có khách chờ thu ngân. (Khách làm xong buổi điều trị sẽ xuất hiện ở đây.)</td></tr>}
      </tbody></table></div>
      <h2>Phiếu thu hôm nay</h2>
      <div className="card"><b>Tổng thu: {vnd(live.reduce((a, i) => a + i.paid, 0))}</b> <span className="mut">· Tiền mặt {vnd(byMethod('CASH'))} · Chuyển khoản {vnd(byMethod('TRANSFER'))} · Thẻ {vnd(byMethod('CARD'))}</span></div>
      <div className="card tbl"><table><thead><tr><th>Mã</th><th>Giờ</th><th>Khách</th><th>Tổng</th><th>Đã thu</th><th></th></tr></thead><tbody>
        {invs.map((i) => <tr key={i.id} style={i.status === 'VOID' ? { opacity: .5, textDecoration: 'line-through' } : undefined}><td><Link href={`/thu-ngan/hoa-don/${i.id}`}>{i.code}</Link></td><td>{fmtTime(i.createdAt)}</td><td>{i.patient?.fullName ?? i.customerName}</td><td>{vnd(i.total)}</td><td>{vnd(i.paid)}</td><td><span className="badge">{INV_STATUS[i.status]}</span></td></tr>)}
        {!invs.length && <tr><td colSpan={6} className="mut">Chưa có phiếu thu.</td></tr>}
      </tbody></table></div>
    </>
  );
}
