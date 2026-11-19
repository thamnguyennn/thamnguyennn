'use client';
import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { api, STATUS_LABEL } from '@/lib/api';

const NEXT: Record<string, { to: string; label: string }[]> = {
  WAITING: [{ to: 'IN_EXAM', label: 'Bắt đầu khám' }],
  IN_EXAM: [{ to: 'IN_TREATMENT', label: 'Chuyển điều trị' }, { to: 'CHECKOUT', label: 'Chuyển thu ngân' }],
  IN_TREATMENT: [{ to: 'CHECKOUT', label: 'Chuyển thu ngân' }],
  CHECKOUT: [{ to: 'DONE', label: 'Hoàn tất' }],
};

export default function Today() {
  const [me, setMe] = useState<any>(null); const [rows, setRows] = useState<any[]>([]); const [mine, setMine] = useState(true); const [err, setErr] = useState('');
  const load = useCallback(() => api(`/encounters/queue?mine=${mine ? 1 : 0}`).then(setRows).catch((e) => setErr(e.message)), [mine]);
  useEffect(() => { api('/auth/me').then(setMe); }, []);
  useEffect(() => { load(); const t = setInterval(load, 15000); return () => clearInterval(t); }, [load]);
  const move = async (id: string, status: string) => { await api(`/encounters/${id}/status`, { method: 'PATCH', body: { status } }); load(); };
  return (
    <>
      <h1>Hàng đợi hôm nay</h1>
      <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}><input type="checkbox" style={{ width: 'auto' }} checked={mine} onChange={(e) => setMine(e.target.checked)} /> Chỉ khách của tôi (và chưa phân công)</label>
      {err && <div className="err">{err}</div>}
      <div className="card tbl"><table>
        <thead><tr><th>STT</th><th>Mã HS</th><th>Họ tên</th><th>Năm sinh</th><th>Lần khám</th><th>Trạng thái</th><th>An toàn</th><th></th></tr></thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id}>
              <td><b>{r.queueNo}</b></td><td>{r.patient.code}</td><td>{r.patient.fullName}</td><td>{r.patient.birthYear}</td><td>{r.visitNo}</td>
              <td><span className={`badge ${r.status}`}>{STATUS_LABEL[r.status]}</span></td>
              <td>{r.exam?.screening === 'CAUTION' ? <span title="Thận trọng khi điều trị">⚠️ Thận trọng</span> : r.exam?.screening === 'DEFER' ? <b style={{ color: 'var(--err)' }}>⛔ Hoãn/chuyển</b> : ''}</td>
              <td>{me?.role !== 'RECEPTION' && me?.role !== 'THERAPIST' && <Link href={`/kham/${r.id}`}><button className="sec" style={{ marginRight: 6 }}>Phiếu khám</button></Link>}
                {me?.role === 'THERAPIST' && (r.plan ? <Link href={`/lieu-trinh/${r.plan.id}?enc=${r.id}`}><button style={{ marginRight: 6 }}>Điều trị ({r.plan.used}/{r.plan.total})</button></Link> : <span className="mut">Chưa có liệu trình </span>)}
                {r.plan && me?.role !== 'THERAPIST' && <span className="badge" style={{ marginRight: 6 }}>Liệu trình {r.plan.used}/{r.plan.total}</span>}{(NEXT[r.status] ?? []).map((n) => <button key={n.to} className="sec" style={{ marginRight: 6 }} onClick={() => move(r.id, n.to)}>{n.label}</button>)}</td>
            </tr>
          ))}
          {!rows.length && <tr><td colSpan={8} className="mut">Chưa có khách trong hàng đợi.</td></tr>}
        </tbody>
      </table></div>
      <p className="mut">Phiếu khám YHCT, chỉ định và phiếu theo dõi sẽ mở từ đây ở các giai đoạn sau.</p>
    </>
  );
}
