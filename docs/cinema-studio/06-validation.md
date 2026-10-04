# Kiểm tra thực tế và giới hạn

## Đã kiểm tra

| Kiểm tra | Kết quả | Ý nghĩa |
|---|---|---|
| Inventory/SHA-256 | 70 bản ghi: 13 root, 8 nested, 49 archive members | Bao gồm gói director và mạng nơ-ron bổ sung; duplicate phát hiện đúng |
| Build app gốc trên bản sao | TypeScript check + Vite production build thành công | Source compile được trong môi trường kiểm tra |
| Đối chiếu dist | HTML, JS và CSS đều trùng từng byte với ZIP | Bundle trong ZIP khớp build từ mã đã audit |
| Handler probes | 6 kiểm tra xác nhận hành vi | Guard write hoạt động; shared project scope, duplicate key và shared-asset deletion tái hiện bằng mock |
| Director function probes | 4 kiểm tra trên hàm thực trích từ source | Lịch timelapse 57.2s thay vì 60s, ASS carry lỗi, cue 0s và thiếu VO pad/trim/limiter policy |
| Tính toán | Gain 0.15 = −16.478dB; 768×1344=4:7; overlap/runtime đúng | Các giả định số học được sửa có bằng chứng |
| FFmpeg audio smoke | FFmpeg 8.1.2, graph dùng synthetic sine 1s, exit 0 | Graph ducking/amix/limiter syntax/runtime chạy được |
| Pilot manifest | 12 shot, tổng 2160 frame @24fps =90s | Kế hoạch runtime nhất quán; chưa có asset/take |
| Tài liệu | Link nội bộ và tính nguyên vẹn nguồn được kiểm tra | Tài liệu bàn giao có thể truy vết và nguồn gốc không bị sửa |

## Bằng chứng và chạy lại

- `_audit/inventory.py`: đọc nguồn/archive, hash, diff phiên bản và số học.
- `_audit/build-check/audit-probes.mjs`: bundle source backend/render bằng esbuild và chạy handler thật với auth/db/storage mock. Không kết nối network backend.
- `_audit/build-check/director-probes.mjs`: trích phần hàm thuần của Director Studio, transpile bằng TypeScript và kiểm tra generator. Không tuyên bố build/publish toàn app director.
- `_audit/verify-deliverables.py`: xác nhận baseline, dist, pilot, links và FFmpeg smoke.
- `_audit/validation/source-probes.json`, `inventory-checks.json`, `deliverable-checks.json`: kết quả máy đọc được.
- `_audit/validation/build-dist/`: build kiểm chứng; các artifact hash đối chiếu bản ZIP.

Build dùng `npm install --ignore-scripts --no-audit --no-fund` trong bản sao. Bun chưa có trong PATH nên không khẳng định đã tái hiện dependency graph bằng frozen Bun lock; output dist giống hệt giúp xác nhận snapshot build. Không thực hiện vulnerability scan trong lần này.

## Chưa kiểm tra

Không đăng nhập hay gọi backend Type/Convex live, không chạy generation provider, không tính phí generation, không deploy. Director ZIP thiếu package/config/platform scaffold nên chưa xác nhận build nguyên gói hoặc publish claim trong README. Không E2E browser/screenshot; vấn đề CSS/async frontend dựa đọc mã và cần reproduction khi triển khai. Không có footage/voice/beat thật trong nguồn để xem/nghe nghiệm thu; smoke sine không chứng minh mix hay chất lượng phim.

Không xác minh hoạt động của endpoint Kiemtien2026, HF Space/LoRA, CapCut account/Seedance, live skill Type hoặc 7 video bàn giao được nhắc trong tài liệu. Các policy TikTok/giới hạn provider là historical claim, chưa làm cơ sở hợp đồng hiện hành.

Các nguồn kỹ thuật tra trực tiếp cho audit: [FFmpeg filters](https://ffmpeg.org/ffmpeg-filters.html), [MDN MediaRecorder support](https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder/isTypeSupported_static), [Convex auth](https://docs.convex.dev/auth/overview), [OpenTimelineIO](https://opentimelineio.readthedocs.io/en/latest/). Các lựa chọn kiến trúc và ngưỡng pilot được ghi là đề xuất, không chứng nhận của những nguồn này.
