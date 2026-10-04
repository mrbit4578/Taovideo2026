# Audit & Kaizen — Lõi điện ảnh, bản xuất TikTok

**Kết quả:** đã nâng trực tiếp skill **TikTok Viral Video**, giữ handle `tiktok-viral-video`, theo lựa chọn của hen hayha. Điện ảnh là lõi; TikTok/Reels/Shorts là bản chuyển thể riêng. Không tạo skill trùng hoặc đổi tên.

## Phạm vi đã đọc

Đọc toàn bộ 7 nội dung riêng trong 9 attachment; SHA-256 xác nhận `SKILL (1).md` trùng hoàn toàn [SKILL.md](https://SKILL.md), và `shot-list-30-keyframes (1).md` trùng hoàn toàn bản không có `(1)`. Đồng thời đọc 5 file đang lưu trong skill để giữ các sở thích mới hơn. Bản gốc không bị chỉnh/xóa.

Nguồn gốc và hash của từng attachment đã lưu ở [audit-kaizen.md](https://audit-kaizen.md) trong skill. [Thread nguồn và xác nhận hướng nâng cấp](https://type.com/team-wenjie/space/operations-finance/channel/general/thread/msg_01m410tgaqejesjmjjr9enms25).

## Audit từng file

| Tài liệu | Phát hiện chính | Sửa trong bản nâng cấp |
| --- | --- | --- |
| SKILL.md + bản trùng | Video marketing bị áp lên mọi phim; scene=clip 10s; quyền và tool cũ bị coi hiện hành | Router theo tác vụ; tách scene–shot–take; capability theo turn; giữ approval thật; workflow Video artifact của Type |
| san-xuat-dien-anh.md | Thiếu story arc/diễn xuất/coverage; prompt được coi khóa nhân vật; batch trước pilot; QC một frame | Story → blocking/performance → camera/light; bibles/reference; pilot 1–3 shot khó; xem toàn clip; gates G0–G5 |
| shot-list-30-keyframes.md + bản trùng | Sai tổng runtime/overlap; morph bị coi tiến trình xây dựng; camera lock bảo đảm giả; AI vẽ end-card/logo | Giữ 30 mục: 29 trạng thái + card hậu kỳ; geometry/occlusion; thời lượng integer frames; giới hạn nội suy rõ ràng |
| loi-doc-phu-de-mix.md | Gain 0.15 bị gọi thấp hơn voice 20dB; limiter auto-level; amix/concat; ASS q2 tắt wrap; thiếu final loudness QC | Đo nguồn thật; audio pad/trim; limiter không auto-level; subtitle theo audio; sound layers + LUFS/true peak file cuối |
| capcut-workflow.md | Giả định Pro/model/watermark; center crop mù; xóa mọi audio; thiếu manifest | Handoff shot/take/version; ingest đo thật; reframe từng shot; giữ audio hữu dụng; rights/watermark check |
| character-swap.md | Provider/endpoint/limit chưa xác minh; 768×1344 gọi là 9:16; checkbox consent chưa đủ | Historical adapter có cảnh báo; tỉ lệ 4:7 đúng; discovery/schema trước chạy; consent có phạm vi + whole-clip QC |
| README.md | Đường dẫn references/ không khớp live skill; v3 upload khác live v2; preference beat có thể mất | Link chính xác file root; giữ beat Type và giọng/VO/sub đã lưu; không thêm README dư |

## Cấu trúc skill sau nâng cấp

| File | Vai trò |
| --- | --- |
| SKILL.md | Lõi/router, năng lực Type, workflow video, gates và báo cáo |
| san-xuat-dien-anh.md | Story, diễn xuất, cinematography, coverage, continuity, edit/color |
| production-templates.md | Brief, scene beat, shot sheet, take board, manifest, EDL, QC, kaizen |
| loi-doc-phu-de-mix.md | Voice/subtitle, sound design, mix/loudness và preference |
| capcut-workflow.md | Handoff và ingest asset công cụ ngoài |
| character-swap.md | Consent, provider adapter và temporal QC |
| shot-list-30-keyframes.md | Timelapse state bank, prompt và timeline |
| tiktok-delivery.md | Social adaptation, caption, reframe, export và disclosure |
| audit-kaizen.md | Audit đầy đủ, hash nguồn, validation và rollback baseline |

**Đã giữ:** báo cáo tiếng Việt; bản social mặc định có lời đọc + phụ đề Việt; giọng nam ấm miền Bắc; nhạc ưu tiên đã lưu bằng Type fileId; fidelity sản phẩm thật; disclaimer đã xác minh. Với phim, VO/CTA/nhạc theo story, không ép preset marketing.

## Kiểm tra đã thực hiện

- SHA-256 xác nhận hai cặp attachment trùng byte.
- Tính lại gain: `volume=0.15` = **−16.48dB so với nhạc đầu vào**, không chứng minh thấp hơn lời đọc 20dB.
- Timeline 24fps: **45s = 1080 frame; 60s = 1440 frame; 300s = 7200 frame**; đều đã chạy assertion.
- 30 clip ×10s với 29 overlap 8–12 frame: **285.5–290.333s**, không 330s.
- Smoke-test graph audio mới trên FFmpeg 7.1.5 bằng tín hiệu sine tổng hợp: không lỗi syntax/runtime. Không có phim thật được render/nghe trong test này.
- Rà soát đường xử lý: phim không ép CTA/VO social; thiếu footage thì handoff; character swap thiếu quyền/tool không chạy; render pending/failed không báo complete; thiếu khả năng nghe/xem ghi needs-human-review.

## Giới hạn và bước nghiệm thu thực tế

Đây là nâng cấp quy trình và bộ nhớ dùng lại, **không phải một bộ phim đã được sản xuất**, không chứng nhận chất lượng Hollywood hay cam kết viral. Chưa test CapCut/Seedance/LoRA, chưa đo retention hoặc chi phí generation bằng dự án thật.

Để chứng minh chất lượng, dự án kế tiếp nên có brief cụ thể và pilot 1–3 shot đại diện. Nghiệm thu dựa story/diễn xuất, continuity, camera/light, edit, sound và QC render cuối; không chỉ ảnh keyframe đẹp.

Baseline để quay lại trước nâng cấp: native skill version 6, `skver_01m406d9pvegqr954jn184drab`. Các thay đổi đã lưu có version history; không tự rollback khi chưa được yêu cầu. Skill đã gắn trong Operations & finance; không cam kết tự nhớ ở mọi space/thread khác.
