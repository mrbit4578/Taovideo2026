# TikTok Viral Video — Skill tạo video/hình ảnh cho hay (v3)

Dùng khi hay ra lệnh dạng "tạo cho tôi video/hình ảnh với prompt ...", mục tiêu đăng TikTok để viral.
Nguồn tri thức: `content-playbook-2026.md` + `he-thong-video-faceless-tu-nguon-viral.md` + platform Kiemtien2026.
Tổng hợp từ toàn bộ quá trình làm việc 2026-09-28 → 2026-10-03: 7 video đã bàn giao (giấc ngủ, người cao tuổi, hóa đơn, iPhone 18 Pro Max v1/v2/v3...), pipeline nhà sản xuất phim (từ phân tích VeoGenie), failover, quy trình tách CapCut.

## 0. Chạy trên Type (đọc trước)

Skill gốc viết cho Muse. Trên Type, ánh xạ công cụ như sau:
- `media.generate_image` → tool `generate_image` của Type (keyframe, thumbnail, cover).
- `media.generate_video` (clip AI 10s) → Type không có sinh clip AI chuyển động thật. Thứ tự ưu tiên: (a) hay sinh clip bằng CapCut Pro/Seedance theo quy trình tách CapCut (`references/capcut-workflow.md`) — **mặc định**; (b) Ken Burns/motion từ keyframe bằng ffmpeg trong sandbox; (c) video artifact của Type (`create_video_artifact` / `render_video_artifact`) cho video dạng motion graphics.
- `snapshot_id` → không có; giữ liên tục bằng **character bible** paste nguyên văn vào mọi prompt (`references/san-xuat-dien-anh.md`).
- TTS `/opt/hatch/bin/tts` và file beat `~/workspace/user/files/...` không có sẵn trên Type → hay gửi file giọng đọc (CapCut) và file beat vào thread; Muse/AI dựng bằng ffmpeg trong sandbox.
- Ghép, phụ đề, mix tiếng: ffmpeg trong managed sandbox, upload MP4 thành phẩm vào thread.

## 0b. Cách làm việc với hay (quy ước đã chốt)

- **hay bắn task mới = trả lời câu hỏi cũ.** Không hỏi lại, làm luôn task mới.
- Báo cáo **ngắn gọn** bằng tiếng Việt; quyết định lớn hỏi qua options một chạm.
- File hay upload kèm "từ giờ" = **default bền vững** — ghi nhớ ngay trong ngày.
- **Không tự ý** đăng bài, gửi tin, deploy production Kiemtien2026 — chỉ làm trên bản sao workspace.
- File bàn giao: **file thật** (không symlink — chat không theo symlink), `chmod 644`, gửi bằng `![tên](sandbox://workspace/your_files/<file>)` đặt trên dòng riêng.
- Mỗi lần bàn giao video: đính kèm caption + **nhắc bật nhãn nội dung AI** khi đăng.

## 1. Brief nhanh (tự trả lời trước khi generate)

Mỗi video chỉ có **một mục tiêu chính**. Tự điền từ prompt của hay, thiếu thì hỏi 1 câu:

- Giúp **ai** cụ thể? (không làm "cho tất cả mọi người")
- Giúp họ việc gì / giải quyết nỗi đau nào?
- **Góc nhìn duy nhất** của video này là gì? (không ôm đồm)
- Bằng chứng / minh họa nào sẽ dùng?
- CTA duy nhất là gì? (theo dõi / lưu / bình luận / link bio)

## 2. Bối cảnh nền tảng Kiemtien2026 — phải khớp

- **Triết lý faceless**: original-first, permission-first, evidence-first. Không tải/re-upload video nguồn, không đọc lại lời nguồn. Nguồn viral chỉ là **tín hiệu** về chủ đề/nhu cầu khán giả.
- **G0 originality (tự kiểm)**: bỏ video nguồn ra video vẫn đứng độc lập? Hook/cấu trúc/kết luận là của mình? Không dùng lại câu chữ/montage/nhạc/nhịp dựng của nguồn? → trượt thì đổi angle.
- **Chuẩn kỹ thuật**: dọc **1080x1920** (9:16), MP4 H.264, ≤100MB (giới hạn TikTok Direct Post).
- **AI disclosure (TikTok 2026)**: hình/âm thanh/video AI **chân thực** → bắt buộc gắn nhãn AI khi đăng. Không mô phỏng người thật (mặt/giọng/likeness) khi chưa có consent.
- **Caption contract**: 1 HOOK + 2–3 câu ngắn + 1 CTA + 5–8 hashtag.
- **Series > video lẻ**: format lặp lại tạo brand bền vững.

## 3. Khả năng tạo media (gốc Muse — xem mục 0 cho Type)

- Clip video AI: mỗi clip ~**10 giây**. Nhận text hoặc ảnh + text (image-to-video). Không nhận audio đầu vào.
- Ảnh tĩnh: dùng làm **keyframe** rồi animate, hoặc làm **thumbnail/cover** TikTok.
- Không xem được video đã tạo — trích frame kiểm tra (ffmpeg) khi cần.

## 4. Công thức HOOK (quyết định 80%)

Hook giúp **đúng người** nhận ra ngay "cái này dành cho vấn đề của mình" — không phải giật tít.
Công thức: **[Nỗi đau / kết quả] + [đối tượng] + [lời hứa cụ thể]**

6 dạng hook (viết 5–10 bản, chọn bản **rõ nhất**):
1. **Kết quả**: "Sau 30 ngày, đây là 3 thay đổi rõ nhất…"
2. **Sai lầm**: "Nếu video tụt view ngay giây đầu, kiểm tra điều này."
3. **Đối lập**: "Nhiều view chưa chắc có khách hàng."
4. **Câu hỏi cụ thể**: "Vì sao bạn đăng đều nhưng không ai lưu bài?"
5. **Demo**: mở bằng kết quả trước–sau.
6. **Câu chuyện**: một tình huống thật, một thất bại, một quyết định khó.

Trong video: hook bằng **lời + hình + chữ màn hình** phải cùng một thông điệp.

## 5. Khung video ngắn 15–60s (timeline chuẩn)

| Đoạn | Nội dung |
|---|---|
| 0–3s | HOOK (lời + hình + chữ, cùng thông điệp) |
| 3–10s | Định hướng: người xem sẽ nhận được gì |
| 10–45s | 2–3 ý, mỗi ý **một** minh họa/bằng chứng |
| 45–55s | Tóm tắt một câu |
| 55–60s | **Một** CTA duy nhất (không CTA kép) |

Mỗi cảnh ≈ 10s → video 30s = 3 cảnh, 60s = 5–6 cảnh.

## 6. Checklist retention (giữ người xem)

- [ ] Giá trị đầu tiên xuất hiện **trước giây 10–15**
- [ ] Mỗi **3–8 giây** có thay đổi có ý nghĩa (góc quay, minh họa, chữ màn hình, ví dụ)
- [ ] Mỗi đoạn một ý + một cầu nối sang đoạn sau (câu hỏi, con số tiếp theo)
- [ ] Không giới thiệu bản thân dài dòng ở đầu
- [ ] Kết thúc gợi xem lại (loop) hoặc mở phần tiếp theo

## 7. Playbook chân thực (realism)

- **Ảnh trước, video sau**: keyframe photorealistic cho mỗi cảnh rồi animate (image-to-video) — chân thực hơn text-to-video thuần.
- **Bố cục dọc**: chủ thể ở giữa khung, chừa lề trên/dưới cho caption TikTok và UI (like/comment che bên phải).
- **Chuyển động đơn giản**: camera push-in/pull-out chậm, chuyển động nhẹ. Tránh cận mặt động mạnh, bàn tay chi tiết (AI hay biến dạng).
- **Không chữ trong ảnh/video AI**: AI render chữ rất xấu — chèn chữ bằng ffmpeg (file `.ass`, xem mục 15). Chữ trên màn hình hay yêu cầu viết rõ trong prompt → chèn vào Label sub, **không** bake vào clip AI.
- **Âm thanh**: mô tả mood khớp nội dung.
- **Nhất quán**: character bible giữ nhân vật/màu sắc/phong cách xuyên suốt + cho cả series.

## 7b. Dựng cảnh kiểu đạo diễn (mặc định từ 2026-10-02)

Mỗi cảnh là **clip có chuyển động thật** (người/cảnh vật/camera di chuyển như quay thật); Ken Burns chỉ là fallback. Clip AI thường ra 704x1248, 24fps → upscale lên 1080x1920 khi ghép; **bỏ track audio AI** (chỉ dùng voiceover + beat).

Trước khi generate, viết **shot list** cho từng cảnh 10s:
- **SHOT**: toàn / trung / cận cảnh — chủ thể giữa khung dọc.
- **CAMERA**: push-in / pull-out / pan / tilt — **chậm**, một chuyển động mỗi cảnh.
- **ACTION**: chuyển động duy nhất trong khung (rơi, vỡ, bước đi, lật trang...).
- Prompt motion = CAMERA + ACTION, ngắn gọn; không chữ trong video AI; không mô phỏng người thật khi chưa có consent.

## 7c. Cast & world — người, cảnh vật, đồ vật, con vật

Video phải có **sức sống**. Mỗi cảnh định nghĩa đủ 4 yếu tố:
- **SUBJECT (ai)**: nhân vật hư cấu do AI tạo, diễn xuất tự nhiên. Không mô phỏng người thật khi chưa có consent.
- **ENVIRONMENT (ở đâu)**: cảnh vật cụ thể — đường phố, văn phòng, sân bay, quán cà phê, thiên nhiên...
- **PROP (vật gì)**: đồ vật kể chuyện — điện thoại, hợp đồng, vali, tách cà phê...
- **ANIMAL (nếu hợp)**: chó, mèo, chim... tạo sức sống cho cảnh đời thường.

Quy tắc:
- Cảnh chỉ có giấy tờ/đồ vật → thêm **bàn tay hoặc người đang thao tác**.
- Cảnh địa điểm → thêm **người/con vật ở hậu cảnh mờ**.
- Cảnh trừu tượng (bảng so sánh, checklist) → neo bằng vật thể thật hoặc bàn tay tương tác.
- Prompt motion: người → "natural human movement, realistic body physics, subtle facial expression"; con vật → "natural animal behavior"; cảnh vật → "ambient life in background".
- Xen kẽ toàn/trung/cận; không để 2 cảnh liên tiếp cùng cỡ shot nếu không có lý do kể chuyện.
- Dùng trung cảnh/cận vừa cho người; tránh cận mặt động mạnh và bàn tay chi tiết.

## 7d. Logic vật lý — staging phải khả thi

Mỗi keyframe và shot list phải vượt qua **bài kiểm tra logic** trước khi generate:

- **Tay – mắt – vật phải khớp**: tay gõ bàn phím → màn hình đối diện mặt người; tay cầm/chỉ vật → vật trong tầm tay; mắt nhìn vào vật đang tương tác.
- **Viết rõ quan hệ không gian trong prompt**: thay "woman typing on laptop" bằng "woman sitting directly in front of the laptop, screen facing her, both hands on the keyboard".
- **Đồ vật có chỗ đứng**: đặt trên mặt phẳng hợp lý, không lơ lửng; kích thước tương đối đúng; bóng đổ nhất quán với nguồn sáng.
- **Motion không phá logic**: "hands stay on the keyboard while typing".
- **Quy tắc màn hình**: màn hình (điện thoại/laptop/TV) phải ĐỐI DIỆN người đang xem nó. Không vẽ người "đang gọi video/xem" một màn hình quay về phía camera.
- **Cảnh gọi video / xem màn hình** — chỉ dùng 1 trong 3 bố cục:
  1. **Over-the-shoulder**: máy quay sau vai → thấy nội dung màn hình (vai/tóc mờ tiền cảnh).
  2. **Chính diện người xem**: thấy mặt họ nhìn vào màn hình → chỉ thấy LƯNG thiết bị.
  3. **PiP**: mặt người xem + khung nhỏ ở góc hiện nội dung.
- **Khóa hướng màn hình trong prompt**: viết "screen facing toward her" — "in front of her" không đủ.
- **QC soi logic riêng**: dành một lượt chỉ kiểm tra tay/mắt/vật, đặc biệt **hướng nhìn ↔ hướng màn hình**.

## 7e. Sản phẩm thật — không vẽ lại theo trí nhớ (bài học iPhone 18 Pro Max 2026-10-03)

- Video có sản phẩm thật (điện thoại, xe, máy móc...): **verify hình dáng** qua ảnh hay gửi hoặc image search **trước** khi dựng keyframe. Mô tả chi tiết đặc điểm nhận diện (VD: cụm camera tràn ngang) + đưa ảnh ref vào prompt keyframe.
- Image-to-video có thể **tự vẽ lại sản phẩm** thành thiết kế khác giữa chừng → kiểm tra frame giữa mỗi clip; sai → retry với motion gần như tĩnh + lệnh giữ nguyên thiết kế; vẫn sai → **Ken Burns từ keyframe đã duyệt** để giữ 100% fidelity.
- Chữ hay yêu cầu hiện trên màn hình: chèn vào Label sub, không bake vào clip AI.

## 8. Quy trình thực hiện (mỗi lệnh)

1. **Brief** (mục 1) — thiếu thì hỏi hay 1 câu.
2. **Hook** — viết 5–10 bản theo mục 4, chọn 1.
3. **Chia cảnh** — theo timeline mục 5, mỗi cảnh ≈ 10s; viết shot list (7b, 7c) + character bible.
4. **Keyframe** — `generate_image` mỗi cảnh: photorealistic, 9:16, chủ thể giữa khung.
   ⚠️ **BẮT BUỘC xem lại từng keyframe và kiểm tra logic vật lý (7d) TRƯỚC khi animate.** Cảnh có màn hình: nội dung chỉ nằm trên mặt màn hình, màn hình đối diện người xem.
5. **Animate** — clip động thật (CapCut/Seedance do hay sinh, hoặc công cụ khả dụng); fallback Ken Burns bằng ffmpeg. Bỏ audio AI, upscale lên 1080x1920.
   ⚠️ **Trích 1 frame giữa mỗi clip trước khi ghép** — clip biến dạng/vẽ sai sản phẩm thì sinh lại, không ghép.
6. **Ghép** — ffmpeg: nối clip → scale/pad 1080x1920 → H.264 CRF 20.
7. **Lời đọc + phụ đề + beat** — theo `references/loi-doc-phu-de-mix.md` (mặc định cho mọi video). Kỷ luật trim: rút gọn lời vừa slot, **giữ nguyên mọi claim/disclaimer**, báo rõ chỗ trim, offer bản đầy đủ.
8. **Caption** — hook + 2–3 câu + CTA + 5–8 hashtag tiếng Việt.
9. **Checklist bàn giao** (mục 9) + QC 4 lượt rồi mới gửi.

Dự án dài/nhiều cảnh: áp dụng pipeline nhà sản xuất phim trong `references/san-xuat-dien-anh.md` (character bible, production board, 2 takes cảnh hero, QC 4 lượt, failover).

## 9. Checklist trước khi bàn giao

- [ ] Đúng một mục tiêu, một CTA?
- [ ] Hook rõ vấn đề/kết quả trong 3s đầu?
- [ ] Giá trị đầu tiên trước giây 15?
- [ ] Không claim sức khỏe/tài chính chắc nịch chưa kiểm chứng?
- [ ] Không dùng lại nhạc/hình/lời của nguồn nào?
- [ ] Nội dung AI chân thực → đã ghi chú "cần gắn nhãn AI khi đăng"?
- [ ] Caption có từ khóa tự nhiên + hashtag?
- [ ] File MP4 1080x1920, ≤100MB, file thật (không symlink)?
- [ ] QC hình: trích frame đầu, giữa, cuối và **ranh giới các cảnh** — bố cục, sub không che chủ thể, không frame trắng/sai cảnh.
- [ ] **Logic vật lý**: tay/mắt/vật khớp nhau?
- [ ] Sản phẩm thật (nếu có): đúng thiết kế trong mọi cảnh?

## 10. Ghi chú đăng bài (đính kèm mỗi video)

- Giờ đăng gợi ý: sáng 7–9h, trưa 11–13h, tối 19–22h (khung khán giả mục tiêu online).
- 60 phút đầu: kiểm tra caption/phụ đề → ghim 1 bình luận đặt câu hỏi → trả lời bình luận đầu bằng thông tin hữu ích → ghi câu hỏi mới vào kho ý tưởng.
- Nhắc gắn nhãn AI + bật Commercial Content Disclosure nếu có quảng cáo/affiliate.
- Theo dõi phễu: reach → % dừng 3s → % xem hết → saves/shares/comments → profile visits.

## 11. Tạo hình ảnh (thumbnail/cover)

Hỏi rõ dùng làm **cover TikTok** (9:16, chữ to đọc được trên điện thoại, chủ thể giữa khung, chừa lề UI) hay **ảnh minh họa**. Cover tốt = hứa đúng điều video chứng minh được; không mặt giả/quote giả (clickbait bị hạ phân phối).

## 12. Video timelapse công trình (format "Nể phục")

Before → after, 1 góc camera cố định. Đọc `shot-list-30-keyframes.md` trong bộ skill — 30 keyframe kèm prompt điền sẵn, chia 8 pha theo % thời lượng, prompt khóa camera + 5 luật sắt.
Hỏi hay 4 ô: [BỐI CẢNH] [VẬT NEO] [KIẾN TRÚC] [CHỮ] + thời lượng (45–60s hay 5 phút).

## 13. Character Swap

Khi cần cùng 1 nhân vật xuyên suốt các clip hoặc đưa nhân vật vào clip có sẵn: đọc `references/character-swap.md`. **Bắt buộc consent văn bản** của người thật; không consent → không làm.

## 14. Guardrails (không bao giờ phá)

- Không tái tạo nguyên bản nội dung có bản quyền (nhạc, hình, lời).
- Không claim y tế/tài chính chắc nịch — hạ thành ý kiến hoặc bỏ.
- Không mô phỏng người thật (đặc biệt người dưới 18 tuổi) khi chưa có consent.
- Không engagement bait rỗng ("thả tim nếu đồng ý") — nền tảng hạ phân phối.
- Không hứa hẹn thu nhập/lợi nhuận chắc chắn.
- Prompt của user giữ nguyên ý — chỉ mở rộng kỹ thuật, không đổi nội dung họ yêu cầu.

## 15. Lời đọc + phụ đề (mặc định cho mọi video)

Đọc `references/loi-doc-phu-de-mix.md` ở bước 7 của mọi video.

## 16. Quy trình tách CapCut

Đọc `references/capcut-workflow.md` khi hay sinh asset bằng CapCut.

## 17. Sản xuất kiểu nhà sản xuất phim

Đọc `references/san-xuat-dien-anh.md` cho dự án dài/nhiều cảnh.

## Tài liệu tham chiếu (đọc khi cần)

- `references/loi-doc-phu-de-mix.md` — mục 15: lời đọc, phụ đề `.ass`, mix beat + ducking, kỷ luật trim.
- `references/capcut-workflow.md` — mục 16: phân công hay (CapCut) / AI (kịch bản + dựng), handoff contract.
- `references/san-xuat-dien-anh.md` — mục 17: tiền kỳ/quay/dựng/hậu kỳ, QC 4 lượt, failover.
- `references/character-swap.md` — mục 13: đổi nhân vật MiniMax-H3 LoRA.
- `shot-list-30-keyframes.md` — mục 12: bảng 30 keyframe timelapse công trình.
