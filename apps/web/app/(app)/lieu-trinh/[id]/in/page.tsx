'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { api, fmtDate, PP_LABEL, PP_LEGEND } from '@/lib/api';

export default function PrintPlan() {
  const { id } = useParams<{ id: string }>(); const [p, setP] = useState<any>(null); const [err, setErr] = useState('');
  useEffect(() => { api(`/plans/${id}`).then(setP).catch((e) => setErr(e.message)); }, [id]);
  useEffect(() => { if (p) setTimeout(() => window.print(), 600); }, [p]);
  if (err) return <div className="err">{err}</div>; if (!p) return <div>Đang tải…</div>;
  // Mỗi tờ A4 gồm 10 buổi như mẫu; luôn in ít nhất 1 tờ
  const pages = Math.max(1, Math.ceil(Math.max(p.totalSessions, p.sessions.length) / 10));
  return (
    <div className="pp">
      <style>{`@page{size:A4;margin:10mm}.pp{font:11px/1.3 "Times New Roman",serif;color:#000;max-width:190mm;margin:0 auto;background:#fff}.pp .pg{page-break-after:always;height:272mm;overflow:hidden;position:relative}.pp .pg:last-child{page-break-after:auto}.pp .hd{display:flex;gap:10px;align-items:center;border-bottom:2px solid #000;padding-bottom:4px}.pp .hd img{width:56px}.pp .hd h1{flex:1;text-align:center;font-size:15px;margin:0}.pp table{width:100%;border-collapse:collapse;margin-top:6px}.pp th,.pp td{border:1px solid #000;padding:3px 4px;vertical-align:top}.pp th{font-size:10px}.pp .no{text-align:center;width:44px}.pp tr.s{height:22mm}.pp .ln{white-space:nowrap}.pp .leg{font-size:9px;margin-top:6px}.pp .info{display:flex;gap:16px;margin-top:6px}.pp .info div{flex:1}@media screen{body{background:#eee}.pp{padding:10mm;box-shadow:0 0 6px #0003;margin:10px auto}}`}</style>
      {Array.from({ length: pages }, (_, pg) => (
        <div className="pg" key={pg}>
          <div className="hd"><img src="/logo.jpg" alt="" /><h1>PHIẾU THEO DÕI ĐIỀU TRỊ</h1><div style={{ fontSize: 10 }}>Tờ {pg + 1}/{pages}</div></div>
          <div className="info"><div><b>HỌ TÊN NGƯỜI BỆNH:</b> {p.patient.fullName} ({p.patient.code}, {p.patient.birthYear})</div><div><b>BÁC SĨ:</b> {p.doctorName}</div></div>
          <div style={{ marginTop: 3 }}><b>CHẨN ĐOÁN:</b> {p.diagnosis ?? ''}</div>
          <table>
            <thead><tr><th className="no">BUỔI / NGÀY</th><th>DIỄN TIẾN</th><th style={{ width: '34%' }}>PHƯƠNG PHÁP ĐIỀU TRỊ<br />PP · TG · THÔNG SỐ / VÙNG</th><th style={{ width: 70 }}>THỰC HIỆN</th><th style={{ width: 70 }}>GHI CHÚ</th></tr></thead>
            <tbody>
              {Array.from({ length: 10 }, (_, i) => { const no = pg * 10 + i + 1; const s = p.sessions.find((x: any) => x.sessionNo === no);
                return <tr key={no} className="s"><td className="no"><b>{String(no).padStart(2, '0')}</b><br />{s ? fmtDate(s.date) : '__/__/20__'}</td>
                  <td>{s?.progress}</td><td>{s?.lines.map((l: any) => <div key={l.id} className="ln">{PP_LABEL[l.serviceCode]} · {l.minutes ?? ''}′ · {l.detail ?? ''}</div>)}</td><td>{s?.performedByName}</td><td>{s?.note}{s?.adverse ? ' (Phản ứng bất thường)' : ''}</td></tr>; })}
            </tbody>
          </table>
          <div className="leg"><b>MÃ PP</b> {PP_LEGEND}<br /><b>Quy ước ghi:</b> mỗi phương pháp 1 dòng — PP | TG | thông số/vùng. Thiết bị: ĐX chế độ–tần số–cường độ · SA MHz–W/cm²–chế độ · XK tần số–áp lực–số xung · TT cường độ–tần số · HN khoảng cách.</div>
        </div>
      ))}
    </div>
  );
}
