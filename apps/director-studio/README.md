# Director Studio — Cinema Lab 0.3

Đã đấu nối Director v2, sáu brief tri thức, workflow Trang 9, API đa mô hình, Veo take, IndexedDB/QC và dựng browser. Deploy từ root repository theo [hướng dẫn mới nhất](../../README.md). Phần dưới lưu quy trình tiền kỳ; chưa có cloud sync hoặc worker render dài.

## Mở ứng dụng

Chạy PowerShell tại thư mục này:

```powershell
npm.cmd ci --ignore-scripts
npm.cmd run dev -- --host 127.0.0.1 --port 5174 --strictPort
```

Mở http://127.0.0.1:5174/. Nếu đã cài dependencies thì chỉ cần lệnh thứ hai, hoặc chạy `start-local.cmd`. Đóng terminal sẽ dừng server. Dùng cùng địa chỉ/cổng và cùng trình duyệt để thấy dữ liệu đã lưu.

1. Chọn **Nhập brief tri thức (.md)**.
2. Chọn một brief hoặc một trong hai series có sẵn. Để trống ghi đè series để giữ tên của từng brief.
3. Kiểm tra nội dung phân tích, thời lượng, claim và cảnh; chọn tạo dự án.
4. Hoàn thiện casting, subject/environment/prop/action, lời đọc, caption và review.
5. Xuất production pack Markdown, `labels.ass`, `subs.ass`, `build.sh` để bàn giao. Script Bash cần FFmpeg và asset thật; app không tự chạy script.

Chế độ local lưu trong `localStorage`, khóa `cinema-director-studio:v2`; không gửi dữ liệu đến Convex. **Sao lưu dự án JSON** xuất bản sao dữ liệu. Chưa có giao diện khôi phục JSON; xóa dữ liệu trình duyệt sẽ xóa bản lưu local. Dữ liệu local không tự đồng bộ sang Type. Root dự án hiện có package.json và lệnh build trỏ đúng app này.

## Cấu trúc đã đấu nối

| Thành phần | Vai trò |
|---|---|
| `src/App.tsx` | Chín bước nghiệp vụ: brief, claims, hook, casting, cảnh, prompt, lời đọc/sub, caption, QC |
| `src/knowledgeLibrary.ts` | Nạp sáu brief v2 vào giao diện nhập |
| `shared/production.ts` | Parser v1/v2, chia cảnh, prompt, lint, ASS, pack và script FFmpeg |
| `shared/studioService.ts` | Domain handler và validator dùng chung local/Convex |
| `shared/localStore.ts` + `src/studioClient.ts` | Database local, transaction, subscription và lưu trình duyệt |
| `shared/evidence.ts` | Danh mục nguồn còn thiếu; kiểm soát claim VERIFIED theo bằng chứng đã duyệt |
| `convex/schema.ts` | `projects`, `scenes`, `briefs` và bảng nền tảng |
| `convex/app.ts` | Endpoint Type có kiểm tra capability, gọi cùng domain handler |
| `knowledge/` | Brief v2 và template; nguyên bản được bảo toàn |
| `knowledge-legacy/` | Sáu brief cũ để truy vết và kiểm tra parser |
| `reference/` | Skill và audit gốc, chỉ dùng như tài liệu tham khảo |
| `scripts/integration-tests.mjs` | Kiểm tra luồng nhập → lưu → sửa → xuất và các hồi quy |

Scaffold React/Vite/Convex được lấy từ TikTok Video Maker; mã nghiệp vụ lấy từ Director v2. Không sao chép endpoint dev, release hay `.type` deployment của app cũ. `typeAuth.tsx` và wrapper backend vẫn giữ cơ chế xác thực nền tảng. `auth.config.ts` chứa application ID chưa cấu hình, cần host Type provision lại trước khi deploy. Bản local không giả session để gọi backend.

## Tri thức và bằng chứng

`mang noron.rar` có tám file trùng byte với thư mục `mang noron` trước đó. Sáu brief v2 có thêm series, CTA, continuity, cảnh minh họa bằng hành động và duration 90s cho brief 06.

Chưa có `ban-do-kien-thuc-mang-no-ron-ai.md`, `ung-dung-mang-no-ron-llm-ai-agent.md` và `sources-index.json`. Vì vậy, nhãn VERIFIED trong brief là trạng thái do tài liệu khai báo, không phải bằng chứng đã kiểm tra. Parser hạ claim chưa có bằng chứng về UNVERIFIED, giữ nguyên raw; backend từ chối nâng trạng thái thiếu bằng chứng. EDITORIAL là ý kiến biên soạn, không phải sự thật đã xác minh. AI đối chiếu chỉ cho biết câu khớp ledger, không xác minh nguồn.

## Kiểm tra và giới hạn

```powershell
npm.cmd test
npm.cmd run build
```

Đã đạt 10 nhóm kiểm tra tích hợp và build TypeScript/Vite. Browser đã tạo sáu dự án, kiểm tra brief 90s, claim gate và lưu sau reload. Kiểm tra FFmpeg dissolve ở 24fps dùng hai clip màu tổng hai giây, xác nhận 48 frame. Chưa render toàn bộ production pack bằng footage thật.

Local là workspace đơn máy, không có tài khoản/ACL. Backend Type chưa được triển khai hay kiểm thử trực tiếp và vẫn cần ACL theo workspace/project trước khi dùng cho nhiều khách hàng. Series nhập từng dự án tuần tự, không phải transaction cho cả batch; nếu lỗi giữa batch cần đối chiếu các dự án đã tạo trước khi thử lại. Hạn mức 12 cảnh của Director giữ cho planning social; phim nhiều cảnh cần model Episode → Scene → Shot → Take → Asset trong thiết kế Cinema Studio.

Bản 0.3 đã có API text/Veo, kho take, QC và dựng preview browser. Worker cloud, forced alignment, sound design nhiều track, color pipeline, budget/idempotency đầy đủ và screening pilot vẫn thuộc giai đoạn tiếp theo. “Hollywood” là mục tiêu chất lượng cần kiểm chứng bằng phim.

Báo cáo chi tiết: [09-v2-integration-and-kaizen.md](../../docs/cinema-studio/09-v2-integration-and-kaizen.md).
# Bản web 0.3: Workflow điện ảnh & API

Hướng dẫn deploy mới nhất nằm ở [README root](../../README.md) và [audit workflow](../../docs/cinema-studio/10-workflow-api-vercel.md). App hiện có ba không gian: Tiền kỳ, Workflow điện ảnh, API & chi phí. Deploy Vercel từ **root repository**, vì `api/studio.mjs` nằm ngoài app này.

Các đoạn ở trên ghi lại nền tiền kỳ v2; bản 0.3 bổ sung adapter và dựng browser. Chưa có đồng bộ cloud hay worker FFmpeg.

