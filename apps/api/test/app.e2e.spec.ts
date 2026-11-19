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

  it('khóa tài khoản sau 5 lần sai', async () => {
    const ip = { 'X-Forwarded-For': '10.9.9.9' }; // IP khác để không dính giới hạn tốc độ của các test trên
    for (let i = 0; i < 5; i++) await request(http).post('/api/auth/login').set(ip).send({ username: 'kv.huy', password: 'x' }).expect(401);
    await request(http).post('/api/auth/login').set(ip).send({ username: 'kv.huy', password: 'Demo@12345' }).expect(403);
  });
});
