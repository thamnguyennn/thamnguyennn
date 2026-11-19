import { PrismaClient, Role } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();
const hash = (p: string) => argon2.hash(p, { type: argon2.argon2id });

// Bảng giá theo Menu_KPV_Demo.docx (giá mỗi buổi)
const SERVICES = [
  { code: 'COMBO_CB', name: 'Combo Cơ bản', kind: 'COMBO', price: 500000, durationMin: 45, description: '01 vùng/vấn đề khu trú, mức nhẹ–trung bình. Điện xung/Siêu âm → Trị liệu cơ sâu & điểm co thắt → Giãn cơ/vận động & hướng dẫn sau trị liệu' },
  { code: 'COMBO_TC', name: 'Combo Tiêu chuẩn', kind: 'COMBO', price: 800000, durationMin: 60, durationMax: 75, description: 'Chuyên sâu 01 vùng hoặc chuỗi cơ–khớp liên quan. Điện xung/Siêu âm → Từ trường siêu dẫn/Xung kích → Trị liệu cơ sâu → Nắn chỉnh khớp → Bài tập cá thể hóa' },
  { code: 'COMBO_CS', name: 'Combo Chuyên sâu', kind: 'COMBO', price: 1300000, durationMin: 100, description: 'Toàn thân, nhiều chuỗi vấn đề phức tạp. Điện xung/Siêu âm → Từ trường siêu dẫn/Xung kích → Giải phóng cơ–mạc & chuỗi vận động → Nắn chỉnh khớp → Bài tập cá thể hóa' },
  { code: 'CC', name: 'Châm cứu (gồm điện châm, hơ ngải)', kind: 'SINGLE', price: 150000, durationMin: 20, unitNote: '01 vùng' },
  { code: 'DX', name: 'Điện xung trị liệu', kind: 'SINGLE', price: 150000, durationMin: 10, unitNote: '01 vùng' },
  { code: 'SA', name: 'Siêu âm trị liệu', kind: 'SINGLE', price: 150000, durationMin: 20, unitNote: '01 vùng' },
  { code: 'NE', name: 'Máy nén ép trị liệu', kind: 'SINGLE', price: 150000, durationMin: 20, unitNote: '01 vùng' },
  { code: 'PF', name: 'Nhúng sáp parafin trị liệu', kind: 'SINGLE', price: 150000, durationMin: 20, unitNote: '01 vùng' },
  { code: 'XK', name: 'Sóng xung kích trị liệu', kind: 'SINGLE', price: 200000, durationMin: 20, unitNote: '2000 xung/01 vùng' },
  { code: 'TT', name: 'Từ trường siêu dẫn', kind: 'SINGLE', price: 200000, durationMin: 20, unitNote: '01 vùng' },
  { code: 'HN', name: 'Đèn hồng ngoại', kind: 'SINGLE', price: 50000, durationMin: 20, unitNote: '01 vùng' },
  { code: 'TLMM', name: 'Trị liệu cơ – mô mềm chuyên sâu', kind: 'SINGLE', price: 400000, durationMin: 30, unitNote: '01 vùng' },
  { code: 'DDK', name: 'Di động khớp / nắn chỉnh cột sống', kind: 'SINGLE', price: 400000, durationMin: 20, unitNote: 'Theo chỉ định chuyên môn' },
];

// Bộ mã ICD-10 thường gặp để khởi đầu. Cần nhập danh mục đầy đủ theo bản chính thức của Bộ Y tế.
const ICD = [
  ['M54.2', 'Đau cổ'], ['M54.5', 'Đau thắt lưng'], ['M54.3', 'Đau thần kinh tọa'], ['M54.4', 'Đau thắt lưng kèm đau thần kinh tọa'],
  ['M54.1', 'Bệnh lý rễ thần kinh'], ['M54.6', 'Đau cột sống ngực'], ['M50.1', 'Thoát vị đĩa đệm cổ có bệnh lý rễ'], ['M51.1', 'Thoát vị đĩa đệm thắt lưng và đĩa đệm khác có bệnh lý rễ'],
  ['M47.8', 'Thoái hóa cột sống khác'], ['M47.9', 'Thoái hóa cột sống, không xác định'], ['M53.0', 'Hội chứng cổ – sọ'], ['M41.9', 'Vẹo cột sống, không xác định'],
  ['M75.0', 'Viêm dính bao khớp vai'], ['M75.1', 'Hội chứng chóp xoay'], ['M75.4', 'Hội chứng chèn ép khớp vai'], ['M77.1', 'Viêm lồi cầu ngoài xương cánh tay'],
  ['M17.9', 'Thoái hóa khớp gối, không xác định'], ['M16.9', 'Thoái hóa khớp háng, không xác định'], ['M15.9', 'Thoái hóa đa khớp, không xác định'], ['M19.9', 'Thoái hóa khớp, không xác định'],
  ['M25.5', 'Đau khớp'], ['M25.6', 'Cứng khớp'], ['M79.1', 'Đau cơ'], ['M79.6', 'Đau ở chi'], ['M62.8', 'Rối loạn cơ khác'],
  ['M72.2', 'Viêm cân gan chân'], ['M65.4', 'Viêm bao gân Quervain'], ['G56.0', 'Hội chứng ống cổ tay'], ['M81.9', 'Loãng xương, không xác định'],
  ['S33.5', 'Bong gân và căng giãn cột sống thắt lưng'], ['S13.4', 'Bong gân và căng giãn cột sống cổ'], ['S93.4', 'Bong gân cổ chân'],
  ['G51.0', 'Liệt dây thần kinh VII (liệt Bell)'], ['I69.3', 'Di chứng nhồi máu não'], ['G44.2', 'Đau đầu căng thẳng'], ['G47.0', 'Mất ngủ'], ['R51', 'Đau đầu'],
];

async function main() {
  for (const [i, sv] of SERVICES.entries())
    await prisma.service.upsert({ where: { code: sv.code }, create: { ...sv, sortOrder: i }, update: {} });
  for (const [code, name] of ICD) await prisma.icd10.upsert({ where: { code }, create: { code, name }, update: {} });

  for (const name of ['Facebook', 'Zalo', 'TikTok', 'Google/Website', 'Giới thiệu', 'Vãng lai'])
    await prisma.leadSource.upsert({ where: { name }, create: { name }, update: {} });

  // Tài khoản quản lý đầu tiên (đổi mật khẩu + bật 2FA ở lần đăng nhập đầu)
  const adminPw = process.env.ADMIN_PASSWORD;
  if (!adminPw) throw new Error('Đặt biến ADMIN_PASSWORD (tối thiểu 10 ký tự, có chữ và số) trước khi chạy seed');
  await prisma.user.upsert({
    where: { username: 'admin' },
    create: { username: 'admin', fullName: 'Quản trị', role: 'MANAGER', passwordHash: await hash(adminPw) },
    update: {},
  });

  if (process.env.SEED_DEMO === '1') {
    const demoPw = await hash('Demo@12345');
    const staff: [string, string, Role, string][] = [
      ['bs.an', 'BS. Nguyễn Văn An', 'DOCTOR', 'BS'], ['bs.binh', 'BS. Trần Thị Bình', 'DOCTOR', 'BS'],
      ['tl.an', 'Lễ tân Lê Thu', 'RECEPTION', ''], ['tl.hoa', 'Lễ tân Phạm Hoa', 'RECEPTION', ''],
      ['sale.nam', 'Sale Hoàng Nam', 'SALE', ''], ['sale.lan', 'Sale Đỗ Lan', 'SALE', ''],
      ['kv.minh', 'KTV Vũ Minh', 'THERAPIST', 'KTV'], ['kv.huy', 'KTV Bùi Huy', 'THERAPIST', 'KTV'],
      ['ql.tam', 'Quản lý Ngô Tâm', 'MANAGER', ''],
    ];
    for (const [username, fullName, role, title] of staff)
      await prisma.user.upsert({ where: { username }, create: { username, fullName, role, title, passwordHash: demoPw, mustChangePassword: false }, update: {} });
  }
  console.log('Seed xong');
}
main().finally(() => prisma.$disconnect());
