# Bản đồ kiến thức và cấu trúc hiện tại

## 1. Ba lớp tài sản

**Lớp quy trình:** brief → hook/kịch bản → shot list → keyframe → clip → dựng → tiếng/sub → QC → bàn giao. Có kinh nghiệm hữu ích về lỗi AI, staging, sản phẩm thật và phụ đề tiếng Việt.

**Lớp app:** TikTok Video Maker có React 19.1.0 + TypeScript 5.9.3 + Vite 6.4.2; Convex 1.42.3 lưu project/slide/ảnh. Canvas vẽ gradient, ảnh tĩnh và chữ; MediaRecorder ghi file trong trình duyệt. Gói director bổ sung 4 file nghiệp vụ React/Convex và README: quản lý brief/scenes, production board, prompt, ASS và script dựng; thiếu scaffold để build nguyên gói riêng. Cả hai chỉ dùng `window.typeAi` cho nội dung chữ, chưa có generation video hay media pipeline tích hợp.

**Lớp lịch sử:** Muse, Type, Kiemtien2026, CapCut, VeoGenie và character-swap được nhắc trong tài liệu. Không có mã NestJS, endpoint character-swap triển khai, file beat, reference sản phẩm, footage hoặc bằng chứng 7 video bàn giao trong thư mục này. Các lời khẳng định lịch sử được ghi nhận theo nguồn, chưa xác minh bằng artifact.

## 2. Tri thức từng tài liệu

| Nguồn | Kiến thức có thể giữ | Chuyển thành chức năng app |
|---|---|---|
| `README.md` | Danh mục skill và workflow | Knowledge library có version/link đúng |
| `SKILL.md`, bản `(1)` trùng | Một mục tiêu/video; hook; cast–world–prop; realism; staging; bàn giao | Brief có cấu trúc, shot planner, kiểm tra asset, social delivery profile |
| `san-xuat-dien-anh.md` | Production board, coverage, dailies, continuity, QC, retry log | Quản lý scene/shot/take, review, dependency, job history |
| `loi-doc-phu-de-mix.md` | VO tiếng Việt, giữ ý nghĩa khi trim, ASS theo canvas, ducking | Audio tracks, transcript version, subtitle editor, loudness report |
| `capcut-workflow.md` | Nhận footage/voice từ công cụ ngoài; dựng sau ingest | Asset import, manifest, proxy, kiểm tra watermark và âm thanh |
| `character-swap.md` | Reference mặt, quyền sử dụng, QC chuyển động sau swap | Adapter tùy chọn, consent record, human review; không là phụ thuộc bắt buộc |
| `shot-list-30-keyframes.md`, bản trùng | Construction state bank, plate, vật neo, light progression | Template timelapse riêng, registration/geometry QC và timeline theo frame |
| `Audit_Kaizen_L_i_i_n_nh_b_n_xu_t_TikTok.md` | Scene–shot–take, pilot trước batch, core/social separation, các lỗi âm thanh | Điểm khởi đầu audit, đối chiếu thực thi thay vì xem là thay đổi đã có |
| Skill ZIP v2, 5 file | Workflow cũ; beat ưu tiên có Type fileId; v2 không có shot-list | Import có provenance; không ghi đè sở thích một cách im lặng |
| Director ZIP | Skill v3 trùng root; app planning 8 bước, ASS và FFmpeg generator | Tái sử dụng production UX; sửa generator và chuyển sang asset/take/render thật |
| `mang noron/`, 8 file | 6 brief kiến thức mạng nơ-ron/agent, README, SKILL trùng root | Content library và claim ledger, không là engine phim; nguồn tham chiếu còn thiếu |

## 3. Phiên bản và liên kết bị lệch

Root `SKILL.md` ghi v3; ZIP skill ghi v2. Tài liệu audit cũ nói đã có `production-templates.md`, `tiktok-delivery.md`, `audit-kaizen.md` trong live skill, nhưng các file ấy **không có trong bộ nguồn nhận được**. Không thể kết luận live skill bên ngoài đang tồn tại hay đã đồng bộ.

Root README/SKILL trỏ `references/...`, trong khi file root nằm ngang hàng. ZIP có đúng thư mục references nhưng nội dung cũ hơn. Nguồn ngoài như `content-playbook-2026.md`, `he-thong-video-faceless-tu-nguon-viral.md`, `docs/character-swap-minimax-h3.md` không có ở đây.

Hash xác nhận:

- Hai SKILL root: `7b86a535a2a707e83a6409c0164e50387ccdf4b15ff783d6931068134174c004`.
- Hai shot list root: `7c984f5aa9e8fd6c113f5945b05aa1d85140e7c5f042520c8d34d11f3c65c003`.

Đề xuất canonical: các tài liệu Cinema Studio làm đặc tả phát triển hiện tại; tài liệu root/ZIP là baseline lịch sử có hash. Khi nâng skill thực sự, hợp nhất sở thích và tạo version mới có diff; chưa cần sửa hoặc xóa bản gốc.

## 4. Những nguyên tắc đáng giữ

1. Brief rõ khán giả, mục tiêu, thông điệp và nguồn minh họa.
2. Original-first: ý tưởng, câu chuyện và asset có nguồn gốc rõ.
3. Shot có chủ thể, môi trường, đạo cụ, hành động và quan hệ không gian khả thi.
4. Vật thật dùng reference được kiểm tra; continuity phải nhìn trên footage.
5. Chọn take trước khi dựng; lưu lý do reject, retry và fallback.
6. Lời, hình và âm thanh cùng phục vụ beat; phụ đề theo audio thực tế.
7. Chỉ bàn giao sau khi xem/nghe toàn bộ bản render, có QC report.

## 5. Các quy tắc phải đổi khi làm điện ảnh

| Quy tắc cũ | Quy tắc lõi mới |
|---|---|
| Một cảnh = clip 10 giây | Scene là đơn vị kịch; shot là góc quay; take là lần thực hiện. Provider duration chỉ là giới hạn asset |
| Mọi video dọc, hook/CTA/VO bắt buộc | Profile điện ảnh và social riêng; 16:9 mặc định pilot; CTA chỉ khi phù hợp mục đích |
| Mọi shot chuyển động nhẹ | Chọn camera/action theo cảm xúc; shot khó phải pilot, fallback phải gắn nhãn |
| Paste bible đảm bảo cùng nhân vật | Bible + reference version + costume/prop state + footage review; prompt không bảo đảm identity |
| 2 takes hook/CTA | Coverage theo hành động/diễn xuất; master, reverse, reaction, insert khi cần |
| Một frame giữa clip đủ QC | Xem cả clip, soi đoạn lỗi và transition; contact sheet chỉ là sàng lọc |
| Bỏ hết audio AI | Phân loại thoại/ambient/nhạc; giữ phần hữu dụng, kiểm tra sync, provenance và noise |
| Crop center 16:9 → 9:16 | Reframe theo từng shot và chủ thể; có thể cần phiên bản bố cục riêng |
| Retry lỗi rồi tự hạ cấp | Phân loại lỗi, đối soát trạng thái unknown, chặn duplicate billing; đổi motion/prompt phải là version mới |
| Cố định volume/codec/kích thước | Đo audio/file thực tế, preset theo đích; yêu cầu nền tảng được kiểm chứng khi triển khai |

## 6. Tri thức điện ảnh bổ sung cần đưa vào app

- **Story:** nhân vật muốn gì, trở ngại, stakes, biến chuyển, payoff và subtext. Mỗi scene phải thay đổi trạng thái câu chuyện.
- **Performance/blocking:** ý định diễn xuất, eyeline, vị trí actor, hand/prop action, phản ứng và khoảng nghỉ. Lời thoại tự nhiên hơn việc đọc thông tin.
- **Cinematography:** shot size, lens intent, camera height, axis, depth, motivated movement, key/fill/practical light, exposure và màu theo scene.
- **Editorial:** coverage, match-on-action, screen direction, J/L cuts, reaction, pacing theo cảm xúc; không ép đổi cảnh mỗi 3–8 giây.
- **Sound:** dialogue, room tone, ambience, Foley, SFX, score, silence và stems. Chất lượng nghe cần người duyệt.
- **Color/finishing:** ghi màu nguồn, normalize, shot matching, look version, QC banding/artifact; upscale không khôi phục chi tiết thật đã mất.
- **Production:** revision, asset lineage, hạn mức tiền, job dependency, bàn giao editor ngoài, review có timecode và snapshot khóa.

## 7. Sở thích và điều chưa thể suy ra

Giữ mặc định UI/report tiếng Việt. Giọng nam ấm miền Bắc và VO/sub tiếng Việt áp dụng cho social, có thể chọn theo project. Beat được ZIP nhắc bằng fileId của Type không thể dùng trực tiếp như file local; ghi trạng thái `missing` cho đến khi import hợp lệ. Không giả định tài khoản CapCut Pro, model khả dụng, API key hay backend Kiemtien2026 đã kết nối.

Thời lượng một tập phim, thể loại chính, ngân sách tháng, số người dùng, provider và nơi host chưa được chốt. Pilot và kiến trúc dưới đây là giả định khởi đầu có thể điều chỉnh, không phải yêu cầu đã được người dùng xác nhận.

## 8. Đọc tiếp gói director

Đã xác nhận ZIP người dùng chỉ định không đổi so với snapshot trước. Bổ sung [08-director-knowledge-integration.md](08-director-knowledge-integration.md) và [director-knowledge-rules.json](director-knowledge-rules.json): mapping 8 bước, prompt override/invariants, dependency-based review invalidation, timing sau transition và manifest handoff. Hướng dẫn trong ZIP được phân biệt với yêu cầu đọc hiện tại; các rule là đề xuất phát triển, chưa được cài hoặc chạy trong app.
