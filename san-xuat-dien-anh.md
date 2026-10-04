# Sản xuất kiểu nhà sản xuất phim (kaizen 2026-10-03 từ phân tích VeoGenie)

VeoGenie là tool node-based dựng video AI hàng loạt: sheet nhân vật khóa một lần ở đầu graph
→ prompt từng shot → fan-out nhiều job sinh song song → gom về kho media. Cách làm đó chính là
pipeline điện ảnh thu nhỏ. Từ nay mỗi video chạy qua 4 giai đoạn tiền kỳ/quay/dựng/hậu kỳ với
cổng kiểm tra đặt tên rõ ràng — không còn làm theo cảm tính từng bước rời rạc.

## 17.1 Tiền kỳ (pre-production) — quyết định 70% chất lượng

- **Character bible (khóa casting một lần)**: trước keyframe đầu tiên, viết 1 đoạn mô tả nhân vật
  DUY NHẤT (tuổi, tóc, trang phục từng cảnh, đặc điểm nhận dạng) và **paste nguyên văn** vào mọi
  prompt keyframe — tương đương checkbox "Giữ nguyên nhân vật" của VeoGenie. Đổi 1 chữ trong
  bible = đổi nhân vật. (Trên Type không có snapshot_id → bible là cơ chế giữ liên tục duy nhất.)
- **Production board**: shot list viết dưới dạng bảng theo dõi, mỗi shot có trạng thái
  `keyframe ☐ → take ☐ → duyệt ☐ → ghép ☐`. Không shot nào được ghép khi chưa duyệt.
- **Coverage cho cảnh chốt**: hook (0–3s) và CTA (52–60s) luôn có 2 phương án (2 góc hoặc 2 action)
  để lúc dựng có cái mà chọn — như quay coverage trong phim.
- Prop/bối cảnh theo 7c; logic staging theo 7d — đều thuộc tiền kỳ, phải xong trên giấy trước khi generate.
- **Sản phẩm thật: verify hình dáng trước khi vẽ** (bài học 2026-10-03, video iPhone): khi video có
  sản phẩm thật (điện thoại, xe, máy móc...), KHÔNG tự vẽ theo trí nhớ — đối chiếu ảnh thật do hay
  gửi hoặc image search trước khi dựng keyframe. Sai chi tiết nhận diện (VD: cụm camera) là lỗi nặng,
  phải dựng lại toàn bộ. Nếu hay đã gửi ảnh thật thì dùng ảnh đó làm keyframe/composite, không
  generate lại sản phẩm. (Xem thêm 7e trong SKILL.md.)

## 17.2 Quay (production) — batch và dailies

- **Batch theo lớp**: sinh TẤT CẢ keyframes → verify tất cả (17.4) → mới sinh TẤT CẢ clip.
  Không cuốn chiếu từng cảnh (sai 1 cảnh cuối mới phát hiện thì đã muộn).
- **2 takes cho cảnh hero** (hook, CTA, cảnh có màn hình): sinh 2 biến thể motion khác nhau,
  lúc dựng chọn take đẹp nhất. Cảnh thường 1 take.
- **Dailies**: frame giữa mỗi clip = buổi xem dailies — kiểm tra biến dạng, logic 7d, màu sắc,
  thiết kế sản phẩm. Take nào lỗi → quay lại (sinh lại), không "để dựng rồi tính".
- **Motion có kiểm soát**: VeoGenie cho chỉnh "độ chuyển động" — bên mình mặc định motion NHẸ
  (camera chậm, 1 action). Motion mạnh = nguy cơ AI biến dạng tăng — chỉ dùng khi cảnh cần.

## 17.3 Dựng (edit) — chọn take và giữ liên tục

- **Pick take tốt nhất** cho mỗi cảnh (nhất là 2 takes của cảnh hero) rồi mới concat.
- **Continuity**: kiểm tra **quy tắc 180°** — trong cùng một không gian, camera không nhảy sang
  phía đối diện của trục hành động gây rối hướng nhìn. Màu sắc/ánh sáng các cảnh phải đồng tone
  (không cảnh vàng ấm kế cảnh xanh lạnh trừ khi có lý do kể chuyện).
- **Nhịp**: giữ checklist retention (mục 6 SKILL.md) — mỗi 3–8s có thay đổi có ý nghĩa;
  không để 2 cảnh liên tiếp cùng cỡ shot.

## 17.4 Hậu kỳ & QC 4 lượt (test screening)

QC theo đúng thứ tự, mỗi lượt một việc:
1. **Logic**: tay–mắt–vật, hướng màn hình (7d) — xem frame ranh giới các cảnh.
2. **Chữ**: sub không che chủ thể, label đúng chính tả, không tràn khung.
3. **Tiếng**: nghe toàn bộ — voiceover rõ, beat nhỏ hơn lời, không clipping.
4. **Kỹ thuật**: 1080x1920, đúng 60s (±0.5s), ≤100MB, file thật không symlink.

## 17.5 Failover khi job lỗi (học nguyên tắc từ VeoGenie)

VeoGenie tự chuyển tài khoản khi job lỗi — bên mình không có tài khoản/proxy Seedance để xoay
(generate qua media pipeline riêng, không qua web automation), nên áp dụng **nguyên tắc failover**
theo cách của mình: job lỗi → thử lại → hạ cấp, không bao giờ bỏ cảnh.

- **generate_video lỗi**: thử lại 1 lần với motion đơn giản hơn (bỏ action phức tạp, chỉ giữ camera
  chậm). Vẫn lỗi → fallback Ken Burns từ keyframe.
- **generate_image lỗi**: thử lại 1 lần với prompt rút gọn (bỏ chi tiết phụ).
- **TTS lỗi**: thử lại 1 lần → đổi voice dự phòng (vẫn giọng nam miền Bắc).
- **Batch theo đợt**: tối đa 4 job media song song mỗi lượt (giới hạn tool) — video 6 cảnh chia 2 đợt.
- **Ghi log**: cảnh nào đã retry/fallback ghi vào production board (17.1) để lúc QC biết take đó
  là bản hạ cấp, soi kỹ hơn.

## Ranh giới (không lấy từ VeoGenie)

- Các tính năng xoay proxy / chuyển tài khoản khi lỗi / multi-profile Dola là kỹ thuật lách giới
  hạn của tool bên thứ ba — **không áp dụng** vào pipeline của mình.
- Quản lý API key vẫn qua AI Pro của Kiemtien2026 (mã hóa server-side), không lưu key local.
