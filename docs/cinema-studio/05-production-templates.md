# Mẫu sản xuất có thể chuyển thành form app

## 1. Project brief

```yaml
project_id: generated
mode: cinema | social | timelapse
title:
audience:
intent:
logline:
genre_mood:
target_runtime_frames:
frame_rate: { numerator: 24, denominator: 1 }
aspect_ratio:
language:
story_invariants:
reference_assets: []
delivery_profiles: []
budget: { currency: null, hard_cap: null }
missing_inputs: []
```

Brief cinema cần conflict/stakes/turn/payoff. Brief social thêm hook/CTA. Chưa có budget không dispatch generation tính phí. Mood reference có provenance, không biến thành lệnh sao chép nguyên phim/shot sequence.

## 2. Scene beat

| Trường | Nội dung cần viết |
|---|---|
| Scene/location/time | Không gian, thời điểm và reference version |
| Character wants/obstacle | Ai muốn gì, ai/cái gì cản trở |
| Starting state | Quan hệ/cảm xúc/prop ở đầu scene |
| Turn/action | Điều gì làm scene đổi hướng |
| Ending state | Thay đổi đã đạt, nối scene sau |
| Dialogue/subtext | Lời nói và điều nhân vật thực sự muốn |
| Coverage | Master, reverse, reaction, insert cần có |

## 3. Shot sheet

```yaml
shot_id: S07
scene_id: SC01
story_objective: phong bì đổi chủ, A bắt đầu do dự
planned_placement_frames: 120
source_handles_frames: { head: 12, tail: 12 }
framing: insert
lens_intent: cận vừa, thấy tay và mép bàn, không crop điểm tiếp xúc
camera: locked, ngang mặt bàn
blocking: B phía phải đưa phong bì; A phía trái nhận bằng tay phải
performance: B chậm, dừng một nhịp; A ban đầu né rồi nhận
lighting: ánh cửa sổ mềm, practical ấm phía sau
reference_versions: { cast: v1, location: v1, envelope: v1 }
continuity_in: phong bì đóng trong tay B
continuity_out: phong bì đóng trong tay phải A
required_audio: áo sột soạt, giấy chạm bàn, room tone
risks: [hand_contact, occlusion, prop_identity]
generation_capability: video_from_reference_or_manual_import
negative_constraints: không đổi số ngón/tay, không đổi màu phong bì
quality_fallback: quay thật insert hoặc đổi blocking sau review
```

Handles là mục tiêu editorial, capability provider phải đủ hoặc kế hoạch cần đổi. Bible/reference giảm sai lệch, không bảo đảm tuyệt đối.

## 4. Prompt compiler

Input có cấu trúc → project style/version → cast/location/prop references → staging/performance → camera/light → duration/aspect capability → negative constraints → adapter syntax. Lưu compiled prompt, input hashes và model/version. Không đưa đường API key hoặc policy nội bộ vào prompt.

Khi reviewer yêu cầu sửa, tạo prompt revision có `change_reason`, giữ take cũ để so sánh. Model không hỗ trợ field nào thì adapter báo unsupported, không âm thầm bỏ yêu cầu.

## 5. Take board và nhận media ngoài

| Shot | Take | Nguồn | Job/asset | Review | Chọn | Chi phí | Lý do |
|---|---|---|---|---|---|---|---|
| S07 | T01 | AI/manual | ID + hash | unreviewed | false | estimate/actual | — |

Handoff tối thiểu: project/scene/shot/take/version, filename hoặc upload ID, reference version, script revision, fps/dimensions/audio thực, rights record và ghi chú. Không đoán thứ tự từ `canh1.mp4` khi manifest khác. File đã ingest mới có metadata authoritative.

## 6. Review có timecode

```yaml
issue_id:
target_take_or_render_revision:
frame_in:
frame_out:
category:
severity: blocker | major | minor
observation:
desired_result:
proposed_change:
reviewer:
status: open | fixed | accepted_with_reason
```

QC tự động trả metric/confidence; reviewer quyết định. Không có khả năng xem/nghe thì status `needs_human_review`, không `approved`.

## 7. Gates sản xuất

| Gate | Yêu cầu |
|---|---|
| G0 Brief/script | Ý đồ, story beats, scope, quyền/reference và budget policy |
| G1 Design | Bibles, blocking, shot/coverage, continuity và capability phù hợp |
| G2 Pilot | 1–3 shot rủi ro xem cả clip, cost/quality được đo |
| G3 Dailies | Mọi take chọn có review; đủ coverage; fallback được nêu |
| G4 Picture lock | Timeline revision cố định, cut/continuity/story được duyệt |
| G5 Finish/delivery | Full screening, audio/sub/color/technical QC, artifact checksum và manifest |

QC issue mở mức blocker chặn gate tương ứng. Nếu thay picture lock, invalidation render/mix có lý do, không tiếp tục dùng báo cáo QC cũ.

## 8. Deliverable checklist

- Film master hoặc playback file theo profile.
- Review proxy có revision label.
- Subtitle sidecar; burn-in chỉ theo profile.
- Dialogue/ambience/SFX/music stems khi được yêu cầu.
- Asset/take manifest, timeline revision và editorial package nếu enabled.
- QC report, nguồn/rights status, native/upscale/degraded flags.
- Social adaptation/caption/disclosure checklist chỉ khi có đích social và policy đã kiểm chứng.

## 9. Kaizen record

```yaml
iteration:
baseline_take_or_workflow:
problem_category:
evidence_frames_or_metrics:
hypothesis:
changed_variables:
unchanged_controls:
cost_before_after:
quality_before_after:
decision: adopt | reject | more_evidence
followup:
```
