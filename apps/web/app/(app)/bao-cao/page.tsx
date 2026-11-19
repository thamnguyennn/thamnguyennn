'use client';
import { useCallback, useEffect, useState } from 'react';
import { api, METHOD_LABEL, vnd } from '@/lib/api';

const vnDay = (d = new Date()) => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' }).format(d);
const addDays = (s: string, n: number) => vnDay(new Date(new Date(`${s}T12:00:00+07:00`).getTime() + n * 86400000));
const monthStart = (s: string) => `${s.slice(0, 7)}-01`;
const KIND: Record<string, string> = { SERVICE: 'Dịch vụ', PRODUCT: 'Thuốc', PACKAGE_SALE: 'Bán gói', PACKAGE_USE: 'Buổi dùng từ gói' };

function csv(name: string, head: string[], rows: (string | number)[][]) {
  const esc = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
  const blob = new Blob(['﻿' + [head, ...rows].map((r) => r.map(esc).join(',')).join('\n')], { type: 'text/csv;charset=utf-8' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `${name}.csv`; a.click();
}

export default function Reports() {
  const today = vnDay();
  const [from, setFrom] = useState(monthStart(today)); const [to, setTo] = useState(today); const [r, setR] = useState<any>(null); const [err, setErr] = useState('');
  const load = useCallback(() => { setErr(''); api(`/reports/summary?from=${from}&to=${to}`).then(setR).catch((e) => setErr(e.message)); }, [from, to]);
  useEffect(() => { load(); }, [load]);
  const preset = (a: string, b: string) => { setFrom(a); setTo(b); };
  const prevMonthEnd = addDays(monthStart(today), -1);

  return (
    <>
      <h1>Báo cáo</h1>
      <div className="card">
        <div className="row" style={{ alignItems: 'end' }}>
          <div><label>Từ ngày</label><input type="date" value={from} onChange={(e) => setFrom(e.target.value)} /></div>
          <div><label>Đến ngày</label><input type="date" value={to} onChange={(e) => setTo(e.target.value)} /></div>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
          <button className="sec" onClick={() => preset(today, today)}>Hôm nay</button>
          <button className="sec" onClick={() => preset(addDays(today, -6), today)}>7 ngày</button>
          <button className="sec" onClick={() => preset(monthStart(today), today)}>Tháng này</button>
          <button className="sec" onClick={() => preset(monthStart(prevMonthEnd), prevMonthEnd)}>Tháng trước</button>
        </div>
      </div>
      {err && <div className="err">{err}</div>}
      {r && <Body r={r} />}
    </>
  );
}

function Kpi({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return <div className="card" style={{ margin: 0 }}><div className="mut" style={{ fontSize: '.85rem' }}>{label}</div><div style={{ fontSize: '1.4rem', fontWeight: 700 }}>{value}</div>{sub && <div className="mut" style={{ fontSize: '.8rem' }}>{sub}</div>}</div>;
}

// Thanh ngang đơn giản: độ dài tỉ lệ với giá trị lớn nhất, luôn kèm số liệu
function Bar({ v, max }: { v: number; max: number }) {
  return <div style={{ background: '#f1ecdc', borderRadius: 4, height: 8, minWidth: 60 }}><div style={{ width: `${max ? Math.max(2, (v / max) * 100) : 0}%`, height: 8, borderRadius: 4, background: 'var(--gold)' }} /></div>;
}

function Table({ title, head, rows, file, money = [] }: { title: string; head: string[]; rows: (string | number)[][]; file: string; money?: number[] }) {
  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><b>{title}</b>{rows.length > 0 && <button className="sec" style={{ minHeight: 32, padding: '2px 10px' }} onClick={() => csv(file, head, rows)}>Tải CSV</button>}</div>
      <div className="tbl"><table><thead><tr>{head.map((h) => <th key={h}>{h}</th>)}</tr></thead>
        <tbody>{rows.map((row, i) => <tr key={i}>{row.map((c, j) => <td key={j}>{money.includes(j) ? vnd(c as number) : c}</td>)}</tr>)}{!rows.length && <tr><td colSpan={head.length} className="mut">Không có dữ liệu.</td></tr>}</tbody></table></div>
    </div>
  );
}

function Body({ r }: { r: any }) {
  const k = r.kpi; const maxDay = Math.max(1, ...r.byDay.map((d: any) => d.revenue)); const maxSvc = Math.max(1, ...r.byService.map((s: any) => s.revenue));
  return (
    <>
      <div className="grid2" style={{ gridTemplateColumns: 'repeat(auto-fill,minmax(170px,1fr))', marginBottom: 12 }}>
        <Kpi label="Doanh thu (ròng)" value={vnd(k.revenueNet)} sub={`${k.invoices} phiếu · TB ${vnd(k.avgTicket)}/phiếu`} />
        <Kpi label="Đã thu trong kỳ" value={vnd(k.collected)} sub={k.discount ? `Giảm giá ${vnd(k.discount)}` : undefined} />
        <Kpi label="Lượt khám" value={k.visits} sub={`${k.patients} bệnh nhân · ${k.sessions} buổi điều trị`} />
        <Kpi label="Bệnh nhân mới / quay lại" value={`${k.newPatients} / ${k.returningPatients}`} sub={`${k.returningShare}% bệnh nhân đến là khách quay lại`} />
        <Kpi label="Liệu trình" value={`${r.plans.completed}/${r.plans.created}`} sub={`hoàn thành · ${r.plans.abandoned} bỏ dở (>14 ngày) · TB ${r.plans.avgCompletion}% số buổi`} />
        <Kpi label="Công nợ phải thu" value={vnd(k.outstanding)} sub="toàn thời gian" />
      </div>

      {r.byDay.length > 1 && <div className="card"><b>Doanh thu thu được theo ngày</b>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 110, marginTop: 8, overflowX: 'auto' }}>
          {r.byDay.map((d: any) => <div key={d.day} title={`${d.day}: ${vnd(d.revenue)} · ${d.visits} lượt`} style={{ flex: '1 0 8px', minWidth: 8, height: `${Math.max(2, (d.revenue / maxDay) * 100)}%`, background: d.revenue ? 'var(--gold)' : '#e6dfce', borderRadius: '3px 3px 0 0' }} />)}
        </div>
        <div className="mut" style={{ fontSize: '.8rem', display: 'flex', justifyContent: 'space-between' }}><span>{r.byDay[0].day}</span><span>Cao nhất: {vnd(maxDay)}</span><span>{r.byDay[r.byDay.length - 1].day}</span></div></div>}

      <div className="card"><b>Doanh thu theo dịch vụ</b><div className="tbl"><table><thead><tr><th>Mục</th><th>Loại</th><th>SL</th><th>Doanh thu</th><th></th></tr></thead><tbody>
        {r.byService.map((s: any, i: number) => <tr key={i}><td>{s.name}</td><td>{KIND[s.kind]}</td><td>{s.qty}</td><td>{vnd(s.revenue)}</td><td style={{ width: '25%' }}><Bar v={s.revenue} max={maxSvc} /></td></tr>)}
        {!r.byService.length && <tr><td colSpan={5} className="mut">Không có dữ liệu.</td></tr>}</tbody></table></div>
        {r.byService.length > 0 && <button className="sec" style={{ minHeight: 32 }} onClick={() => csv('doanh-thu-dich-vu', ['Mục', 'Loại', 'SL', 'Doanh thu'], r.byService.map((s: any) => [s.name, KIND[s.kind], s.qty, s.revenue]))}>Tải CSV</button>}
        <p className="mut" style={{ marginBottom: 0 }}>Doanh thu ròng đã trừ phần giảm giá theo tỉ lệ. "Buổi dùng từ gói" có doanh thu 0 vì tiền đã tính ở lúc bán gói.</p></div>

      <Table title="Hình thức thanh toán" file="thanh-toan" money={[1]} head={['Hình thức', 'Số tiền thu']} rows={r.byMethod.map((m: any) => [METHOD_LABEL[m.method], m.amount])} />
      <Table title="Theo nguồn khách (bệnh nhân đến từ kênh nào)" file="nguon-khach" money={[3]} head={['Nguồn', 'Bệnh nhân', 'Lượt khám', 'Doanh thu']} rows={r.bySource.map((s: any) => [s.name, s.patients, s.visits, s.revenue])} />
      <Table title="Phễu khách mới theo nguồn (lead tạo trong kỳ)" file="pheu-khach" head={['Nguồn', 'Lead', 'Đã đặt lịch', 'Đã đến khám', 'Mất khách']} rows={r.funnel.map((f: any) => [f.name, f.leads, f.booked, f.visited, f.lost])} />
      <Table title="Hiệu quả từng sale (doanh thu từ khách do sale phụ trách)" file="sale" money={[2]} head={['Sale', 'Bệnh nhân', 'Doanh thu']} rows={r.bySale.map((s: any) => [s.name, s.patients, s.revenue])} />
      <Table title="Khối lượng việc của trị liệu viên" file="tri-lieu-vien" head={['Trị liệu viên', 'Buổi', 'Tổng phút', 'Liệu trình', 'Phản ứng bất thường']} rows={r.byTherapist.map((t: any) => [t.name, t.sessions, t.minutes, t.patients, t.adverse])} />
      <Table title="Bác sĩ" file="bac-si" head={['Bác sĩ', 'Phiếu khám đã ký', 'Liệu trình chỉ định']} rows={r.byDoctor.map((d: any) => [d.name, d.exams, d.plans])} />
      <Table title="Thu ngân (phiếu thu đã lập)" file="thu-ngan" money={[2]} head={['Người lập', 'Số phiếu', 'Tổng tiền']} rows={r.byCashier.map((c: any) => [c.name, c.invoices, c.total])} />
      <Table title="Công nợ cần thu" file="cong-no" money={[3, 4, 5]} head={['Phiếu', 'Khách', 'SĐT', 'Tổng tiền', 'Đã thu', 'Còn nợ']} rows={r.debts.map((d: any) => [d.code, d.name ?? '', d.phone ?? '', d.total, d.paid, d.total - d.paid])} />
    </>
  );
}
