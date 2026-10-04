# Cinema Studio — tổng hợp kiến thức, audit và lộ trình Kaizen

Ngày lập: **03/10/2026**, múi giờ Asia/Saigon. Phạm vi: `D:/AI/KIEMTIEN ONLINE/taovideo chatgpt`.

**Kết luận:** có nền tảng tri thức tốt cho sản xuất video ngắn và hai nguồn app: TikTok Video Maker làm slideshow; Director Studio lập kế hoạch sản xuất và xuất prompt/sub/script FFmpeg. Director Studio là nền giao diện nghiệp vụ phù hợp hơn để tiếp tục phát triển. Để đạt mục tiêu web app sản xuất phim điện ảnh, cần bổ sung asset/take thật, continuity, timeline, sound và render trong app. “Hollywood” được dùng làm định hướng thẩm mỹ; chất lượng phải được chứng minh bằng phim pilot và nghiệm thu, không bằng tên model hoặc độ phân giải.

## Đọc tài liệu theo thứ tự

| Tài liệu | Nội dung |
|---|---|
| [01-knowledge-map.md](01-knowledge-map.md) | Toàn bộ tri thức đã tổng hợp, phiên bản và mâu thuẫn cần giải quyết |
| [02-audit-findings.md](02-audit-findings.md) | Audit mã nguồn/quy trình, bằng chứng, mức ưu tiên và cách sửa |
| [03-product-architecture.md](03-product-architecture.md) | Định nghĩa sản phẩm, màn hình, kiến trúc, dữ liệu và hợp đồng job |
| [04-kaizen-roadmap.md](04-kaizen-roadmap.md) | Backlog theo giai đoạn, pilot điện ảnh, ngân sách và tiêu chí nghiệm thu |
| [05-production-templates.md](05-production-templates.md) | Brief, shot sheet, review, QC và vòng lặp cải tiến |
| [pilot-manifest.json](pilot-manifest.json) | Mẫu kế hoạch phim 90 giây, 12 shot; chưa có footage |
| [06-validation.md](06-validation.md) | Các kiểm tra thực tế, kết quả và giới hạn |
| [07-director-and-knowledge-audit.md](07-director-and-knowledge-audit.md) | Audit bổ sung Director Studio và thư mục mạng nơ-ron xuất hiện trong lúc làm việc |
| [08-director-knowledge-integration.md](08-director-knowledge-integration.md) | Củng cố kiến thức gói director: prompt invariants, continuity, review invalidation và handoff |
| [09-v2-integration-and-kaizen.md](09-v2-integration-and-kaizen.md) | Hai gói bổ sung, mã app local đã đấu nối, sửa lỗi và kiểm tra thực tế |
| [10-workflow-api-vercel.md](10-workflow-api-vercel.md) | Workflow Trang 9, API free trước, take/QC/dựng browser và cấu hình deploy Vercel |
| [11-grop-free-api-integration.md](11-grop-free-api-integration.md) | Đối chiếu 9 tệp Grop, điểm đấu nối và hướng dẫn key API miễn phí |
| [Director Studio chạy local](../../apps/director-studio/README.md) | Cách mở app, kho sáu brief v2, schema và các giới hạn runtime |
| [director-knowledge-rules.json](director-knowledge-rules.json) | 10 quy tắc đề xuất có nguồn, dùng làm đầu vào phát triển app |
| [source-manifest.csv](source-manifest.csv) | Danh mục file, dung lượng, số dòng và SHA-256 |
| [knowledge-version-diff.txt](knowledge-version-diff.txt) | Diff giữa skill ZIP v2 và các tài liệu root v3 |

## Phạm vi thực tế

- Snapshot sau hai gói bổ sung: 15 file ở root (10 Markdown, 4 ZIP, 1 RAR), 8 file trong `mang noron`, 84 file bên trong archive → **107 bản ghi nguồn**, gồm cả container archive.
- Hai cặp Markdown root trùng byte → 8 tài liệu Markdown độc lập ở root. Skill trong gói director và `mang noron/SKILL.md` cũng trùng nội dung root; đã xác nhận bằng hash.
- Toàn bộ file và nội dung archive được đọc bằng chương trình để lập hash. Tài liệu và mã ứng dụng được audit về nội dung; bundle minified, dependency lock và binding sinh tự động được kiểm kê/đối chiếu theo vai trò, không coi là tri thức nghiệp vụ mới.
- Bản giải nén giữ tại `_audit/TikTok_Video_Maker`, `_audit/tiktok-viral-video-skill`, `_audit/tiktok-director-skillpack`; kiểm tra chạy trên bản sao `_audit/build-check`.

## Trạng thái bàn giao

Đã tổng hợp, audit, thiết kế lộ trình và tích hợp bản tiền kỳ Director Studio v2 chạy local: nhập tri thức → project/cảnh/claim → prompt/sub/pack. Chưa xây xong hệ thống Cinema Studio sinh và dựng phim, chưa sản xuất một tập phim. Các file nguồn và archive gốc được giữ nguyên. Endpoint/model trong tài liệu lịch sử không được mặc nhiên coi là dịch vụ đang hoạt động.

Quyết định thiết kế ban đầu: **điện ảnh là lõi, TikTok/Reels/Shorts là bản chuyển thể**. Giữ tiếng Việt, ưu tiên giọng nam ấm miền Bắc cho thuyết minh social; phim dùng thoại/VO/nhạc theo câu chuyện. Beat được nhắc trong skill ZIP là sở thích lịch sử, hiện chưa có file âm thanh trong workspace.
