# EMR – Phòng khám Y học cổ truyền Khởi Phúc Việt Movia

Hồ sơ bệnh án điện tử (web app) cho phòng khám. Xem [`thiet-ke-de-xuat.md`](thiet-ke-de-xuat.md) (thiết kế + trạng thái) và [`cai-dat.md`](cai-dat.md) (cài đặt trên mini PC, sao lưu, khôi phục).

Mẫu gốc của phòng khám: [`mau-goc/`](mau-goc/).

## Chạy thử trên máy lập trình
```bash
npm install
cp apps/api/.env.example apps/api/.env      # chỉnh DATABASE_URL, APP_SECRET, DATA_KEY
cd apps/api && npx prisma migrate dev && ADMIN_PASSWORD='MatKhau12345' SEED_DEMO=1 npx ts-node prisma/seed.ts
npm run dev:api     # http://localhost:4000
npm run dev:web     # http://localhost:3000   (đăng nhập demo: tl.an / Demo@12345)
npm test            # kiểm thử API
```
