import { Test } from '@nestjs/testing';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { generateSync } from 'otplib';
import { PrismaClient } from '@prisma/client';
import { AppModule } from '../src/app.module';
import { decrypt } from '../src/common/crypto';

describe('EMR – đăng nhập, phân quyền, tiếp đón', () => {
  let app: NestExpressApplication; let http: any; const db = new PrismaClient();
  const agent = () => request.agent(http);

  beforeAll(async () => {
    process.env.ADMIN_PASSWORD = 'Admin12345x';
    await db.$executeRawUnsafe('TRUNCATE "AuthSession","AuditLog","Encounter","Appointment","Lead","PatientConsent","Patient","Counter","User","LeadSource" CASCADE');
    const { execSync } = require('child_process');
    execSync('npx ts-node prisma/seed.ts', { stdio: 'inherit', env: { ...process.env, ADMIN_PASSWORD: 'Admin12345x', SEED_DEMO: '1' } });
    const m = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = m.createNestApplication<NestExpressApplication>();
    app.set('trust proxy', 1); app.use(cookieParser()); app.setGlobalPrefix('api'); app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init(); http = app.getHttpServer();
  });
  afterAll(async () => { await app.close(); await db.$disconnect(); });

  it('lễ tân đăng nhập trực tiếp (không bắt buộc 2FA), sai mật khẩu bị từ chối', async () => {
    await request(http).post('/api/auth/login').send({ username: 'tl.an', password: 'sai' }).expect(401);
    const a = agent();
    const r = await a.post('/api/auth/login').send({ username: 'tl.an', password: 'Demo@12345' }).expect(200);
    expect(r.body.step).toBe('done');
    await a.get('/api/auth/me').expect(200);
  });

  it('chưa đăng nhập thì bị chặn', async () => { await request(http).get('/api/patients?q=abc').expect(401); });

  it('quản lý phải thiết lập 2FA, mã sai bị từ chối, mã đúng vào được', async () => {
    const a = agent();
    const l = await a.post('/api/auth/login').send({ username: 'ql.tam', password: 'Demo@12345' }).expect(200);
    expect(l.body.step).toBe('setup2fa');
    const s = await a.post('/api/auth/2fa/setup').send({ ticket: l.body.ticket }).expect(200);
    await a.post('/api/auth/2fa/verify').send({ ticket: l.body.ticket, code: '000000' }).expect(401);
    await a.post('/api/auth/2fa/verify').send({ ticket: l.body.ticket, code: generateSync({ secret: s.body.secret }) }).expect(200);
    await a.get('/api/users').expect(200);
    const u = await db.user.findUnique({ where: { username: 'ql.tam' } });
    expect(u!.totpEnabled).toBe(true);
    expect(u!.totpSecretEnc).not.toContain(s.body.secret); // lưu dạng mã hóa
    expect(decrypt(u!.totpSecretEnc!)).toBe(s.body.secret);
  });

  it('phân quyền: sale không xem được bệnh nhân/hàng đợi, lễ tân không quản lý người dùng', async () => {
    const sale = agent(); await sale.post('/api/auth/login').send({ username: 'sale.nam', password: 'Demo@12345' });
    await sale.get('/api/patients?q=nguyen').expect(403);
    await sale.get('/api/encounters/queue').expect(403);
    await sale.get('/api/leads').expect(200);
    const lt = agent(); await lt.post('/api/auth/login').send({ username: 'tl.an', password: 'Demo@12345' });
    await lt.get('/api/users').expect(403);
  });

  it('luồng: sale tạo lead + hẹn → lễ tân tạo hồ sơ → check-in → lần khám tăng, số thứ tự tăng', async () => {
    const sale = agent(); await sale.post('/api/auth/login').send({ username: 'sale.nam', password: 'Demo@12345' });
    const src = (await sale.get('/api/leads/sources')).body[0];
    const lead = (await sale.post('/api/leads').send({ fullName: 'Nguyễn Thị Hoa', phone: '+84 912 345 678', sourceId: src.id }).expect(201)).body;
    expect(lead.phone).toBe('0912345678');
    const at = new Date(Date.now() + 3600_000).toISOString();
    const appt = (await sale.post('/api/appointments').send({ leadId: lead.id, fullName: lead.fullName, phone: lead.phone, startAt: at }).expect(201)).body;

    const lt = agent(); await lt.post('/api/auth/login').send({ username: 'tl.an', password: 'Demo@12345' });
    const dto = { fullName: 'Nguyễn Thị Hoa', birthYear: 1985, gender: 'FEMALE', phone: '0912345678', consent: true };
    await lt.post('/api/patients').send({ ...dto, consent: false }).expect(400);
    const p = (await lt.post('/api/patients').send(dto).expect(201)).body;
    expect(p.code).toMatch(/^KPV-\d\d-000001$/);
    const dup = await lt.post('/api/patients').send(dto).expect(409);
    expect(dup.body.code).toBe('POSSIBLE_DUPLICATE');

    const e1 = (await lt.post('/api/encounters/check-in').send({ patientId: p.id, appointmentId: appt.id }).expect(201)).body;
    expect([e1.visitNo, e1.queueNo]).toEqual([1, 1]);
    await lt.post('/api/encounters/check-in').send({ patientId: p.id }).expect(409); // đang mở
    await lt.patch(`/api/encounters/${e1.id}/status`).send({ status: 'DONE' }).expect(200);
    const e2 = (await lt.post('/api/encounters/check-in').send({ patientId: p.id }).expect(201)).body;
    expect([e2.visitNo, e2.queueNo]).toEqual([2, 2]);

    const found = (await lt.get('/api/patients?q=0912345').expect(200)).body;
    expect(found[0].code).toBe(p.code);
    expect((await db.lead.findUnique({ where: { id: lead.id } }))!.status).toBe('VISITED');
    expect(await db.auditLog.count({ where: { action: 'CHECK_IN' } })).toBe(2);
  });

  it('phiếu khám: lưu nháp, BMI tự tính, chống ghi đè, ký/khóa, điều chỉnh có lý do, phân quyền', async () => {
    const doc = agent();
    const l = await doc.post('/api/auth/login').send({ username: 'bs.an', password: 'Demo@12345' }).expect(200);
    const sec = await doc.post('/api/auth/2fa/setup').send({ ticket: l.body.ticket }).expect(200);
    await doc.post('/api/auth/2fa/verify').send({ ticket: l.body.ticket, code: generateSync({ secret: sec.body.secret }) }).expect(200);

    const lt = agent(); await lt.post('/api/auth/login').send({ username: 'tl.hoa', password: 'Demo@12345' });
    const p = (await lt.post('/api/patients').send({ fullName: 'Lê Văn Khám', birthYear: 1975, gender: 'MALE', phone: '0900111222', consent: true }).expect(201)).body;
    const enc = (await lt.post('/api/encounters/check-in').send({ patientId: p.id }).expect(201)).body;

    const g = (await doc.get(`/api/exams/by-encounter/${enc.id}`).expect(200)).body;
    expect(g.exam).toBeNull();
    const draft = { reason: 'Đau vai gáy 2 tuần', vitals: { height: 170, weight: 68 }, screening: { conclusion: 'CAUTION', cautions: ['pacemaker'] } };
    const s1 = (await doc.put(`/api/exams/by-encounter/${enc.id}`).send({ data: draft, rev: 0 }).expect(200)).body;
    expect(s1.data.vitals.bmi).toBe(23.5);
    expect((await db.encounter.findUnique({ where: { id: enc.id } }))!.status).toBe('IN_EXAM');
    await doc.put(`/api/exams/by-encounter/${enc.id}`).send({ data: draft, rev: 99 }).expect(409); // sai rev
    const s2 = (await doc.put(`/api/exams/by-encounter/${enc.id}`).send({ data: draft, rev: s1.rev }).expect(200)).body;

    // hàng đợi hiện cảnh báo sàng lọc, nhưng lễ tân/sale không đọc được nội dung phiếu
    const q = (await lt.get('/api/encounters/queue').expect(200)).body.find((e: any) => e.id === enc.id);
    expect(q.exam.screening).toBe('CAUTION');
    await lt.get(`/api/exams/by-encounter/${enc.id}`).expect(403);
    const kv = agent(); await kv.post('/api/auth/login').send({ username: 'kv.minh', password: 'Demo@12345' });
    await kv.get(`/api/exams/by-encounter/${enc.id}`).expect(200);                                  // KTV đọc được
    await kv.put(`/api/exams/by-encounter/${enc.id}`).send({ data: draft, rev: s2.rev }).expect(403); // nhưng không sửa

    // ký: thiếu chẩn đoán → từ chối
    const miss = await doc.post(`/api/exams/by-encounter/${enc.id}/sign`).send({ rev: s2.rev }).expect(400);
    expect(miss.body.message).toContain('Chẩn đoán');
    const s3 = (await doc.put(`/api/exams/by-encounter/${enc.id}`).send({ data: { ...draft, diagnosis: { modernMain: 'Đau vai gáy M54.2' } }, rev: s2.rev }).expect(200)).body;
    await doc.post(`/api/exams/by-encounter/${enc.id}/sign`).send({ rev: s3.rev }).expect(201);

    // đã ký: không ghi đè, chỉ thêm bản điều chỉnh
    await doc.put(`/api/exams/by-encounter/${enc.id}`).send({ data: { reason: 'sửa lén' }, rev: s3.rev + 1 }).expect(409);
    await doc.post(`/api/exams/by-encounter/${enc.id}/amend`).send({ reason: 'x', data: {} }).expect(400); // lý do quá ngắn
    await doc.post(`/api/exams/by-encounter/${enc.id}/amend`).send({ reason: 'Ghi nhầm lý do khám', data: { ...draft, reason: 'Đau vai gáy 3 tuần', diagnosis: { modernMain: 'Đau vai gáy M54.2' } } }).expect(201);
    const after = (await doc.get(`/api/exams/by-encounter/${enc.id}`).expect(200)).body.exam;
    expect(after.data.reason).toBe('Đau vai gáy 2 tuần');           // bản gốc còn nguyên
    expect(after.effective.reason).toBe('Đau vai gáy 3 tuần');      // bản hiệu lực là bản điều chỉnh
    expect(after.amendments).toHaveLength(1);
    expect(await db.auditLog.count({ where: { action: { in: ['SIGN', 'AMEND'] } } })).toBe(2);
  });

  it('khóa tài khoản sau 5 lần sai', async () => {
    const ip = { 'X-Forwarded-For': '10.9.9.9' }; // IP khác để không dính giới hạn tốc độ của các test trên
    for (let i = 0; i < 5; i++) await request(http).post('/api/auth/login').set(ip).send({ username: 'kv.huy', password: 'x' }).expect(401);
    await request(http).post('/api/auth/login').set(ip).send({ username: 'kv.huy', password: 'Demo@12345' }).expect(403);
  });
});
