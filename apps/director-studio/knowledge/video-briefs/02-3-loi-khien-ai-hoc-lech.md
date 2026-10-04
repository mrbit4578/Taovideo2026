---
brief_id: 02
series: nn-co-ban
doc_id: nn-knowledge-map-v1
section: 3
anchors: [02, 25, 04, 14]
audience: người mới học machine learning, sinh viên làm đồ án
duration: 60
risk_accuracy: low
hook_type: sai_lam
cta: Lưu video và theo dõi để xem phần tiếp theo của series Mạng nơ-ron cơ bản
continuity: Dùng lại ẩn dụ "nếm món ăn" của brief 01 khi nói về sai số
---
# Video brief 02 — 3 lỗi khiến AI học lệch mà người mới hay mắc

- **Góc mới (original-first):** dạng "checklist bác sĩ khám bệnh cho mô hình": 3 triệu chứng → 3 cách chữa. Không sao chép cấu trúc mục 3 của tài liệu nguồn.
- **Hook gợi ý (0–3s):** "Mô hình chạy rất tốt trên máy nhưng ra thực tế thì sai bét? Coi chừng 3 lỗi này."
- **Dàn ý cảnh:**
  1. Lỗi 1 — Rò rỉ dữ liệu: chuẩn hóa cả tập trước khi chia — minh họa: bàn tay xé đề thi mà đáp án đã in sẵn bên dưới
  2. Lỗi 2 — Overfitting: học vẹt dữ liệu train, không tổng quát hóa — minh họa: học sinh chép bài mẫu, gặp đề lạ thì đứng hình
  3. Lỗi 3 — Sai metric: chỉ nhìn accuracy trong khi cần precision/recall theo loại lỗi — minh họa: bác sĩ cầm hai tờ kết quả, chỉ vào ô bị bỏ sót
  4. Kết: trước khi tăng độ sâu mạng, kiểm tra nhãn → chia dữ liệu → đường cong → mẫu sai
- **Claim ledger:**
  - "Tiền xử lý học thống kê (chuẩn hóa) phải fit trên tập train" — `[02]` `[25]` — VERIFIED
  - "Phân loại cần precision/recall/F1, không chỉ accuracy" — `[02]` `[14]` — VERIFIED
  - "Kết quả tốt trên train chưa đủ để quyết định triển khai" — mục 3.5 — EDITORIAL
- **Rủi ro / gate:** không đưa ra lời khuyên đầu tư; con số "99%" (nếu dùng) phải nói rõ là "giả sử"; nội dung AI → gắn nhãn AI.
