'use client';
import { useState } from 'react';
import { api } from '@/lib/api';

export default function Login() {
  const [step, setStep] = useState<'pw' | 'totp' | 'setup'>('pw');
  const [u, setU] = useState(''); const [p, setP] = useState(''); const [code, setCode] = useState('');
  const [ticket, setTicket] = useState(''); const [qr, setQr] = useState(''); const [secret, setSecret] = useState('');
  const [err, setErr] = useState(''); const [busy, setBusy] = useState(false);

  async function run(fn: () => Promise<void>) { setErr(''); setBusy(true); try { await fn(); } catch (e: any) { setErr(e.message); } finally { setBusy(false); } }
  const enter = () => { location.href = '/hom-nay'; };

  const submitPw = (e: React.FormEvent) => { e.preventDefault(); run(async () => {
    const r = await api('/auth/login', { body: { username: u, password: p } });
    if (r.step === 'done') return enter();
    setTicket(r.ticket);
    if (r.step === 'setup2fa') { const s = await api('/auth/2fa/setup', { body: { ticket: r.ticket } }); setQr(s.qr); setSecret(s.secret); setStep('setup'); }
    else setStep('totp');
  }); };
  const submitCode = (e: React.FormEvent) => { e.preventDefault(); run(async () => { await api('/auth/2fa/verify', { body: { ticket, code } }); enter(); }); };

  return (
    <div className="center">
      <img src="/logo.jpg" alt="Khởi Phúc Việt Movia" />
      <div className="card">
        {step === 'pw' && (
          <form onSubmit={submitPw}>
            <label>Tên đăng nhập</label><input value={u} onChange={(e) => setU(e.target.value)} autoCapitalize="none" autoComplete="username" required />
            <label>Mật khẩu</label><input type="password" value={p} onChange={(e) => setP(e.target.value)} autoComplete="current-password" required />
            {err && <div className="err">{err}</div>}
            <p><button disabled={busy} style={{ width: '100%' }}>Đăng nhập</button></p>
          </form>
        )}
        {step === 'setup' && (
          <form onSubmit={submitCode}>
            <b>Thiết lập xác thực 2 lớp</b>
            <p className="mut">Mở ứng dụng Google Authenticator (hoặc Microsoft Authenticator) → quét mã QR → nhập mã 6 số.</p>
            <img className="qr" src={qr} alt="QR" />
            <p className="mut" style={{ wordBreak: 'break-all', fontSize: '.8rem' }}>Không quét được? Nhập khóa: {secret}</p>
            <label>Mã 6 số</label><input inputMode="numeric" value={code} onChange={(e) => setCode(e.target.value)} autoComplete="one-time-code" required />
            {err && <div className="err">{err}</div>}
            <p><button disabled={busy} style={{ width: '100%' }}>Xác nhận & vào hệ thống</button></p>
          </form>
        )}
        {step === 'totp' && (
          <form onSubmit={submitCode}>
            <b>Nhập mã xác thực</b>
            <label>Mã 6 số từ ứng dụng Authenticator</label><input inputMode="numeric" autoFocus value={code} onChange={(e) => setCode(e.target.value)} autoComplete="one-time-code" required />
            {err && <div className="err">{err}</div>}
            <p><button disabled={busy} style={{ width: '100%' }}>Xác nhận</button></p>
          </form>
        )}
      </div>
    </div>
  );
}
