'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { api, fmtDate } from '@/lib/api';

export default function PrintRx() {
  const { encId } = useParams<{ encId: string }>(); const [d, setD] = useState<any>(null);
  useEffect(() => { api(`/prescriptions/by-encounter/${encId}`).then(setD); }, [encId]);
  useEffect(() => { if (d?.rx) setTimeout(() => window.print(), 500); }, [d]);
  if (!d?.rx) return <div>{d ? 'Chưa có đơn thuốc.' : 'Đang tải…'}</div>;
  const h = d.header; const p = h?.patient;
  return (
    <div className="rx">
      <style>{`@page{size:A5;margin:8mm}.rx{font:13px/1.45 "Times New Roman",serif;color:#000;max-width:130mm;margin:0 auto;background:#fff}.rx .hd{display:flex;gap:10px;align-items:center;border-bottom:2px solid #000;padding-bottom:4px}.rx .hd img{width:58px}.rx .hd h3{flex:1;text-align:center;margin:0;font-size:16px}.rx ol{padding-left:18px}.rx li{margin-bottom:6px}@media screen{body{background:#eee}.rx{padding:8mm;box-shadow:0 0 6px #0003;margin:10px auto}}`}</style>
      <div className="hd"><img src="/logo.jpg" alt="" /><h3>ĐƠN THUỐC</h3></div>
      {p && <p>Họ tên: <b>{p.fullName}</b> · Năm sinh: {p.birthYear} · Giới: {p.gender === 'MALE' ? 'Nam' : 'Nữ'}<br />Mã HS: {p.code} · Ngày: {fmtDate(h.visitDate)}<br />Chẩn đoán: {h.diagnosis}</p>}
      <ol>{d.rx.lines.map((l: any) => <li key={l.id}><b>{l.name}</b> — SL: {l.qty}{l.product?.unit ? ` ${l.product.unit}` : ''}<br /><i>{l.dosage}</i></li>)}</ol>
      {d.rx.note && <p>Lời dặn: {d.rx.note}</p>}
      <div style={{ textAlign: 'right', marginTop: 20 }}>Bác sĩ khám<br /><i>(Ký, ghi rõ họ tên)</i>{h?.doctorName && <><br /><br /><b>{h.doctorName}</b></>}</div>
    </div>
  );
}
