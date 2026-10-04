# Quy trình tách CapCut (hay tự sinh, Muse lo kịch bản + dựng)

Chốt 2026-09-30. Bối cảnh: key Gemini hết quota free; ExperientialLabs/Apmix/Muse chỉ chat-only;
CapCut không có API công khai → tách pipeline: hay dùng CapCut Pro (web/app) để sinh
giọng đọc + clip/ảnh AI, Muse viết kịch bản và dựng video cuối bằng ffmpeg.

## Phân công

- **hay** (CapCut Pro): sinh **giọng đọc** (TTS "Chuyển văn bản thành lời nói", chọn voice
  tiếng Việt) + **clip/ảnh AI** (Seedance / AI image) theo từng cảnh trong kịch bản.
- **Muse**: viết **kịch bản lời đọc tiếng Việt theo từng cảnh** (+ prompt ảnh/clip cho từng
  cảnh để hay paste vào CapCut) → nhận asset từ hay → **dựng** 1080x1920 theo đúng
  default `loi-doc-phu-de-mix.md` (voiceover + sub burn-in + beat 0.15 + ducking, tắt ambient AI).

## Handoff contract (hay gửi cho Muse)

- Voice: 1 file mp3/wav cho cả video HOẶC từng đoạn `vo-canh1.mp3`, `vo-canh2.mp3`...
  (khớp thứ tự cảnh trong kịch bản).
- Clip/ảnh: `canh1.mp4` (hoặc .png), `canh2.mp4`... đúng thứ tự cảnh; ưu tiên 9:16,
  nếu 16:9 thì Muse crop center sang 9:16.
- Kèm kịch bản đã duyệt (nếu hay sửa lời sau khi nghe thử trên CapCut).
- Muse dựng: timeline voice khớp hình (cắt/ghép clip theo độ dài voice từng cảnh),
  sub burn-in từ đúng text voice, beat mặc định + ducking.

## Lưu ý

- Asset CapCut có thể dính watermark/logo nếu dùng bản free — hay đang Pro nên xuất không watermark.
- Clip CapCut mang track audio AI → **bỏ track audio** khi ghép (chỉ giữ voiceover + beat).
- Luôn bật nhãn "nội dung do AI tạo" khi đăng TikTok.
- Không dùng tool GitHub không chính thức để tự động hóa CapCut (nguy cơ khóa acc Pro).
