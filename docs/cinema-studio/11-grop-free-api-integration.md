# Grop.rar → API miễn phí của Director Studio

Ngày đối chiếu: 04/10/2026. Archive là mã nguồn tham khảo; các câu “FREE”, “đã test” bên trong không phải bằng chứng về tài khoản hiện tại.

## Đã đọc và chuyển vào dự án

Gói có 9 tệp: `ai.providers.ts`, `ai.service.ts`, `videogen.service.ts`, `agent-loop.ts`, `agent-loop.test.ts`, hai DTO, `types.ts` và `page.tsx`. Đây là các mảnh của ứng dụng NestJS/Prisma/Next, chưa có đầy đủ dependency để chạy độc lập.

| Phần từ Grop | Điểm đấu nối đang chạy |
|---|---|
| Provider metadata và link tạo key | `apps/director-studio/shared/providers.json`, màn hình API & chi phí |
| Chat Gemini, Claude, OpenAI-compatible | `server/providers.mjs`; OpenAI chính thức dùng Responses |
| Key của người dùng, không xuất key vào dữ liệu dự án | `providerClient.ts`: key trong bộ nhớ phiên; key server qua biến môi trường |
| Tạo kịch bản/prompt | Tiền kỳ và Workflow cùng gọi `directorJson`/API studio |
| Job video | Google Veo qua start/poll/download riêng, phù hợp Vercel |
| Usage và lỗi provider | Trả usage; lỗi được làm sạch, dừng khi hết quota |

Không chuyển nguyên cơ chế fallback sang key khác, lời gọi trả phí để kiểm tra key, key trong query string hoặc vòng lặp job chạy nền trong bộ nhớ server. Agent tool loop, embedding và kho key mã hóa trong Prisma vẫn là nguồn tham khảo; ứng dụng hiện chưa có database/tenant/tool registry tương ứng.

## Bắt đầu với free tier

1. Trên Vercel, đặt `STUDIO_ACCESS_TOKEN` thành mật khẩu riêng đủ dài, rồi deploy từ root repository.
2. Mở **API & chi phí**. Chọn Google, Groq hoặc APMIX; dùng liên kết **Tạo API key** để lấy key trong tài khoản chính chủ.
3. Nhập mật khẩu studio và API key. Có thể đặt `GOOGLE_API_KEY`, `GROQ_API_KEY`, `APMIX_API_KEY` trên server thay cho nhập key mỗi phiên.
4. Bấm **Đọc model từ API**, chọn model được phép trong tài khoản. Model xuất hiện trong danh sách không tự chứng minh miễn phí.
5. Xác nhận tài khoản đang dùng free tier, để tắt **Cho phép dùng credit / trả phí**. Sau đó dùng AI viết prompt/kịch bản.

Groq có free quota cho các model văn bản trong [bảng giới hạn chính thức](https://console.groq.com/docs/rate-limits). APMIX hiện liệt kê `anthropic/claude-sonnet-4-6-free` trong [danh mục Free](https://apmix.ai/models); không sao chép hai model free cũ trong archive thành mặc định. Gemini văn bản có [free tier theo model](https://ai.google.dev/gemini-api/docs/pricing).

Experiential Labs đã nối endpoint OpenAI-compatible theo [tài liệu chính thức](https://platform.experientiallabs.ai/docs). Đặt key ở `EXPERIENTIAL_API_KEY` (tên biến trong ứng dụng này, khác `EXPLABS_API_KEY` trong ví dụ Grop). Khi tài khoản thực tế xác nhận model miễn phí, chủ web khai báo đúng ID trong `EXPERIENTIAL_FREE_MODELS`, phân tách bằng dấu phẩy. Chưa có bằng chứng để tự gắn nhãn miễn phí cho `gpt-5.6-luna` từ lời chú thích của archive.

`APMIX_FREE_MODELS` có thể thay danh sách mặc định khi quyền tài khoản thay đổi. API khác dùng `CUSTOM_API_BASE_URL`, `CUSTOM_API_KEY`, `CUSTOM_FREE_MODELS` trên server. Không đưa secret vào biến có tiền tố `VITE_`.

## Phân biệt viết nội dung và sinh footage

Free tier ở trên phục vụ văn bản. Veo tạo footage cần bật quyền dùng credit/trả phí; không có lời hứa tạo phim miễn phí từ một key chat. Người dùng vẫn có thể nhập clip có sẵn, QC, chọn take và dựng WebM trong trình duyệt mà không gọi API sinh video.

Các adapter đã có kiểm tra mock về hợp đồng API, cost gate, quota và không chuyển nhà cung cấp. Chưa thực hiện lời gọi sinh nội dung bằng key thật của người dùng; quyền truy cập/quota cần kiểm chứng sau khi nhập key.
