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
  let docSecret = ''; let mgrSecret = '';
  let app: NestExpressApplication; let http: any; const db = new PrismaClient();
  let ipn = 0; const agent = () => request.agent(http).set('X-Forwarded-For', `10.1.${++ipn}.1`);

  beforeAll(async () => {
    process.env.ADMIN_PASSWORD = 'Admin12345x';
    await db.$executeRawUnsafe('TRUNCATE "AuthSession","AuditLog","Encounter","Appointment","Lead","PatientConsent","Patient","Counter","User","LeadSource","Product","PackageTemplate","StockMovement" CASCADE');
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
    mgrSecret = s.body.secret;
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
    docSecret = sec.body.secret;
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

  it('liệu trình: chỉ định → trị liệu viên ghi buổi → đếm buổi, cảnh báo DEFER, khóa sửa, phân quyền', async () => {
    const doc = agent();
    const l = await doc.post('/api/auth/login').send({ username: 'bs.an', password: 'Demo@12345' }).expect(200);
    await doc.post('/api/auth/2fa/verify').send({ ticket: l.body.ticket, code: generateSync({ secret: docSecret }) }).expect(200);
    const lt = agent(); await lt.post('/api/auth/login').send({ username: 'tl.hoa', password: 'Demo@12345' });
    const kv = agent(); await kv.post('/api/auth/login').send({ username: 'kv.minh', password: 'Demo@12345' });
    const p = (await lt.post('/api/patients').send({ fullName: 'Phạm Liệu Trình', birthYear: 1990, gender: 'FEMALE', phone: '0933444555', consent: true }).expect(201)).body;
    const enc = (await lt.post('/api/encounters/check-in').send({ patientId: p.id }).expect(201)).body;
    const ex1 = (await doc.put(`/api/exams/by-encounter/${enc.id}`).send({ data: { reason: 'Đau cổ', screening: { conclusion: 'DEFER' }, diagnosis: { modernMain: 'M54.2' } }, rev: 0 }).expect(200)).body;

    await kv.post('/api/plans').send({}).expect(403);
    await doc.post('/api/plans').send({ encounterId: enc.id, totalSessions: 2, items: [{ serviceCode: 'XYZ' }] }).expect(400); // không có trong bảng giá
    const plan = (await doc.post('/api/plans').send({ encounterId: enc.id, totalSessions: 2, reevalAfter: 1, frequency: '2 buổi/tuần', items: [{ serviceCode: 'CC', region: 'Cổ gáy' }, { serviceCode: 'DX' }] }).expect(201)).body;

    const line = { serviceCode: 'CC', minutes: 20, detail: 'Cổ gáy' };
    const need = await kv.post(`/api/plans/${plan.id}/sessions`).send({ lines: [line] }).expect(409);
    expect(need.body.code).toBe('SCREENING_DEFER');                                   // phải xác nhận rủi ro
    await lt.post(`/api/plans/${plan.id}/sessions`).send({ lines: [line], acknowledgeRisk: true }).expect(403); // lễ tân không ghi được
    await kv.post(`/api/plans/${plan.id}/sessions`).send({ lines: [{ serviceCode: 'ZZZ' }], acknowledgeRisk: true }).expect(400);
    const s1 = (await kv.post(`/api/plans/${plan.id}/sessions`).send({ lines: [line, { serviceCode: 'DX', minutes: 10, detail: 'TENS 80Hz' }], progress: 'Đỡ đau', acknowledgeRisk: true }).expect(201)).body;
    expect(s1.sessionNo).toBe(1);
    expect((await db.encounter.findUnique({ where: { id: enc.id } }))!.status).toBe('CHECKOUT');
    await kv.post(`/api/plans/${plan.id}/sessions`).send({ lines: [line], acknowledgeRisk: true }).expect(409); // lượt khám này đã ghi

    let d = (await kv.get(`/api/plans/${plan.id}`).expect(200)).body;
    expect([d.used, d.remaining, d.reevalDue, d.safety.conclusion]).toEqual([1, 1, true, 'DEFER']);
    await kv.patch(`/api/plans/${plan.id}/sessions/${s1.id}`).send({ lines: [line], progress: 'Đỡ đau nhiều' }).expect(200);   // cùng ngày: sửa được
    await db.treatmentSession.update({ where: { id: s1.id }, data: { createdAt: new Date(Date.now() - 2 * 86400000) } });
    await kv.patch(`/api/plans/${plan.id}/sessions/${s1.id}`).send({ lines: [line] }).expect(403);                              // qua ngày: khóa

    // buổi 2 ở lượt khám mới → đủ số buổi → liệu trình hoàn tất
    await lt.patch(`/api/encounters/${enc.id}/status`).send({ status: 'DONE' });
    const enc2 = (await lt.post('/api/encounters/check-in').send({ patientId: p.id }).expect(201)).body;
    const q = (await kv.get('/api/encounters/queue').expect(200)).body.find((e: any) => e.id === enc2.id);
    expect(q.plan).toMatchObject({ id: plan.id, used: 1, total: 2 });
    const s2 = (await kv.post(`/api/plans/${plan.id}/sessions`).send({ lines: [line], acknowledgeRisk: true }).expect(201)).body;
    expect(s2.sessionNo).toBe(2);
    expect((await db.treatmentPlan.findUnique({ where: { id: plan.id } }))!.status).toBe('COMPLETED');
    await kv.post(`/api/plans/${plan.id}/sessions`).send({ lines: [line], acknowledgeRisk: true }).expect(409);

    // lễ tân chỉ thấy tiến độ, không thấy chẩn đoán/nội dung
    const rl = (await lt.get('/api/plans?status=COMPLETED').expect(200)).body.find((x: any) => x.id === plan.id);
    expect(rl.used).toBe(2); expect(rl.diagnosis).toBeUndefined();
    await lt.get(`/api/plans/${plan.id}`).expect(403);
    await db.treatmentPlan.findUnique({ where: { id: plan.id } });
  });

  it('thu ngân + thuốc + kho + gói trả trước + hủy phiếu', async () => {
    const mgr = agent(); const m = await mgr.post('/api/auth/login').send({ username: 'ql.tam', password: 'Demo@12345' }).expect(200);
    await mgr.post('/api/auth/2fa/verify').send({ ticket: m.body.ticket, code: generateSync({ secret: mgrSecret }) }).expect(200);
    const doc = agent(); const d = await doc.post('/api/auth/login').send({ username: 'bs.an', password: 'Demo@12345' }).expect(200);
    await doc.post('/api/auth/2fa/verify').send({ ticket: d.body.ticket, code: generateSync({ secret: docSecret }) }).expect(200);
    const lt = agent(); await lt.post('/api/auth/login').send({ username: 'tl.an', password: 'Demo@12345' });

    await lt.post('/api/products').send({ code: 'T1', name: 'Cao dán thử', unit: 'hộp', price: 100000 }).expect(403);
    const prod = (await mgr.post('/api/products').send({ code: 'T1', name: 'Cao dán thử', unit: 'hộp', price: 100000, costPrice: 60000 }).expect(201)).body;
    await mgr.post(`/api/products/${prod.id}/stock-in`).send({ qty: 10, unitCost: 60000, lot: 'L1', expiryDate: '2028-01-01' }).expect(201);
    await mgr.post(`/api/products/${prod.id}/adjust`).send({ delta: -99, reason: 'kiểm kê thử' }).expect(400); // không cho tồn âm
    const tpl = (await mgr.post('/api/packages/templates').send({ name: 'Gói 3 buổi thử', sessions: 3, price: 1200000, validDays: 30 }).expect(201)).body;

    const p = (await lt.post('/api/patients').send({ fullName: 'Thu Ngân Thử', birthYear: 1980, gender: 'MALE', phone: '0911000999', consent: true }).expect(201)).body;
    const e1 = (await lt.post('/api/encounters/check-in').send({ patientId: p.id }).expect(201)).body;
    await doc.put(`/api/prescriptions/by-encounter/${e1.id}`).send({ lines: [{ productId: prod.id, name: 'Cao dán thử', qty: 2, dosage: 'Dán 1 miếng/ngày' }] }).expect(200);
    const co = (await lt.get(`/api/invoices/checkout/${e1.id}`).expect(200)).body;
    expect(co.suggestedProducts[0]).toMatchObject({ productId: prod.id, qty: 2, price: 100000, stock: 10 });

    const body = (extra: any = {}) => ({ encounterId: e1.id, lines: [{ kind: 'SERVICE', serviceCode: 'CC' }, { kind: 'PRODUCT', productId: prod.id, qty: 2 }, { kind: 'PACKAGE_SALE', templateId: tpl.id }], payments: [{ method: 'CASH', amount: 500000 }], ...extra });
    await lt.post('/api/invoices').send(body({ discount: 50000, discountReason: 'KH thân thiết' })).expect(403);   // lễ tân không giảm giá
    await lt.post('/api/invoices').send(body({ payments: [{ method: 'CASH', amount: 99999999 }] })).expect(400);   // thu quá
    await lt.post('/api/invoices').send({ ...body(), lines: [{ kind: 'PRODUCT', productId: prod.id, qty: 11 }] }).expect(409); // quá tồn
    const i1 = (await lt.post('/api/invoices').send(body()).expect(201)).body;
    expect([i1.subtotal, i1.total, i1.paid, i1.status]).toEqual([150000 + 200000 + 1200000, 1550000, 500000, 'PARTIAL']);
    expect(i1.code).toMatch(/^PT-\d\d-000001$/);
    expect((await mgr.get('/api/products').expect(200)).body.find((x: any) => x.id === prod.id).stock).toBe(8);
    expect((await db.encounter.findUnique({ where: { id: e1.id } }))!.status).toBe('DONE');
    await lt.post('/api/invoices').send(body()).expect(409);                                                         // 1 lượt = 1 phiếu
    await doc.put(`/api/prescriptions/by-encounter/${e1.id}`).send({ lines: [] }).expect(409);                       // đơn đã bán thì khóa
    const done = (await lt.post(`/api/invoices/${i1.id}/payments`).send({ method: 'TRANSFER', amount: 1050000, ref: 'CK123' }).expect(201)).body;
    expect([done.paid, done.status]).toEqual([1550000, 'PAID']);
    await lt.post(`/api/invoices/${i1.id}/payments`).send({ method: 'CASH', amount: 1 }).expect(400);

    // buổi sau: trừ 1 buổi từ gói đã mua
    await lt.patch(`/api/encounters/${e1.id}/status`).send({ status: 'DONE' });
    const e2 = (await lt.post('/api/encounters/check-in').send({ patientId: p.id }).expect(201)).body;
    const pk = (await lt.get(`/api/packages/patient/${p.id}`).expect(200)).body[0];
    expect(pk.remaining).toBe(3);
    const i2 = (await lt.post('/api/invoices').send({ encounterId: e2.id, lines: [{ kind: 'PACKAGE_USE', patientPackageId: pk.id }], payments: [] }).expect(201)).body;
    expect([i2.total, i2.status]).toEqual([0, 'PAID']);
    expect((await lt.get(`/api/packages/patient/${p.id}`)).body[0].remaining).toBe(2);

    // hủy: chỉ quản lý; gói đã dùng nên phiếu bán gói không hủy được; hủy phiếu trừ buổi thì hoàn buổi
    await lt.post(`/api/invoices/${i2.id}/void`).send({ reason: 'nhập nhầm buổi' }).expect(403);
    await mgr.post(`/api/invoices/${i2.id}/void`).send({ reason: 'nhập nhầm buổi' }).expect(201);
    expect((await lt.get(`/api/packages/patient/${p.id}`)).body[0].remaining).toBe(3);
    await mgr.post(`/api/invoices/${i1.id}/void`).send({ reason: 'khách hủy toàn bộ' }).expect(201);                 // gói chưa dùng → hủy được
    expect((await mgr.get('/api/products').expect(200)).body.find((x: any) => x.id === prod.id).stock).toBe(10);   // hoàn kho
    expect((await lt.get(`/api/packages/patient/${p.id}`)).body[0].status).toBe('CANCELLED');
    await mgr.post(`/api/invoices/${i1.id}/void`).send({ reason: 'hủy lại lần 2' }).expect(409);

    // quản lý giảm giá có lý do
    const e3 = (await lt.post('/api/encounters/check-in').send({ patientId: p.id }).expect(201)).body;
    const i3 = (await mgr.post('/api/invoices').send({ encounterId: e3.id, lines: [{ kind: 'SERVICE', serviceCode: 'COMBO_TC' }], discount: 100000, discountReason: 'Khách giới thiệu', payments: [{ method: 'CARD', amount: 700000 }] }).expect(201)).body;
    expect([i3.total, i3.status]).toEqual([700000, 'PAID']);
    expect(await db.auditLog.count({ where: { action: 'VOID' } })).toBe(2);
  });

  it('khóa tài khoản sau 5 lần sai', async () => {
    const ip = { 'X-Forwarded-For': '10.9.9.9' }; // IP khác để không dính giới hạn tốc độ của các test trên
    for (let i = 0; i < 5; i++) await request(http).post('/api/auth/login').set(ip).send({ username: 'kv.huy', password: 'x' }).expect(401);
    await request(http).post('/api/auth/login').set(ip).send({ username: 'kv.huy', password: 'Demo@12345' }).expect(403);
  });
});
