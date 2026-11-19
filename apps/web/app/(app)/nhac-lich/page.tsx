'use client';
import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { api, fmtDate } from '@/lib/api';

const KIND: Record<string, { label: string; hint: string }> = {
  APPT_TOMORROW: { label: 'Nhắc lịch hẹn ngày mai', hint: 'Gửi tin xác nhận lịch' },
  NO_SHOW: { label: 'Khách chưa đến theo lịch', hint: 'Gọi/nhắn hỏi và đặt lại lịch' },
  AFTERCARE: { label: 'Lưu ý chăm sóc sau điều trị (hôm nay)', hint: 'Gửi tin lưu ý cho khách vừa điều trị' },
  NEXT_SESSION: { label: 'Nhắc buổi điều trị tiếp theo', hint: 'Đến hạn buổi kế tiếp, chưa có lịch hẹn' },
  LOST: { label: 'Khách lâu chưa quay lại (≥ 14 ngày)', hint: 'Liệu trình còn dang dở' },
  LEAD: { label: 'Khách mới chưa đặt lịch', hint: 'Gọi lại để chốt lịch hẹn' },
};
const OUT: [string, string][] = [['SENT', 'Đã gửi tin'], ['REACHED', 'Đã liên hệ được'], ['NO_ANSWER', 'Không nghe máy'], ['BOOKED', 'Đã hẹn lịch'], ['DECLINED', 'Không tiếp tục']];
const zalo = (phone: string) => `https://zalo.me/${phone.replace(/^0/, '84')}`;

export default function FollowUps() {
  const [items, setItems] = useState<any[]>([]); const [me, setMe] = useState<any>(null); const [err, setErr] = useState(''); const [msgs, setMsgs] = useState<Record<string, string>>({});
  const [copied, setCopied] = useState(''); const [tpls, setTpls] = useState<any[]>([]); const [showT, setShowT] = useState(false);
  const load = useCallback(() => api('/followups').then((r) => { setItems(r); setMsgs((m) => ({ ...Object.fromEntries(r.map((i: any) => [i.kind + i.key, i.message])), ...m })); }).catch((e) => setErr(e.message)), []);
  useEffect(() => { api('/auth/me').then(setMe); load(); }, [load]);
  const mk = (i: any) => i.kind + i.key;
  const copy = async (i: any) => { try { await navigator.clipboard.writeText(msgs[mk(i)]); } catch { /* một số điện thoại chặn: người dùng bôi đen và sao chép tay */ } setCopied(mk(i)); };
  const done = async (i: any, channel: string, outcome: string) => { setErr(''); try { await api('/followups/log', { body: { kind: i.kind, key: i.key, patientId: i.patientId ?? undefined, channel, outcome } }); load(); } catch (x: any) { setErr(x.message); } };

  const kinds = Object.keys(KIND).filter((k) => items.some((i) => i.kind === k));
  return (
    <>
      <div className="row" style={{ alignItems: 'center' }}><h1 style={{ flex: 3 }}>Nhắc lịch & chăm sóc</h1>
        <div style={{ textAlign: 'right' }}><button className="sec" onClick={() => { setShowT(!showT); if (!tpls.length) api('/followups/templates').then(setTpls); }}>Mẫu tin nhắn</button></div></div>
      <p className="mut">Hệ thống tự lập danh sách. Chọn <b>Mở Zalo</b> (đã chép sẵn nội dung) hoặc <b>Gọi</b>, sau đó bấm kết quả để khách được ẩn khỏi danh sách.</p>
      {err && <div className="err">{err}</div>}
      {showT && <div className="card">
        <b>Mẫu tin nhắn</b> <span className="mut">– Biến: {'{ten} {gio} {ngay} {da_dung} {tong} {con_lai} {so_ngay} {phongkham} {luu_y_dich_vu}'}. Nội dung lưu ý chăm sóc (aftercare_*) là bản soạn sẵn, <b>cần bác sĩ duyệt</b> trước khi dùng.</span>
        {tpls.map((t) => <TplEditor key={t.key} t={t} canEdit={me?.role === 'MANAGER'} />)}</div>}
      {!kinds.length && <div className="card mut">🎉 Không có khách nào cần nhắc lúc này.</div>}
      {kinds.map((k) => (
        <section key={k}>
          <h2>{KIND[k].label} ({items.filter((i) => i.kind === k).length})</h2><div className="mut" style={{ marginTop: -6, marginBottom: 6 }}>{KIND[k].hint}</div>
          {items.filter((i) => i.kind === k).map((i) => (
            <div className="card" key={mk(i)}>
              <b>{i.name}</b> · <a href={`tel:${i.phone}`}>{i.phone}</a><div className="mut">{i.info}</div>
              <textarea rows={4} style={{ marginTop: 8 }} value={msgs[mk(i)] ?? ''} onChange={(e) => setMsgs({ ...msgs, [mk(i)]: e.target.value })} />
              <div className="row" style={{ marginTop: 6 }}>
                <button className="sec" onClick={() => copy(i)}>{copied === mk(i) ? '✔ Đã chép' : 'Chép nội dung'}</button>
                <a href={zalo(i.phone)} target="_blank" rel="noreferrer" onClick={() => copy(i)}><button className="sec" style={{ width: '100%' }}>Mở Zalo</button></a>
                <a href={`tel:${i.phone}`}><button className="sec" style={{ width: '100%' }}>Gọi</button></a>
                {(i.kind === 'NEXT_SESSION' || i.kind === 'LOST' || i.kind === 'NO_SHOW' || i.kind === 'LEAD') && <Link href={`/lich-hen?name=${encodeURIComponent(i.name)}&phone=${i.phone}${i.patientId ? `&patient=${i.patientId}` : ''}${i.kind === 'LEAD' ? `&lead=${i.key}` : ''}`}><button style={{ width: '100%' }}>Đặt lịch</button></Link>}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                {OUT.filter(([o]) => k === 'AFTERCARE' || k === 'APPT_TOMORROW' ? ['SENT', 'NO_ANSWER'].includes(o) || o === 'REACHED' : true).map(([o, l]) => <button key={o} className="sec" onClick={() => done(i, o === 'SENT' ? 'ZALO' : 'CALL', o)}>{l}</button>)}
              </div>
            </div>))}
        </section>))}
    </>
  );
}

function TplEditor({ t, canEdit }: { t: any; canEdit: boolean }) {
  const [v, setV] = useState(t.body); const [ok, setOk] = useState('');
  return <div style={{ marginTop: 10 }}><label>{t.title} <span className="mut">({t.key})</span></label><textarea rows={3} disabled={!canEdit} value={v} onChange={(e) => { setV(e.target.value); setOk(''); }} />
    {canEdit && v !== t.body && <button className="sec" onClick={async () => { await api(`/followups/templates/${t.key}`, { method: 'PUT', body: { body: v } }); t.body = v; setOk('Đã lưu'); }}>Lưu mẫu</button>}{ok && <span className="ok"> {ok}</span>}</div>;
}
