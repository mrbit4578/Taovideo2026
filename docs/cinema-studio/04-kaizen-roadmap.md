# Lộ trình Kaizen và nghiệm thu

Các mốc là thứ tự phụ thuộc, chưa cam kết ngày hoàn thành vì chưa có workload, nhân sự, provider và ngân sách. Đầu ra mỗi mốc phải kiểm chứng được. Không chi phí generation trong lần audit này.

## 1. Backlog triển khai

| Mốc | Công việc và module chịu trách nhiệm | Hoàn thành khi |
|---|---|---|
| M0 — baseline | Chuẩn hóa knowledge registry, references/version, source manifest; sandbox app | Khôi phục bản gốc được; tài liệu canonical phân biệt historical/verified |
| M1 — nền tảng | Auth standalone, workspace ACL, asset lifecycle, project revision, save queue; sửa exporter cũ nếu tiếp tục dùng | Hai tenant cách ly; save conflict/recovery rõ; không xóa asset còn tham chiếu |
| M2 — tiền kỳ | Brief, script/scene, cast/world, shot sheet, coverage, storyboard/animatic | Có kế hoạch pilot 12 shot, bible version, continuity và shot objectives |
| M3 — production | Ingest/proxy, take board, adapter registry, queue, retry/reconcile, budget ledger | Worker restart/retry không sinh job/tính tiền trùng; có asset thật xem được |
| M4 — dựng/hậu kỳ | Timeline frame-based, audio tracks, subtitle timing, render snapshots, QC | Render 90s, reload không mất media/timeline; trim/audio khớp trên preview và final |
| M5 — pilot điện ảnh | Quay/sinh 1–3 shot khó → review → tạo coverage còn lại → dựng/mix → screening | Pilot 90s đạt rubric, có chi phí và tỷ lệ take dùng được |
| M6 — hoàn thiện MVP | Review/timecode, export packages, smoke/E2E, backup/recovery | Một người khác tạo/nhận media và hoàn thành phim từ app theo hướng dẫn |
| M7 — series/tập | Bibles theo series, episode states, continuity cross-episode, workload dài | Phim 3–5 phút đạt trước; thời lượng tập và capacity/budget có benchmark |

## 2. Ưu tiên phát triển gần nhất

1. Chọn boundary standalone; tạo repo/version-control của app mới dựa baseline đã giải nén.
2. Viết schema workspace/project/revision/asset/scene/shot/take; ACL server và lifecycle asset.
3. Làm vertical slice: import một clip thật → đặt timeline → render snapshot bằng worker → probe → review/download. Slice phải chạy được trước khi thêm nhiều nút AI.
4. Thêm writers room + production board; lập pilot.
5. Đấu một provider qua job contract sau capability smoke test; thêm provider thứ hai khi có lý do chất lượng/availability.

Các lỗi A01–A06 có acceptance tests trong backlog; không cần viết test cho mọi thay đổi chữ/CSS. Test backend auth, revision và job idempotency là bắt buộc vì rủi ro dữ liệu/tiền.

## 3. Pilot đại diện: “Bức thư cuối”

**Giả định thử nghiệm:** phim hư cấu 90 giây, 16:9, 24fps; hai nhân vật trưởng thành hư cấu, một quán cà phê vắng vào chiều mưa, một phong bì. Một người định rời đi, người kia đưa thư; quyết định cuối thể hiện bằng hành động. Không dùng người thật hoặc sản phẩm thương mại làm reference mặc định.

**Beat:** thiết lập chia xa → phong bì xuất hiện → phản ứng/đắn đo → mở thư → lựa chọn ở lại. Dialog ít để tập trung performance, blocking và sound; không bắt buộc VO hay CTA.

| Shot | Thời lượng kế hoạch | Chức năng | Thử thách chính |
|---|---:|---|---|
| S01 wide exterior/window | 6s | Establish mood | Mưa, không gian và ánh sáng |
| S02 medium two-shot | 8s | Đặt quan hệ/trục hành động | Identity hai người, blocking |
| S03 insert envelope | 4s | Introduce prop | Tay–vật, fidelity |
| S04 OTS A | 10s | A muốn rời đi | Eyeline, subtext |
| S05 reverse OTS B | 10s | B giữ A bằng lá thư | Axis và performance |
| S06 close reaction A | 6s | Hesitation | Biểu cảm và temporal stability |
| S07 handoff insert | 5s | Chuyển phong bì | Contact/occlusion, vật lý |
| S08 profile/medium | 8s | A dừng lại | Match-on-action |
| S09 opening letter insert | 5s | Decision point | Hands, prop state; chữ hậu kỳ nếu cần |
| S10 close A | 10s | Emotional change | Diễn xuất, reaction timing |
| S11 two-shot | 10s | A ngồi lại | Costume/space continuity |
| S12 wide hold | 8s | Payoff | Nhịp, room tone, ending |

Tổng 90s = 2160 frame. Đây là thời lượng placement **không overlap transition**; audio có thể overlap J/L cut. Nếu thêm dissolve hoặc card, phải cập nhật timeline frame budget. Cần handles tùy cut/transition; planned source duration có thể dài hơn placement, không ép model sinh đúng số giây shot.

**Pilot trước batch:** thử S06 biểu cảm, S07 tay trao phong bì, S04/S05 reverse/identity. Nếu không đạt, giảm độ khó staging hoặc thay bằng footage quay thật; ghi rõ thay đổi phương án. Không tiếp tục tốn tiền cả phim trên phương án chưa qua gate.

## 4. Rubric chất lượng

Đề xuất chấm 1–5: 1 lỗi rõ/cần làm lại, 3 dùng được nhưng còn điểm yếu, 5 đạt ý đồ đã thống nhất.

| Chiều đánh giá | Trọng số | Người duyệt kiểm tra |
|---|---:|---|
| Story/cảm xúc | 25% | Hiểu động cơ và thay đổi cuối, payoff có sức nặng |
| Diễn xuất/blocking | 20% | Eyeline, biểu cảm, hành động và phản ứng tự nhiên |
| Continuity | 20% | Nhân vật/costume/prop/time/axis đúng xuyên shot |
| Camera/light | 15% | Bố cục, ánh sáng có lý do, movement phục vụ beat |
| Edit/rhythm | 10% | Cuts/handles/nhịp và reaction rõ, không kéo dài máy móc |
| Sound | 10% | Thoại rõ, không lỗi sync/noise/clipping, ambience/score phù hợp |

Ngưỡng thử nghiệm đề xuất: điểm có trọng số ≥4/5, không chiều nào dưới 3/5 và **không lỗi blocker**: sai identity nặng, vật lý làm đứt truyện, mất audio/dialogue, frame đen ngoài ý đồ, thiếu quyền/asset, metadata sai profile. Human screening quyết định sáng tạo; technical QC không tự chấm diễn xuất. Ngưỡng được hiệu chỉnh sau pilot, không gọi là chứng nhận Hollywood.

## 5. Ngân sách đo được

Không gán giá provider từ tài liệu cũ. Trước dispatch hiển thị đơn vị tính, giá tra tại thời điểm dùng, estimate và reservation. Chi phí gồm LLM, image/video, speech, retry, storage/egress và render.

Với target T giây và usable ratio `u` = tổng số giây footage sử dụng duy nhất / tổng số giây footage sinh, lượng video cần sinh xấp xỉ `T/u`. Ví dụ T=90, u=0.25 → 360s generation; còn cần coverage/handles theo shot nên chỉ là mô hình sơ bộ. Không gọi 90s timeline = chỉ trả 90s generation.

Chi phí/giây duyệt = tổng chi phí attempts liên quan / số giây footage duyệt duy nhất. Chi phí/giây thành phẩm = toàn chi phí production/render / runtime phim. Nếu chưa có take duyệt, metric để null, không chia cho 0. Ghi estimate và bill thật riêng.

Budget policy cần user đặt cap trước job tính phí; audit không đặt cap thay user. Soft cap cảnh báo, hard cap chặn dispatch mới; job đã dispatch/outcome_unknown phải giữ reservation đến đối soát. Concurrency dùng provider quota và phép đo.

## 6. Vòng lặp Kaizen

Mỗi iteration: **Plan → Produce → Review → Measure → Change → Validate**. Chỉ thay một nhóm biến trong cùng thử nghiệm: reference/identity, staging, camera, motion hoặc audio; giữ baseline để biết thay đổi giúp gì.

Lưu issue theo `identity_drift`, `physics`, `eyeline`, `prop_state`, `axis`, `performance`, `camera`, `light_color`, `edit`, `audio_sync`, `subtitle`, `technical`, `rights`. Liên kết prompt/reference/model version và shot/take cụ thể.

Metrics: first-pass approval, usable duration ratio, retries/shot, cost/approved second, render success, queue latency, issue rate và số phút sửa tay. Sau 3 vòng, chọn preset theo dữ liệu chứ không theo take đẹp nhất đơn lẻ. Social retention là metric phân phối riêng, không thay điểm điện ảnh.

## 7. Bộ kiểm tra khi triển khai

- ACL: tenant isolation, membership changes, read-only, signed asset access, share snapshot.
- Persistence: save conflict, reload, recovery, upload reorder/delete, asset GC/reference.
- Jobs: duplicate callback, network timeout sau dispatch, restart lease, cancellation, cost cap, outcome reconciliation.
- Timeline/render: rational fps, trims/handles, transitions, missing assets, immutable snapshots, audio pad/trim, final metadata/duration.
- Media: xem toàn pilot, nghe full mix, subtitle glyph/wrap/safe area, color/identity/axis review.
- Handoff: relink, asset checksum, OTIO round-trip khi enabled, stems và manifest.

Không giả định các kiểm tra này đã pass trong audit; kết quả audit thực tế nằm tại `06-validation.md`.
