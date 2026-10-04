# Audit bổ sung: Director Studio và kho kiến thức mạng nơ-ron

Các nguồn này xuất hiện trong workspace khi audit đang diễn ra. Đã bổ sung vào snapshot cuối 70 bản ghi và cập nhật kết luận. Director source tại `_audit/tiktok-director-skillpack/director-studio-app/`.

## 1. Director Studio có gì thực sự

`TONG-HOP.md` và bộ skill v3 đóng gói lại quy trình root. Bảy file skill director trùng byte với các bản root tương ứng; `mang noron/SKILL.md` cũng trùng SKILL root. Không phải một engine video mới do đổi tên skill.

Director app có 4 file authored: schema, backend app, React App, CSS; thêm README. Có projects/scenes, brief, hooks, character bible, shot size/camera/staging, voiceover text, caption, checkbox QC. UI 8 bước; generator xuất keyframe/motion prompt, production pack, ASS và Bash FFmpeg script. AI hỗ trợ gợi ý hook, điền shot và viết lời đọc.

Đây là **studio lập kế hoạch**, chưa có upload/asset library/preview footage/take objects/generation jobs/render worker. `takes` là con số kế hoạch 1–3, không phải các clip có thể so sánh/chọn. Trạng thái “đã duyệt” là checkbox do user tick, không là kết quả đã xem media. README nói đã publish trên Type nhưng gói không có URL/scaffold/bundle hoặc session để xác nhận vận hành.

## 2. Phát hiện và sửa

| ID / ưu tiên | Bằng chứng | Kaizen / nghiệm thu |
|---|---|---|
| D01 — P0 khi SaaS | Schema projects/scenes không workspace/user ACL; handlers đọc/sửa ID | Áp A01 của app cũ theo resource project/scene, test tenant/member isolation |
| D02 — P1, probe xác nhận | `timelapseScenes` phân 57s+3s; `buildFfmpegScript` trừ 7 dissolve×0.4s → lịch 57.2s, `atrim=0:57.20` | Timeline budget theo integer frame; handles/overlap nhất quán; metadata final bằng ffprobe |
| D03 — P1, probe xác nhận | `assTime(1.999)` → `0:00:01.100`, centiseconds không carry | Quy đổi tổng centiseconds rồi chia h/m/s/cs; test boundary 59.999 và duration nhỏ |
| D04 — P1, probe xác nhận | `subCues`: slot 1s + “A. B. C.” → cue thứ ba start=end=1s | Cue theo audio alignment; duration>0, không vượt slot; báo không đủ chỗ |
| D05 — P1, probe/source | VO chỉ adelay rồi amix; không trim theo slot/pad theo duration; limiter auto-level mặc định | VO overlap/short tail phải có policy; final audio pad/trim/measure; `level=0` khi cần giữ gain |
| D06 — P1, source | Các status bool độc lập; script export không lọc/khóa approved takes | Entity Take+Asset, server gate, snapshot và reviewer evidence; draft pack vẫn export được với nhãn draft |
| D07 — P1, source | `validateScene` chỉ kiểm tra bounds/end>start; không unique order, gaps/overlap/project runtime/status dependencies | Validate cả scene plan/timeline trong transaction; empty project phải được ghi là draft |
| D08 — P1, source | `Field` chỉ commit onBlur; patch nguyên brief/caption/status object, không expected revision | Save/recovery rõ, field-level ops/CAS, conflict test; hai editor không ghi đè im lặng |
| D09 — P1, source | `run` catch rồi không rethrow; AI `Promise.all` nhận fulfilled dù một patch thất bại | Kết quả mỗi item, partial failure report, retry đúng scene; không báo AI update xong khi lỗi |
| D10 — P1, source | End-card nhận diện bằng `role.includes("End card")` nhưng role editable | Trường scene/shot kind enum, không suy semantics từ nhãn |
| D11 — P2, source | selectedHook bounds cho −1..20, không integer hoặc nằm trong hooks hiện có; qc nhận chuỗi bất kỳ/duplicate | Runtime/index validity, stable hook ID, QC item enum/set/revision |
| D12 — P2, source | Backend tối đa 12 scenes, duration600s; UI template chỉ30/45/60; plan duration≥60 vẫn kết thúc60 | Mode-specific planning; long-film scene/shot objects, không kéo video dài từ template60s |
| D13 — P2, source | “ambient công trường” là comment; script chỉ mix beat; “beat luôn dưới lời” là giả định gain | Thêm audio asset/tracks thực, loudness/sidechain theo nguồn; không mô tả lớp tiếng chưa render |
| D14 — P1, packaging | Thiếu package.json, main.tsx, typeAuth, typeFunctions/typeSchema/generated API/config trong director ZIP | Export đầy đủ scaffold/version/migration trước khi chạy standalone; không nhầm build app cũ là build director |
| D15 — P1, source | `keyframePrompt`, App.tsx:325 trả promptOverride trước bible/staging/default constraints | Tách creative override và locked invariants; full override có diff/review, không hứa luôn khóa bible |
| D16 — P1, source | updateScene/updateProject/replaceScenes không invalidation approval/QC sau đổi nội dung | Review gắn target revision/hash; đánh dấu stale đúng dependency khi sửa script/cast/take/timeline/audio |
| D17 — P1, source | buildLabelsAss/QC marks dùng startSec gốc trong khi xfade dịch timeline | Compile labels/audio/QC sampling từ timeline render đã tính transition; kiểm tra mốc end-card |

Timelapse probe xác nhận **lịch tính của generator**, chưa đo video final; 0.4s×24fps không là số frame nguyên nên runtime encode có thể lượng tử hóa khác. Kế hoạch 60s vẫn không thể coi đã nghiệm thu. Script cũng clone frame cuối khi clip ngắn, crop center và bỏ audio: hợp lý như một lựa chọn draft, nhưng phải gắn nhãn nếu làm giảm performance/cinematography.

## 3. Chọn nền phát triển

Ưu tiên tái sử dụng **UX và dữ liệu planning Director Studio**, cộng các bài học exporter/asset lifecycle từ app cũ. Tạo model Cinema Studio mới có migration rõ; không chép hai bảng `projects` khác schema vào cùng backend. Schema director scenes là đầu vào import, chuyển sang Scene/Shot theo ý nghĩa; statuses legacy chỉ là ghi chú lịch sử, không auto-approve asset mới.

M0 cần đầy đủ scaffold hoặc app mới độc lập trước khi M1 chạy auth/persistence. D02–D11 là backlog cần sửa nếu giữ generator planning. Render worker mới dùng typed timeline thay vì đưa Bash script cho người dùng chạy thủ công.

## 4. Kho `mang noron`

Đã đọc README, 6 brief và xác nhận SKILL trùng byte root. Sáu brief cung cấp: cơ chế học mạng nơ-ron; data leakage/overfitting/metrics; CNN/RNN/Transformer; hỏi đáp–workflow–agent; agent kho; thiết kế tool/human review. Đây là **đề tài nội dung và nguyên tắc workflow**, không phải mã model/video generation.

README liệt kê hai tài liệu kiến thức đầy đủ, `sources-index.json` 66 nguồn và `video-briefs/`; các file/thư mục này **không có trong nguồn nhận được**. Anchor `[01]`, `[42]`... và doc_id vì thế chưa resolve. Claim gắn VERIFIED trong brief chỉ là assertion của nguồn, chưa đủ evidence ledger của app.

Kaizen cho content library:

- Lưu doc_id/version, claim text, source locator/URL/section, thời điểm kiểm tra và review status. Thiếu nguồn → `unverified_source_missing`, không tự giữ VERIFIED.
- Hook “90% là do bạn giao việc chưa rõ” trong brief06 không có evidence thống kê → bỏ con số hoặc xác minh trước dùng.
- “Càng nhiều dữ liệu đúng càng bớt sai” và ẩn dụ “attention soi cả đoạn” cần ghi là diễn giải đơn giản, tránh trình bày như bảo đảm kết quả hoặc quy tắc cho mọi kiến trúc.
- Ví dụ DH001/size A-38 là mô phỏng; caption/script phải ghi đúng ngữ cảnh.
- Claim “guard bắt buộc”, “mọi write phải người duyệt” là policy của nguồn. Product policy cần theo tác vụ và quyền đã được user cho phép; không biến mọi save draft thành approval UI.
- Giữ nguyên tắc bounded steps/timeouts/budget, schema tool rõ và idempotency trong orchestration Cinema Studio. Các vai trò biên kịch/đạo diễn/editor có thể là stage workflow; chưa cần nhiều agent tự do để hoàn thành MVP.

Các endpoint auto-build/RAG Kiemtien2026 được README nhắc là lịch sử chưa có implementation hoặc kết nối trong workspace. Không gọi chúng như engine sẵn có.
