# Life Atlas

Nguồn của trang Life Atlas (https://claude.ai/artifact/DMWe7b1PUb8X3tyChxJrXu).

Mã nguồn React gốc không còn, nên các nâng cấp được gắn vào bản đóng gói:

- `base.html` – bản đóng gói (Vite/React) trước đợt nâng cấp này.
- `addon.js` – mã bổ sung, chạy chung phạm vi module với bản đóng gói (dùng lại các hàm đã thu gọn như `iu`, `U5`, `P5`, `Vu`, `X`, `d0`...).
- `synth.js` – bộ máy luận giải tổng hợp (từng nhà và trang "Tổng hòa lá số").
- `feat2.js` – D3, trang Transit, Dự báo 2027 và nút Tải PDF (cần quyền `downloads`).
- `addon.css` – CSS bổ sung, bao gồm chỉnh giao diện mobile.
- `build.py` – nối `addon.*` vào `base.html` bằng các phép thay chuỗi có kiểm tra (mỗi chỗ thay phải xuất hiện đúng một lần) và ghi ra `index.html`.
- `index.html` – bản đã dựng, là bản được đăng.

Dựng lại: `cd life-atlas && python3 build.py`

Đợt nâng cấp này thêm:
- Lá số phụ D4 (Chaturthamsa, nhà cửa) và D7 (Saptamsa, con cái).
- Trang "Mười năm tới": dòng thời gian đại vận/tiểu vận, Sao Thổ, Sao Mộc, Rahu; các mốc tiểu vận; Sade Sati suốt đời.
- Trang "Hợp đôi": Ashtakoota (36 điểm) và Mangal Dosha, chọn từ lá số đã lưu hoặc nhập người mới.
- Lưu lá số trên máy (localStorage) và danh sách "Lá số đã lưu" ở trang đầu.
- Mobile: các nút đầu bài đọc xếp lưới 2 cột, vùng chạm lớn hơn ở thanh điều hướng.
