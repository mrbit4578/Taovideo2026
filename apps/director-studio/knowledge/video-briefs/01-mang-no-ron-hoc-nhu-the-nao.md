---
brief_id: 01
series: nn-co-ban
doc_id: nn-knowledge-map-v1
section: 2
anchors: [41, 42, 44]
audience: học sinh, sinh viên mới tiếp cận AI
duration: 60
risk_accuracy: low
hook_type: ket_qua
cta: Lưu video và theo dõi để xem phần tiếp theo của series Mạng nơ-ron cơ bản
continuity: Video mở series — các ẩn dụ "nếm món ăn / chỉnh gia vị" sẽ được dùng lại ở brief 02–03
---
# Video brief 01 — Mạng nơ-ron học như thế nào?

- **Góc mới (original-first):** không giảng công thức khô — kể bằng ẩn dụ "nếm món ăn, điều chỉnh gia vị": forward pass = nếm thử, loss = độ mặn lệch, backprop = tìm xem gia vị nào sai, optimizer = chỉnh lại. Toàn bộ ví dụ và lời dẫn tự viết.
- **Hook gợi ý (0–3s):** "Máy học giỏi lên sau mỗi lần sai — bí quyết nằm ở 4 bước này."
- **Dàn ý cảnh:**
  1. Nơ-ron nhận đầu vào, nhân trọng số, cộng bias, qua hàm kích hoạt — minh họa: bàn tay bật công tắc, bóng đèn sáng khi đủ ngưỡng
  2. Vòng lặp 4 bước: dự đoán → đo sai số → lan truyền ngược → cập nhật — minh họa: người nấu nếm thử rồi thêm gia vị
  3. Điểm dễ nhầm: backprop chỉ tính gradient, optimizer mới là người cập nhật — minh họa: hai người, một người đo, một người chỉnh
  4. Kết: càng nhiều dữ liệu đúng, mạng càng bớt sai
- **Claim ledger:**
  - "Backpropagation tính gradient; optimizer cập nhật tham số" — `[42]` `[44]` — VERIFIED
  - "Phi tuyến giúp mạng biểu diễn quan hệ mà biến đổi tuyến tính không làm được" — `[41]` — VERIFIED
- **Rủi ro / gate:** kiến thức phổ thông, có nguồn; không claim y tế/tài chính; nội dung AI → gắn nhãn AI khi đăng.
