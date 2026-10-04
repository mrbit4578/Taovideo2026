# Củng cố kiến thức từ gói Director Studio

Ngày bổ sung: 03/10/2026. Nguồn: `tiktok-director-skillpack.zip`, SHA-256 `54f7142b5d7bdcbd0f1781856b366aedf08e26e1938bd700d1f0339c7459e30d`. Gói này đã được audit ở lượt trước; lần đọc tiếp xác nhận nội dung không đổi và bổ sung cách dùng tri thức khi phát triển Cinema Studio.

## 1. Phân biệt tài liệu nguồn với yêu cầu hiện tại

Yêu cầu hiện tại là **đọc và củng cố kiến thức**. Các câu trong SKILL như “mặc định mọi video”, “bắt buộc”, “chạy lệnh”, “nhắc đăng bài”, hay đường dẫn endpoint là nội dung lịch sử của workflow. Việc đọc không đồng nghĩa cài skill, chạy script, gọi API, sinh video hay publish. Các quy tắc nguồn chỉ được đưa vào đặc tả sau khi xét mục đích phim và khả năng thực tế.

README nói app đã build/publish trên Type là lời tường thuật của nguồn; mã nghiệp vụ trong ZIP kiểm chứng được, trạng thái app live chưa được kiểm chứng. Không coi UI checkbox hoặc script được xuất là bằng chứng đã có media thành phẩm.

## 2. Tri thức có thể kế thừa từ 8 bước

| Bước nguồn | Kiến thức đáng giữ | Bổ sung để làm phim điện ảnh |
|---|---|---|
| Brief | Mục tiêu, khán giả, angle, minh họa rõ | Logline, conflict, stakes, character arc; CTA theo profile |
| Hook | So sánh nhiều cách mở đầu; lời–hình–chữ nhất quán | Opening beat có ý đồ, không áp retention marketing lên mọi scene |
| Casting | Có hồ sơ nhân vật xuyên dự án | Reference ảnh, costume/prop state, bible version và shot dependency |
| Shot list | Shot size, camera, action, subject/env/prop; staging màn hình | Tách Scene/Shot/Take; blocking, eyeline, axis, lens/light và coverage |
| Prompt | Tạo keyframe/motion riêng; kiểm tra quan hệ không gian | Prompt compiler có invariants, adapter capability và provenance |
| Lời đọc/sub | Text theo cảnh, ASS có kích thước, mix tách VO/beat | Thoại/VO theo story; alignment theo audio, Foley/ambience/SFX/stems |
| Caption | Delivery metadata theo đích social | Tách film master và adaptation; caption không là phần bắt buộc của phim |
| QC/bàn giao | Review theo nhóm, handoff và log fallback | Gate dựa asset/render revision, full screening và báo cáo đo thật |

Tách ba khái niệm: **kế hoạch** mô tả điều muốn quay; **take** là media thực hiện được; **delivery** là file render đã kiểm tra. App phải hiển thị đúng lớp đang có.

## 3. Bổ sung về prompt và continuity

Hàm `keyframePrompt`, `src/App.tsx:325`, trả ngay `promptOverride` nếu có. Vì vậy override bỏ qua character bible, screen staging, ràng buộc vật lý và bố cục mặc định. Đây là khả năng kiểm soát sáng tạo, nhưng không thể đồng thời khẳng định app luôn khóa bible cho mọi prompt.

Đề xuất hai trường riêng: `creativeOverride` thay phần mô tả sáng tạo; `lockedInvariants` giữ các thông tin bắt buộc của shot đã duyệt. Full override phải hiển thị rõ phần bị thay và có review. Không ép mọi props “resting on a real surface” khi action là cầm/trao: quan hệ vật lý cần theo trạng thái shot.

Prompt compiler nên ghi: cast/location/prop reference versions, blocking, action, camera/light, delivery framing, adapter/model version và compiled prompt hash. Khi provider không hỗ trợ end-frame/reference/motion control cần báo giới hạn cụ thể. Lệnh “keep exactly” trong prompt là yêu cầu, không phải chứng minh fidelity.

Motion prompt hiện luôn thêm chuyển động người/background và video dọc, kể cả shot timelapse hay end-card. Routing mới nên chọn generator theo `shotKind` và `sourceType`; end-card được dựng hậu kỳ, không gửi generic motion prompt cho model.

## 4. Bổ sung về version và duyệt lại

Các bool `keyframe/take/approved/assembled` và danh sách `project.qc` không gắn hash/revision. `updateScene` sửa action/VO/prompt rồi giữ nguyên trạng thái cũ; `updateProject` sửa bible cũng không đánh dấu các cảnh phụ thuộc cần review. `replaceScenes` thay toàn bộ cảnh nhưng giữ QC của project.

Quy tắc đề xuất:

- Sửa cast/reference/blocking/prompt → các take liên quan được đánh dấu `review_stale`; giữ take cũ để so sánh.
- Sửa selected take/trim/transitions → tạo timeline revision mới; picture QC/render approval của revision trước không áp sang bản mới.
- Sửa VO/sub/mix → audio/sub QC cần kiểm tra lại; không nhất thiết chạy lại generation hình.
- Sửa caption → chỉ invalidation delivery metadata/social review liên quan.
- Approve luôn lưu reviewer, target revision/hash, thời điểm và issues; trạng thái “approved” chưa có asset chỉ là planning acknowledgement.

Đây là invalidation theo dependency, không phải tự xóa media hoặc tự sinh lại mọi thứ.

## 5. Bổ sung về timeline, phụ đề và âm thanh

Tiếp tục các kết quả đã xác nhận: lịch timelapse 60s bị generator trừ overlap còn 57.2s; ASS centisecond carry lỗi; chia câu có thể tạo cue 0s; VO thiếu pad/trim và alignment thực. Những số này là kiểm tra hàm nguồn, chưa phải phép đo phim render.

Một điểm bổ sung: label/sub dùng mốc scene gốc, trong khi timelapse dựng `xfade` làm mốc cut dịch sớm. Các mốc subtitle, end-card và QC sampling phải được tính từ **timeline render sau transition**, không lấy lại startSec của kế hoạch. Nếu cần end-card đủ 3s, phải phân biệt 3s source với 3s được thấy trong timeline sau overlap.

`tpad=stop_mode=clone` giúp đủ runtime bằng cách giữ frame cuối; không thay thế footage diễn xuất còn thiếu. Reframe/crop và giữ/bỏ source audio phải là edit decision có version. “Nhạc rất nhỏ” hoặc “beat luôn dưới lời” cần kiểm tra bằng nghe/đo nguồn và mix, không chỉ một hệ số volume.

## 6. Handoff có thể dùng lại

Gói nguồn xuất `production-pack.md`, prompt, `labels.ass`, `subs.ass`, `build.sh`; nhận `canhN.mp4`, `vo-canhN.mp3`, `beat.mp3`. Điều đáng giữ là **hợp đồng đầu vào/đầu ra rõ**.

Handoff mới cần ID ổn định và manifest: project/scene/shot/take, source asset/hash, media metadata, reference/script versions, selected take, source handles, rights status, subtitle/audio files, timeline revision và output profile. Số thứ tự filename chỉ để tiện đọc; re-order shot không được làm mất mapping asset.

Draft planning pack xuất được trước production. Final package chỉ được gắn final sau asset readiness, render success và QC đúng revision. Media thiếu phải nằm trong missing-inputs, không bị thay gradient/clone-frame mà vẫn báo đủ chất lượng.

## 7. Cách đưa vào kiến trúc đã có

1. Giữ UX 8 bước như workspace planning; thêm story/scene beats theo profile cinema.
2. Import schema scenes của Director thành shot planning có provenance, không auto-approve media.
3. Thêm registry bibles/references, actual Assets/Takes và dependency graph.
4. Chuyển generator Bash thành typed timeline/render plan; worker nhận schema đã validate.
5. Gắn review/QC với revision; thêm stale state và hướng dẫn sửa đúng phạm vi.
6. Chạy pilot 90s/12 shot đã lập để đo hiệu quả thay đổi.

Các quy tắc có nguồn và cách áp dụng được ghi trong [director-knowledge-rules.json](director-knowledge-rules.json). Đây là dữ liệu đề xuất cho phát triển, chưa phải rule engine đã chạy trong app.
