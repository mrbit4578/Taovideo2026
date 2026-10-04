---
brief_id: 06
series: ai-agent-doanh-nghiep
doc_id: nn-llm-agent-v1
section: 4
anchors: [16, 11]
audience: người đang dựng thử agent (n8n/LangGraph), kỹ thuật viên
duration: 90
risk_accuracy: low
hook_type: sai_lam
cta: Theo dõi để nhận phần tiếp theo của series AI Agent cho xưởng và kho
continuity: Cụm công cụ kho get_order / get_available_stock đã xuất hiện ở brief 05 — giữ đúng tên
---
# Video brief 06 — 5 nguyên tắc khi giao việc cho AI Agent

- **Góc mới (original-first):** dạng "5 điều sếp dặn trước khi giao việc cho nhân viên mới" — mỗi nguyên tắc là một lời dặn ngắn, có ví dụ mini từ cụm công cụ kho (`get_order`, `get_available_stock`). Thời lượng 90s vì có 5 ý (A4); bản 60s = gộp còn 3 ý đầu + "phần 2".
- **Hook gợi ý (0–3s):** "Agent của bạn làm sai? Phần lớn là do bạn giao việc chưa rõ — 5 nguyên tắc này sửa được."
- **Dàn ý cảnh:**
  1. Đặt tên công cụ rõ nghĩa, động từ đầu (`get_order`, không đặt `xử_lý_1`) — minh họa: sếp dán nhãn tên lên từng hộp dụng cụ
  2. Viết schema tham số chặt + mô tả khi nào dùng — minh họa: bàn tay điền phiếu yêu cầu có ô bắt buộc
  3. Lỗi trả về có cấu trúc để agent tự phục hồi — minh họa: nhân viên đưa lại phiếu có ghi rõ lý do từ chối
  4. Tách công cụ đọc (tự do) và ghi (phải qua kiểm tra/quyền) — minh họa: hai cánh cửa, một mở, một có ổ khóa
  5. Việc quan trọng (gửi khách hàng, đổi dữ liệu) bắt buộc người duyệt — minh họa: sếp ký duyệt trước khi phong bì được gửi
  6. Kết: công cụ tốt = agent ít sai + ít tốn tiền gọi tool
- **Claim ledger:**
  - "6 nguyên tắc thiết kế tool theo Anthropic (brief rút gọn còn 5 ý chính)" — `[16]` — VERIFIED
  - "Công cụ ghi phải idempotent" — mục 4.1 — EDITORIAL
  - "n8n có cơ chế human-in-the-loop cho tool" — `[11]` — VERIFIED
- **Rủi ro / gate:** không hướng dẫn chi tiết cấu hình bảo mật production (khóa API, secret manager) — chỉ ở mức nguyên tắc; không dùng số liệu "90%" chưa có nguồn; nội dung AI → gắn nhãn AI.
