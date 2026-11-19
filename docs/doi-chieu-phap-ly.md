# Bảng đối chiếu chức năng ↔ yêu cầu bảo mật / pháp lý (để người có chuyên môn thẩm định)

> **Không phải ý kiến pháp lý.** Đây là danh sách *những gì hệ thống đang làm* theo từng nhóm yêu cầu thường gặp đối với bệnh án điện tử và dữ liệu cá nhân. Điều khoản cụ thể của **Thông tư 13/2025/TT-BYT** và **Luật Bảo vệ dữ liệu cá nhân 2025** (thời hạn lưu trữ, hình thức ký số, mẫu biểu bắt buộc, thủ tục thông báo/đánh giá tác động xử lý dữ liệu nhạy cảm…) cần luật sư hoặc Sở Y tế đối chiếu trước khi phòng khám ngừng dùng bệnh án giấy.

| Nhóm yêu cầu | Hệ thống hiện có | Còn thiếu / cần xác nhận |
|---|---|---|
| Định danh người dùng | Tài khoản riêng từng nhân viên, mật khẩu băm argon2id, ≥10 ký tự; khóa tạm sau 5 lần sai; tự đăng xuất sau 30 phút không dùng | Chính sách đổi mật khẩu định kỳ (nếu yêu cầu) |
| Xác thực 2 lớp | Bắt buộc với bác sĩ và quản lý; tùy chọn các vai trò khác (mã TOTP, khóa lưu dạng mã hóa AES-256-GCM) | Có muốn bắt buộc cho mọi vai trò không |
| Phân quyền theo vai trò | 5 vai trò; sale không xem bệnh án; lễ tân chỉ xem tiến độ liệu trình và đơn thuốc để bán; KTV chỉ xem/ghi liệu trình được giao | Rà soát lại cùng quản lý |
| Nhật ký truy cập | Ghi đăng nhập/thất bại, xem hồ sơ, tạo/sửa, ký, điều chỉnh, hủy phiếu, kho, nhắc lịch (ai, lúc nào, IP) | Thời hạn lưu nhật ký; chức năng lọc/xuất nhật ký nâng cao |
| Toàn vẹn bệnh án | Phiếu khám ký xong bị khóa; sửa = bản điều chỉnh có lý do, bản gốc giữ nguyên; buổi điều trị chỉ sửa trong ngày; không xóa cứng dữ liệu y tế/thu ngân | Hình thức **ký số** (chữ ký số chuyên dùng/ký từ xa) nếu cơ quan quản lý yêu cầu; hiện ký = tài khoản + 2FA + dấu thời gian |
| Đồng ý của bệnh nhân | Ghi nhận đồng ý xử lý dữ liệu khi tạo hồ sơ (phiên bản nội dung, thời điểm, người ghi, hình thức) | **Văn bản đồng ý chính thức** do phòng khám/luật sư soạn; chức năng rút lại đồng ý, yêu cầu xóa/trích xuất dữ liệu của bệnh nhân |
| Mã hóa khi truyền | HTTPS (Cloudflare Tunnel / TLS), cookie httpOnly + SameSite=Strict | Cấu hình HTTPS cho truy cập trong mạng nội bộ (nếu cần) |
| Mã hóa khi lưu | Sao lưu mã hóa AES-256 trước khi rời máy; mã 2FA mã hóa trong CSDL | **Mã hóa ổ đĩa mini PC (LUKS)** – làm khi cài máy; mã hóa các cột dữ liệu y tế nếu yêu cầu |
| Sao lưu & khôi phục | Hằng đêm, giữ 60 ngày, đẩy Google Drive, kiểm tra giải mã, cảnh báo khi lỗi, hướng dẫn khôi phục | Thử thực tế trên máy thật; thời hạn lưu trữ bệnh án theo quy định |
| Liên thông (FHIR) | Mô hình dữ liệu có các thực thể tương ứng (Patient, Encounter, Condition, ServiceRequest, MedicationRequest…) | Chưa có xuất/nhập FHIR hay kết nối cổng liên thông |
| BHYT | Chưa nhận; chưa có trường thẻ BHYT/mã KCB | Bổ sung khi phòng khám đăng ký BHYT |
| Dữ liệu nhạy cảm | Truy cập tối thiểu theo vai trò; nhắc lịch qua Zalo/điện thoại do nhân viên gửi tay, nội dung tin không có chẩn đoán | Quy trình xử lý sự cố lộ dữ liệu, thông báo vi phạm; hợp đồng với bên xử lý (Cloudflare, Google) |
