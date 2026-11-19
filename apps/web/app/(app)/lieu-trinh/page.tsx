'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api, fmtDate } from '@/lib/api';

export default function Plans() {
  const [status, setStatus] = useState('ACTIVE'); const [rows, setRows] = useState<any[]>([]); const [me, setMe] = useState<any>(null); const [err, setErr] = useState('');
  useEffect(() => { api('/auth/me').then(setMe); }, []);
  useEffect(() => { api(`/plans?status=${status}`).then(setRows).catch((e) => setErr(e.message)); }, [status]);
  const clinical = me && me.role !== 'RECEPTION';
  return (
    <>
      <h1>Liệu trình điều trị</h1>
      <div className="row" style={{ marginBottom: 8 }}>
        {[['ACTIVE', 'Đang điều trị'], ['COMPLETED', 'Đã hoàn thành'], ['CANCELLED', 'Đã hủy']].map(([v, l]) => <button key={v} className={status === v ? '' : 'sec'} onClick={() => setStatus(v)}>{l}</button>)}
      </div>
      {err && <div className="err">{err}</div>}
      <div className="card tbl"><table>
        <thead><tr><th>Bệnh nhân</th><th>Tiến độ</th><th>Buổi gần nhất</th><th>Tần suất</th><th>KTV</th>{clinical && <th></th>}</tr></thead>
        <tbody>
          {rows.map((r) => <tr key={r.id}>
            <td><b>{r.patient.fullName}</b><br /><span className="mut">{r.patient.code} · {r.patient.phone}</span>{r.diagnosis && <><br /><span className="mut">{r.diagnosis}</span></>}</td>
            <td><b>{r.used}/{r.totalSessions}</b> <span className="mut">(còn {Math.max(r.totalSessions - r.used, 0)})</span>{r.reevalAfter && r.used > 0 && r.used % r.reevalAfter === 0 && r.status === 'ACTIVE' && <><br /><span className="badge" style={{ background: '#fff3cd' }}>Đến hạn tái lượng giá</span></>}</td>
            <td>{r.lastSessionAt ? fmtDate(r.lastSessionAt) : '—'}</td><td>{r.frequency ?? '—'}</td><td>{r.therapistName ?? '—'}</td>
            {clinical && <td><Link href={`/lieu-trinh/${r.id}`}><button className="sec">Mở</button></Link></td>}
          </tr>)}
          {!rows.length && <tr><td colSpan={6} className="mut">Không có liệu trình.</td></tr>}
        </tbody></table></div>
    </>
  );
}
