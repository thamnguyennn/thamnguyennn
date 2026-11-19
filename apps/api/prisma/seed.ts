import { PrismaClient, Role } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();
const hash = (p: string) => argon2.hash(p, { type: argon2.argon2id });

async function main() {
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
