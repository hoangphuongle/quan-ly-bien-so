# Quản lý Tiền chi tiết từng giai đoạn & Tình trạng Thiếu/Đủ

Dựa trên yêu cầu của bạn, hệ thống cần theo dõi chi tiết số tiền chi ra ở từng bước (Thuế, Biển số, Công an) thay vì gộp chung một cục, đồng thời hiển thị tổng và trạng thái ứng tiền (còn thiếu hay đã nhận đủ).

## Proposed Changes

### 1. Phân rã "Chi phí đi đóng"
Thay vì chỉ nhập một cục "Chi phí đi đóng", form cập nhật sẽ được chia làm 3 ô tiền tương ứng với 3 ngày:
- Tiền nộp Thuế
- Tiền nộp phí Biển
- Tiền nộp phí Công An
(Phần mềm vẫn tự động điền sẵn các con số chuẩn 340k, 105k, 100k tuỳ loại xe, bạn có thể sửa nếu cần).

### 2. Cập nhật Bảng Tiến độ chi tiết
Thêm các cột mới vào bảng để hiển thị một cái nhìn toàn cảnh giống như file Excel của bạn:
- **Nộp Thuế:** [Ngày] - [Số tiền]
- **Phí Biển:** [Ngày] - [Số tiền]
- **Phí CA:** [Ngày] - [Số tiền]
- **Tổng Chi:** [Tổng 3 khoản trên]
- **Công Nợ (Thiếu/Đủ):** Hiển thị rõ số tiền cửa hàng còn nợ Nhân viên cho riêng bộ hồ sơ này (Màu đỏ = Còn thiếu, Màu xanh = Đã thanh toán đủ).

### 3. Đồng bộ Tiền Ứng tự động
Tiền Nhân viên ứng sẽ được tự động cộng dồn lên Quỹ nợ một cách chính xác tuyệt đối ngay khi bạn điền **Ngày nộp** của khoản đó. Không cần phải chờ kéo Kanban nữa. Nếu bạn điền Ngày nộp thuế, hệ thống ghi nhận bạn đã ứng tiền thuế.

> [!IMPORTANT]
> **Câu hỏi mở cho bạn:** 
> Về phần "Thiếu Đủ", ý bạn là **Cửa hàng còn Thiếu hay Đủ tiền ứng của Nhân viên**, hay là **Khách hàng còn Thiếu/Đủ tiền thanh toán cho cửa hàng**? (Theo mạch câu chuyện nãy giờ, mình đang hiểu là Cửa hàng thanh toán tiền ứng cho nhân viên). Bạn xác nhận giúp mình nhé!

## Verification Plan
- Sửa form nhập liệu trong HTML.
- Sửa logic tính toán trong app.js để lưu 3 khoản tiền riêng biệt.
- Cập nhật hàm vẽ Bảng chi tiết để hiển thị màu sắc rõ ràng (Thiếu/Đủ).
