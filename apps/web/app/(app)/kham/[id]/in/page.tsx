'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api';
import { EXAM_SECTIONS, getPath, optL, optV, TESTS, VITALS } from '@/lib/exam-schema';

const box = (on: boolean) => (on ? '☒' : '☐');
const dateVN = (s: string) => new Date(s).toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });

export default function PrintExam() {
  const { id } = useParams<{ id: string }>(); const [c, setC] = useState<any>(null); const [err, setErr] = useState('');
  useEffect(() => { api(`/exams/by-encounter/${id}`).then(setC).catch((e) => setErr(e.message)); }, [id]);
  useEffect(() => { if (c) setTimeout(() => window.print(), 600); }, [c]);
  if (err) return <div className="err">{err}</div>; if (!c) return <div>Đang tải…</div>;
  const d = c.exam?.effective ?? {}; const p = c.patient; const g = (k: string) => getPath(d, k);
  return (
    <div className="print">
      <style>{`@page{size:A4;margin:12mm}.print{font:12px/1.35 "Times New Roman",serif;color:#000;max-width:190mm;margin:0 auto;background:#fff}.print h3{margin:8px 0 3px;font-size:13px;border-bottom:1px solid #000}.print .hd{display:flex;align-items:center;gap:12px;border-bottom:2px solid #000;padding-bottom:6px}.print .hd img{width:70px}.print .hd h1{font-size:16px;margin:0;text-align:center;flex:1}.print td{padding:2px 4px;vertical-align:top;border:0}.print .l{font-weight:bold;white-space:nowrap}.print .sig{display:flex;justify-content:flex-end;margin-top:16px;text-align:center}.print table{width:100%;border-collapse:collapse}.print .v{border-bottom:1px dotted #555;min-height:14px;white-space:pre-wrap}@media screen{body{background:#eee}.print{padding:12mm;box-shadow:0 0 6px #0003;margin:10px auto}}`}</style>
      <div className="hd"><img src="/logo.jpg" alt="" /><h1>PHIẾU KHÁM NGOẠI TRÚ<br /><small>Y học cổ truyền – Phục hồi chức năng</small></h1></div>
      <table><tbody>
        <tr><td className="l">Mã HS</td><td>{p.code}</td><td className="l">Ngày khám</td><td>{dateVN(c.encounter.visitDate)}</td><td className="l">Lần khám</td><td>{c.encounter.visitNo}</td></tr>
        <tr><td className="l">Bác sĩ</td><td>{c.doctorName ?? ''}</td><td className="l">Trị liệu viên</td><td colSpan={3}>{c.therapistName ?? ''}</td></tr>
        <tr><td className="l">Họ và tên</td><td>{p.fullName}</td><td className="l">Năm sinh</td><td>{p.birthYear}</td><td className="l">Giới tính</td><td>{box(p.gender === 'MALE')} Nam {box(p.gender === 'FEMALE')} Nữ</td></tr>
        <tr><td className="l">Điện thoại</td><td>{p.phone}</td><td className="l">Nghề nghiệp</td><td colSpan={3}>{p.occupation ?? ''}</td></tr>
        <tr><td className="l">Địa chỉ</td><td colSpan={5}>{p.address ?? ''}</td></tr>
      </tbody></table>
      {EXAM_SECTIONS.map((s) => (
        <div key={s.no}><h3>{s.no}. {s.title}</h3>
          {s.blocks.map((b, i) => {
            if (b.t === 'sub') return <div key={i} className="l" style={{ marginTop: 3 }}>{b.label}</div>;
            if (b.t === 'text' || b.t === 'icd') return <div key={i}><span className="l">{b.label}: </span><span className="v">{g(b.k)}</span></div>;
            if (b.t === 'checks' || b.t === 'radio') { const v = g(b.k); const on = (x: string) => (b.t === 'checks' ? (v ?? []).includes(x) : v === x);
              return <div key={i}><span className="l">{b.label}: </span>{b.options.map((o) => <span key={optV(o)} style={{ marginRight: 8 }}>{box(on(optV(o)))} {optL(o)}</span>)}{b.other && g(b.other) ? <span>Khác: {g(b.other)}</span> : null}</div>; }
            if (b.t === 'vitals') return <div key={i}>{VITALS.map((v) => <span key={v.k} style={{ marginRight: 12 }}><b>{v.label}</b> {g(`vitals.${v.k}`) ?? '…'} {v.unit}</span>)}</div>;
            if (b.t === 'tests') return <div key={i}>{TESTS.map((t) => <div key={t.group}><span className="l">{t.group}: </span>{t.items.map((x) => { const r = g(`msk.neuro.tests.${x}`); return <span key={x} style={{ marginRight: 8 }}>{x} {box(r === '-')}- {box(r === '+')}+</span>; })}</div>)}</div>;
            if (b.t === 'drugs') return <table key={i} style={{ border: '1px solid #000' }}><thead><tr><td className="l" style={{ border: '1px solid #000' }}>Tên thuốc</td><td className="l" style={{ border: '1px solid #000' }}>Liều / cách dùng</td></tr></thead><tbody>{(g('drugs') ?? []).map((r: any, j: number) => <tr key={j}><td style={{ border: '1px solid #000' }}>{r.name}</td><td style={{ border: '1px solid #000' }}>{r.dose}</td></tr>)}</tbody></table>;
          })}
        </div>
      ))}
      <div className="sig"><div>BÁC SĨ KHÁM<br /><i>Ký, ghi rõ họ tên</i><br /><br />{c.exam?.status === 'SIGNED' ? <><b>{c.exam.signedBy?.fullName}</b><br /><small>Đã ký điện tử {new Date(c.exam.signedAt).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}</small></> : <small>(chưa ký)</small>}</div></div>
    </div>
  );
}
