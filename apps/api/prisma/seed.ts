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

// Mẫu tin nhắn mặc định. Nội dung lưu ý chăm sóc cần BÁC SĨ duyệt trước khi dùng.
const TEMPLATES: [string, string, string][] = [
  ['appt_tomorrow', 'Nhắc lịch hẹn', 'Chào {ten}, {phongkham} nhắc lịch hẹn của anh/chị vào {gio} ngày {ngay}. Nếu cần đổi lịch, anh/chị vui lòng nhắn lại giúp phòng khám. Xin cảm ơn!'],
  ['no_show', 'Khách chưa đến theo lịch', 'Chào {ten}, phòng khám chưa thấy anh/chị đến theo lịch hẹn {gio} ngày {ngay}. Anh/chị có cần sắp xếp lại lịch không ạ?'],
  ['next_session', 'Nhắc buổi điều trị tiếp theo', 'Chào {ten}, anh/chị đã hoàn thành {da_dung}/{tong} buổi trong liệu trình. Phòng khám nhắc anh/chị sắp xếp buổi tiếp theo để đạt hiệu quả tốt nhất. Anh/chị tiện đến vào ngày nào ạ?'],
  ['lost', 'Khách lâu chưa quay lại', 'Chào {ten}, đã {so_ngay} ngày phòng khám chưa gặp lại anh/chị, liệu trình còn {con_lai} buổi. Anh/chị có gặp khó khăn khi sắp xếp lịch không ạ? Phòng khám sẵn sàng hỗ trợ.'],
  ['lead', 'Liên hệ lại khách mới', 'Chào {ten}, {phongkham} xin phép liên hệ lại về lịch khám anh/chị quan tâm. Anh/chị tiện đến phòng khám vào thời gian nào ạ?'],
  ['aftercare_general', 'Lưu ý sau điều trị (chung)', 'Chào {ten}, cảm ơn anh/chị đã điều trị hôm nay (buổi {da_dung}/{tong}). Sau điều trị anh/chị nên uống đủ nước, nghỉ ngơi hợp lý, tránh vận động mạnh hoặc mang vác nặng trong 24 giờ. {luu_y_dich_vu}Nếu có dấu hiệu bất thường (đau tăng nhiều, sưng nóng đỏ, tê yếu, chóng mặt, khó thở), vui lòng liên hệ phòng khám ngay.'],
  ['aftercare_CC', 'Lưu ý sau châm cứu', 'Sau châm cứu: giữ vùng châm sạch, khô trong vài giờ; tránh tắm nước lạnh và gió lùa. '],
  ['aftercare_DDK', 'Lưu ý sau nắn chỉnh / di động khớp', 'Sau nắn chỉnh/di động khớp: có thể mỏi nhẹ trong 1–2 ngày, tránh xoay vặn mạnh vùng vừa điều trị. '],
  ['aftercare_TLMM', 'Lưu ý sau trị liệu cơ – mô mềm', 'Sau trị liệu cơ–mô mềm: vùng điều trị có thể ê nhẹ trong 1–2 ngày. '],
  ['aftercare_XK', 'Lưu ý sau sóng xung kích', 'Sau sóng xung kích: vùng điều trị có thể ê nhẹ trong 1–2 ngày. '],
];

async function main() {
  for (const [key, title, body] of TEMPLATES) await prisma.messageTemplate.upsert({ where: { key }, create: { key, title, body }, update: {} });
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
  if (process.env.SEED_DEMO === '1') {
    // DỮ LIỆU MẪU – quản lý cần thay bằng danh mục thật của phòng khám
    for (const [code, name, unit, price, cost] of [['MAU01', 'Cao dán giảm đau (mẫu)', 'hộp', 85000, 55000], ['MAU02', 'Dầu xoa bóp (mẫu)', 'lọ', 65000, 40000], ['MAU03', 'Viên hoàn hỗ trợ xương khớp (mẫu)', 'hộp', 220000, 150000]] as [string, string, string, number, number][]) {
      const p = await prisma.product.upsert({ where: { code }, create: { code, name, unit, price, costPrice: cost, minStock: 5 }, update: {} });
      if (!(await prisma.stockMovement.count({ where: { productId: p.id } })))
        await prisma.stockMovement.create({ data: { productId: p.id, qty: 20, type: 'IN', unitCost: cost, lot: 'MAU', expiryDate: new Date(Date.now() + 700 * 86400000), note: 'Tồn mẫu', byId: 'seed' } });
    }
    if (!(await prisma.packageTemplate.count()))
      await prisma.packageTemplate.createMany({ data: [
        { name: 'Gói 10 buổi Combo Cơ bản (mẫu)', sessions: 10, price: 4500000, validDays: 120, sample: true },
        { name: 'Gói 10 buổi Combo Tiêu chuẩn (mẫu)', sessions: 10, price: 7200000, validDays: 120, sample: true },
        { name: 'Gói 20 buổi Combo Tiêu chuẩn (mẫu)', sessions: 20, price: 13600000, validDays: 240, sample: true },
      ] });
  }
  console.log('Seed xong');
}
main().finally(() => prisma.$disconnect());
