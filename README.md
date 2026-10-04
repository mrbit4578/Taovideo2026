# Taovideo2026 — Director Studio / Cinema Lab

Web tiếng Việt để làm tiền kỳ, nhập workflow điện ảnh, nối API của nhiều mô hình, tạo take video, duyệt QC và dựng phim từ footage thật.

Ứng dụng chính: **`apps/director-studio`**. Những file skill, ZIP/RAR và thư mục `Grop/` là nguồn tri thức/tham khảo; không phải các app được deploy cùng lúc. README của bộ skill gốc được lưu nguyên văn tại `docs/cinema-studio/original-skillpack-README.md`.

## Chạy local

```powershell
npm --prefix apps/director-studio ci
npm run dev
```

Mở http://127.0.0.1:5174. Node.js 22 LTS là phiên bản cấu hình cho Vercel; bản local cũng đã build trên Node 24.

```powershell
npm test
npm run build
```

## Deploy Vercel

1. Import repository **mrbit4578/Taovideo2026**, Production Branch `main`, Root Directory để trống hoặc `.`.
2. `vercel.json` đã khai báo install/build/output. Không đặt Root Directory thành `apps/director-studio`, vì API server nằm ở `api/` tại root.
3. Trong Environment Variables đặt **`STUDIO_ACCESS_TOKEN`** bằng mật khẩu ngẫu nhiên dài do bạn giữ riêng. Đây là mật khẩu mở API của studio.
4. Tuỳ chọn đặt `GOOGLE_API_KEY`, `GROQ_API_KEY`, `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `APMIX_API_KEY`, `EXPERIENTIAL_API_KEY`. Hoặc nhập BYOK trong tab **API & chi phí** sau deploy; key nhập chỉ ở bộ nhớ phiên.
5. Deploy/redeploy sau khi đổi biến môi trường. Mở web → **API & chi phí** → nhập mật khẩu studio → chọn provider/model → đọc danh sách model → chọn chính sách chi phí.

Xem tên biến tại [`.env.example`](.env.example). Không dùng tiền tố `VITE_` cho khoá; không commit `.env`. Khi chưa có `STUDIO_ACCESS_TOKEN`, API trên Vercel đóng, còn tiền kỳ và nhập/ghép clip local vẫn dùng được.

Nếu Vercel báo `EUSAGE` / không tìm thấy `package-lock.json`, kiểm tra **Settings → Build and Deployment**:

| Thiết lập | Giá trị |
|---|---|
| Root Directory | để trống hoặc `.` |
| Framework Preset | Other |
| Install Command | `node scripts/vercel-install.mjs` |
| Build Command | `cd apps/director-studio && npm run build` |
| Output Directory | `apps/director-studio/dist` |

Lệnh cài mới kiểm tra lockfile v3 và chạy `npm ci` ngay trong thư mục app, với đường dẫn tuyệt đối tính từ file script; luôn cài devDependencies cần cho TypeScript/Vite. Không thay bằng `npm install` để bỏ qua lỗi lockfile. Khi sửa Settings, deploy commit mới nhất trên `main`; bản redeploy của commit cũ vẫn dùng cấu hình cũ. Log cài mới phải xuất hiện dòng `[studio install]` và đường dẫn kết thúc bằng `/apps/director-studio/`.

## API miễn phí trước

- Google Gemini và Groq: danh sách model văn bản có free tier; phải xác nhận tài khoản/key đang dùng free tier, chưa bật billing. Quota và khả năng truy cập phụ thuộc tài khoản.
- APMIX: adapter Chat Completions, preset Claude Sonnet 4.6 Free theo [danh mục chính thức](https://apmix.ai/models). Model Free và quota có thể thay đổi.
- Experiential Labs: adapter OpenAI-compatible. Nếu tài khoản có model miễn phí đã kiểm tra, chủ web khai báo ID trong `EXPERIENTIAL_FREE_MODELS`; không suy ra miễn phí từ việc gateway không thu markup.
- GPT/Claude trực tiếp và các model trả phí: phải bật **Cho phép dùng credit / trả phí**. Hết quota sẽ dừng; không chuyển provider hay bật billing tự động.
- **Google Veo**: tạo take 4/6/8s; không có free tier theo [bảng giá Google](https://ai.google.dev/gemini-api/docs/pricing). Mỗi thao tác tạo đúng một job. Job chạy tại Google, tab chỉ kiểm tra và tải kết quả, không giữ vòng lặp serverless lâu.
- API khác: chủ web đặt HTTPS `CUSTOM_API_BASE_URL`, `CUSTOM_API_KEY`, và nếu có, `CUSTOM_FREE_MODELS`. Endpoint phải dùng hợp đồng OpenAI Chat Completions. Không nhận endpoint tuỳ ý từ trình duyệt.

Trang model từ API cho biết quyền truy cập, **không chứng minh giá bằng 0**. App không thể kiểm tra billing tài khoản chỉ bằng API key. Các API gateway hiện phục vụ văn bản; không giả định mọi model GPT/Claude có thể xuất video.

## Workflow điện ảnh đã tích hợp

Nguồn `workflow-page-Trang-9-2026-10-03.json`: 57 node, 78 dây, 26 cảnh, một bảng ảnh tham chiếu, hai nhánh ghép. Nhánh 20 cảnh có mục tiêu 600s; nhánh sáu cảnh có mục tiêu 48s. Chỉ một prompt đã có trong nguồn; 25 ô trống được giữ nguyên và báo audit.

1. Chọn cảnh → viết prompt hoặc gọi AI cải thiện → lưu.
2. Nhập ảnh đầu cảnh riêng hoặc dùng bảng tham chiếu (bảng có thể xuất hiện trong clip). Ảnh đầu cảnh riêng giữ trong phiên, đổi cảnh cần nhập lại.
3. Tạo take Veo khi cho phép chi phí, hoặc nhập clip đã có miễn phí.
4. Xem take → duyệt QC → chọn take vào bản dựng → đặt thứ tự take trong từng cảnh.
5. Đủ thời lượng và QC mới mở ghép. Nhiều take 8s có thể tạo cảnh 30s; phần dư cuối cảnh tự cắt. Web dựng cắt thẳng từ clip thật, giữ âm thanh, xuất WebM 720p/24fps.
6. Tải bản dựng và từng take; xuất workflow/handoff để hậu kỳ trong DaVinci/Premiere/CapCut khi cần MP4, grading và mix âm hoàn chỉnh.

Dự án tiền kỳ có thể đi tiếp: bước **9 · QC & bàn giao** → **Xuất dự án sang Workflow điện ảnh** → nhập JSON ở tab Workflow. Cầu nối giữ mọi cảnh, thời lượng, character bible, prompt staging/motion và format 9:16; footage mới cần duyệt QC riêng. Bản dựng dùng format 16:9 hoặc 9:16 của nhánh được chọn.

Dự án/workflow/job metadata lưu trong localStorage; video lưu trong IndexedDB của **trình duyệt và domain đang mở**. Chưa có đồng bộ cloud, nhiều người dùng hay render worker. JSON không chứa video/key. Tải take về máy để sao lưu. Giữ tab phía trước khi dựng; MediaRecorder chạy theo thời gian footage và có thể chậm trên máy yếu.

## Cấu trúc và kiểm tra

```text
apps/director-studio/   React + Vite; tiền kỳ, workflow, API UI, IndexedDB, dựng browser
api/studio.mjs         Vercel Function; auth, proxy model, video job, stream tải take
server/providers.mjs   Adapter Google / OpenAI / Claude / gateways; cost gate
docs/cinema-studio/    Tổng hợp tri thức, audit, Kaizen và hướng dẫn đấu nối
scripts/               Import workflow, fixture và kiểm tra nguồn trước publish
tests/                 Kiểm tra API bằng mock; không gọi dịch vụ trả phí
Grop/                  Nguồn NestJS/Prisma tham khảo, chưa phải backend deploy
```

Đã qua build TypeScript/Vite, 10 nhóm kiểm tra tiền kỳ, năm nhóm workflow/multi-take/cầu nối và 11 kiểm tra API. Đã thử trong trình duyệt với hai clip thật có âm thanh và tạo bản WebM xem trước. Chưa gọi API live bằng key của bạn hoặc tạo tập phim hoàn chỉnh; chất lượng điện ảnh phải nghiệm thu bằng footage/pilot.

Chi tiết: [Audit workflow & Vercel](docs/cinema-studio/10-workflow-api-vercel.md), [Kho tri thức](docs/cinema-studio/README.md).

---

## Ghi chú của bộ skill TikTok Viral Video (v3) gốc

Bộ skill tạo video/hình ảnh TikTok, tổng hợp từ toàn bộ quá trình làm việc
2026-09-28 → 2026-10-03 (7 video đã bàn giao + pipeline nhà sản xuất phim).

## Cấu trúc

- `SKILL.md` — skill chính (brief → hook → timeline → shot list → keyframe → animate → ghép → lời đọc/sub/beat → caption → checklist bàn giao).
- `references/loi-doc-phu-de-mix.md` — công thức lời đọc + phụ đề `.ass` + mix beat/ducking (đọc ở bước 7 mọi video).
- `references/capcut-workflow.md` — quy trình tách CapCut (hay sinh asset, AI dựng).
- `references/san-xuat-dien-anh.md` — pipeline nhà sản xuất phim: tiền kỳ/quay/dựng/hậu kỳ, QC 4 lượt, failover.
- `references/character-swap.md` — đổi nhân vật MiniMax-H3 LoRA (cần consent văn bản).
- `shot-list-30-keyframes.md` — bảng 30 keyframe cho video timelapse công trình.

## Dùng trên Muse và Type

- Trên Muse: chạy trực tiếp (section 0 trong SKILL.md chỉ là ánh xạ cho Type).
- Trên Type: đọc mục 0 của SKILL.md trước — ánh xạ tool, hay gửi file giọng đọc + beat vào thread.
