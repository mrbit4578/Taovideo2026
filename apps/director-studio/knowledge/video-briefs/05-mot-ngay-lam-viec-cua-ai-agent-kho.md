---
brief_id: 05
series: ai-agent-doanh-nghiep
doc_id: nn-llm-agent-v1
section: 3
anchors: [07, 08]
audience: quản lý kho, chủ xưởng sản xuất
duration: 60
risk_accuracy: medium
hook_type: cau_chuyen
cta: Theo dõi để nhận phần tiếp theo của series AI Agent cho xưởng và kho
continuity: Dùng lại mã đơn DH001 của brief 04; quy trình là đề xuất, chưa kiểm thử thực tế
---
# Video brief 05 — Một ngày làm việc của AI Agent kho

- **Góc mới (original-first):** kể dạng nhật ký "8h00 agent nhận việc…": nhân hóa agent đi qua từng bước vòng lặp, mỗi lần tra cứu là một "chuyến đi". Sơ đồ mermaid của nguồn chỉ dùng để đối chiếu logic, không đưa lên hình.
- **Hook gợi ý (0–3s):** "8 giờ sáng, một nhân viên AI bắt đầu kiểm tra đơn hàng — và nó không cần ai chỉ từng bước."
- **Dàn ý cảnh:**
  1. Nhận yêu cầu: "kiểm tra đơn DH001, lập danh sách hàng thiếu" — minh họa: quản lý đặt phiếu yêu cầu lên bàn, đồng hồ treo tường chỉ 8 giờ
  2. Vòng lặp: tra đơn → tra tồn kho → thấy thiếu size A-38 → tự tra kế hoạch sản xuất — minh họa: nhân viên kho đi dọc kệ, dừng ở ô trống, lật bảng kế hoạch
  3. Cơ chế an toàn: giới hạn số bước, timeout, việc ghi dữ liệu phải có người duyệt — minh họa: bàn tay người ký duyệt lên phiếu trước khi đóng dấu
  4. Kết: báo cáo có nguồn tra cứu rõ ràng; phần "agentic" nằm ở việc tự chọn bước tiếp theo
- **Claim ledger:**
  - "Vòng lặp: LLM chọn bước → công cụ đọc/ghi → kết quả quay lại LLM" — mục 3.2 — EDITORIAL
  - "Guard bắt buộc: max_steps, timeout, cost budget" — mục 3.3 — EDITORIAL
  - "Mọi con số phải lấy từ công cụ, không để LLM tính nhẩm" — mục 2.2 — EDITORIAL
- **Rủi ro / gate:** quy trình đề xuất, chưa kiểm thử thực tế (theo phạm vi tài liệu nguồn) — lời đọc dùng "có thể", "đề xuất"; ví dụ DH001/A-38 là mô phỏng minh họa → ghi rõ trong caption; nội dung AI → gắn nhãn AI.
