---
brief_id: 03
series: nn-co-ban
doc_id: nn-knowledge-map-v1
section: 4
anchors: [14, 15, 30, 04]
audience: người tò mò về AI, học sinh/sinh viên
duration: 60
risk_accuracy: low
hook_type: cau_hoi
cta: Lưu video và theo dõi để xem phần tiếp theo của series Mạng nơ-ron cơ bản
continuity: Mốc năm đã dùng ở video trước — 2012 AlexNet, 2017 Transformer — phải giữ nguyên nếu nhắc lại
---
# Video brief 03 — CNN, RNN, Transformer khác nhau thế nào trong 60 giây

- **Góc mới (original-first):** mỗi kiến trúc là một "giác quan": CNN = mắt nhìn ảnh (quét từng vùng), RNN = trí nhớ kể chuyện (nhớ câu trước), Transformer = sự chú ý khi đọc (soi cả đoạn văn cùng lúc). Ẩn dụ và lời dẫn tự viết.
- **Hook gợi ý (0–3s):** "Cùng là mạng nơ-ron, sao cái thì nhìn ảnh, cái thì nói chuyện được?"
- **Dàn ý cảnh:**
  1. CNN: bộ lọc trượt trên ảnh, bắt cấu trúc cục bộ — minh họa: bàn tay rê kính lúp trên tấm ảnh in
  2. RNN/LSTM: giữ trạng thái qua từng bước thời gian — minh họa: người kể chuyện lật từng trang sổ tay
  3. Transformer: attention nhìn toàn bộ đầu vào cùng lúc — minh họa: người đọc trải cả trang báo, đánh dấu nhiều chỗ cùng lúc
  4. Kết: chọn kiến trúc theo dữ liệu (ảnh/văn bản/chuỗi), và luôn thử nghiệm trước khi kết luận
- **Claim ledger:**
  - "CNN dùng bộ lọc chia sẻ trên các vị trí, khai thác cấu trúc cục bộ" — `[14]` — VERIFIED
  - "Transformer ghép attention, feedforward và thông tin vị trí" — `[30]` — VERIFIED
  - "LSTM/GRU dùng các cổng để điều tiết thông tin" — `[04]` `[15]` — VERIFIED
  - "Transformer là nền tảng của ChatGPT" — `[30]` — VERIFIED
- **Rủi ro / gate:** kiến thức phổ thông, có nguồn; nội dung AI → gắn nhãn AI khi đăng.
