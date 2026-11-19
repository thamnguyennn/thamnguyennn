# Hướng dẫn cài đặt trên mini PC (từng bước)

> Dành cho người không phải lập trình viên. Làm theo thứ tự. Phần ⚠️ là bắt buộc.
> **Lưu ý trung thực:** các bước Docker / Cloudflare / Google Drive dưới đây chưa được thử trên máy thật của phòng khám (môi trường phát triển không có Docker). Lần cài đầu nên có người kỹ thuật ngồi cùng; mọi lỗi gặp phải hãy gửi lại để tôi chỉnh.

## 0. Chuẩn bị phần cứng
- Mini PC ≥ 16 GB RAM, SSD ≥ 512 GB, cài **Ubuntu Server 24.04 LTS**. Bật tùy chọn *tự khởi động lại khi có điện* trong BIOS.
- ⚠️ **Bộ lưu điện UPS** (≥ 650VA). Cắm mini PC và modem/switch vào UPS.
- Mini PC cắm dây mạng LAN, đặt **IP tĩnh** (hoặc giữ IP cố định trong router).

## 1. Cài Docker
```bash
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker $USER   # đăng xuất rồi đăng nhập lại
```

## 2. Lấy mã nguồn và tạo cấu hình
```bash
git clone <địa-chỉ-kho-mã> emr && cd emr
cp .env.example .env
```
Mở `.env` (`nano .env`) và điền các mật khẩu bằng lệnh `openssl rand -hex 32` cho từng dòng.
⚠️ **Cất bản sao `DATA_KEY` và `BACKUP_PASSPHRASE` ở nơi an toàn ngoài mini PC** (két sắt/trình quản lý mật khẩu). Mất `BACKUP_PASSPHRASE` = không mở được bản sao lưu.

## 3. Khởi động
```bash
docker compose up -d --build
docker compose exec -e ADMIN_PASSWORD="MatKhauTam12345" api npx ts-node prisma/seed.ts   # tạo tài khoản admin + nguồn khách (đổi mật khẩu ngay khi đăng nhập)
```
Mở trình duyệt trong mạng phòng khám: `http://<IP-mini-PC>` → đăng nhập `admin` → đổi mật khẩu → quét mã QR 2FA bằng Google Authenticator.
Sau đó vào **Nhân viên** để tạo tài khoản cho từng người (mật khẩu tạm, họ tự đổi ở lần đầu).

## 4. Truy cập từ xa bằng Cloudflare Tunnel (không mở cổng router)
1. Cần 1 tên miền quản lý trên Cloudflare (miễn phí gói Free).
2. Cloudflare Zero Trust → Networks → Tunnels → *Create tunnel* → chọn Docker → copy **token** vào `CLOUDFLARE_TUNNEL_TOKEN` trong `.env`.
3. Public hostname: `emr.<tên-miền>` → Service `http://proxy:80`.
4. (Khuyến nghị) Zero Trust → Access → thêm chính sách chỉ cho email nhân viên được vào trang.
5. `docker compose --profile remote up -d`

## 5. Sao lưu hằng đêm lên Google Drive
1. Trên máy có trình duyệt: cài rclone, chạy `rclone config` → tạo remote tên `gdrive` (loại *drive*), đăng nhập tài khoản Google của phòng khám.
2. Chép file `rclone.conf` (thường ở `~/.config/rclone/`) vào thư mục `infra/rclone/` trên mini PC.
3. Tạo 1 check ở **healthchecks.io** (miễn phí): chu kỳ 1 ngày, grace 6 giờ, thêm email nhận cảnh báo → copy URL ping vào `HEALTHCHECK_BACKUP_URL`. Nếu mini PC **tắt hẳn hoặc mất mạng**, không có ping → họ gửi email cho bạn.
4. Chạy thử ngay: `docker compose exec backup backup.sh` → thấy "Sao lưu OK" và có file trong thư mục Drive.
Bản sao lưu: nén + mã hóa AES-256 trước khi rời máy, giữ 60 ngày (đổi bằng `KEEP_DAYS`).

## 6. Khôi phục (khi hỏng máy / cần quay lại)
1. Cài máy mới theo bước 1–3 (dùng **cùng** `DATA_KEY` và `BACKUP_PASSPHRASE`).
2. Tải file `emr-….sql.gz.enc` mới nhất từ Google Drive vào thư mục `backups/`.
3. ```bash
   docker compose exec backup restore.sh /backups/emr-YYYYMMDD-HHMMSS.sql.gz.enc
   docker compose restart api
   ```
⚠️ **Mỗi tháng thử khôi phục một lần** trên máy khác/CSDL tạm để chắc chắn bản sao lưu dùng được.

## 7. Cập nhật phần mềm
```bash
git pull && docker compose up -d --build
```
(Cơ sở dữ liệu tự cập nhật cấu trúc khi API khởi động.)

## Giám sát
- Địa chỉ `/api/health` trả `{"ok":true}` khi API + CSDL sống → thêm vào **UptimeRobot/healthchecks.io** (qua tên miền Cloudflare) để được báo khi hệ thống ngừng.
