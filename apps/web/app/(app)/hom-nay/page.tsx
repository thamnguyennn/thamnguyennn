'use client';
import { useCallback, useEffect, useState } from 'react';
import { api, STATUS_LABEL } from '@/lib/api';

const NEXT: Record<string, { to: string; label: string }[]> = {
  WAITING: [{ to: 'IN_EXAM', label: 'Bắt đầu khám' }],
  IN_EXAM: [{ to: 'IN_TREATMENT', label: 'Chuyển điều trị' }, { to: 'CHECKOUT', label: 'Chuyển thu ngân' }],
  IN_TREATMENT: [{ to: 'CHECKOUT', label: 'Chuyển thu ngân' }],
  CHECKOUT: [{ to: 'DONE', label: 'Hoàn tất' }],
};

export default function Today() {
  const [rows, setRows] = useState<any[]>([]); const [mine, setMine] = useState(true); const [err, setErr] = useState('');
  const load = useCallback(() => api(`/encounters/queue?mine=${mine ? 1 : 0}`).then(setRows).catch((e) => setErr(e.message)), [mine]);
  useEffect(() => { load(); const t = setInterval(load, 15000); return () => clearInterval(t); }, [load]);
  const move = async (id: string, status: string) => { await api(`/encounters/${id}/status`, { method: 'PATCH', body: { status } }); load(); };
  return (
    <>
      <h1>Hàng đợi hôm nay</h1>
      <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}><input type="checkbox" style={{ width: 'auto' }} checked={mine} onChange={(e) => setMine(e.target.checked)} /> Chỉ khách của tôi (và chưa phân công)</label>
      {err && <div className="err">{err}</div>}
      <div className="card tbl"><table>
        <thead><tr><th>STT</th><th>Mã HS</th><th>Họ tên</th><th>Năm sinh</th><th>Lần khám</th><th>Trạng thái</th><th></th></tr></thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id}>
              <td><b>{r.queueNo}</b></td><td>{r.patient.code}</td><td>{r.patient.fullName}</td><td>{r.patient.birthYear}</td><td>{r.visitNo}</td>
              <td><span className={`badge ${r.status}`}>{STATUS_LABEL[r.status]}</span></td>
              <td>{(NEXT[r.status] ?? []).map((n) => <button key={n.to} className="sec" style={{ marginRight: 6 }} onClick={() => move(r.id, n.to)}>{n.label}</button>)}</td>
            </tr>
          ))}
          {!rows.length && <tr><td colSpan={7} className="mut">Chưa có khách trong hàng đợi.</td></tr>}
        </tbody>
      </table></div>
      <p className="mut">Phiếu khám YHCT, chỉ định và phiếu theo dõi sẽ mở từ đây ở các giai đoạn sau.</p>
    </>
  );
}
