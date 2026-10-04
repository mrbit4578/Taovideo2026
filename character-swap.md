# Character Swap — đổi nhân vật trong clip (MiniMax-H3 LoRA)

Khi hay muốn **cùng 1 nhân vật xuất hiện xuyên suốt các clip** (tăng nhận diện kênh),
hoặc đưa 1 nhân vật (cameo/thương hiệu) vào clip có sẵn:

- Backend đã đấu nối trên Kiemtien2026: `POST /video/character-swap` (NestJS, Gradio API tới
  HF Space `hugging-apps/minimax-h3-character-swap-lora`). Spec: `docs/character-swap-minimax-h3.md`.
- Cách dùng: render từng clip ngắn **≤14s** → swap nhân vật từng clip
  (prompt phải nhắc `<Video 1>` và `<Picture 1>`, canvas `768x1344 · 9:16 full` cho dọc)
  → ghép lại bằng ffmpeg như pipeline timelapse thường.
- Ảnh nhân vật tham chiếu: chân dung rõ mặt, nền đơn giản, ánh sáng trung tính.
- **BẮT BUỘC consent văn bản** của người thật được đưa vào (`consentConfirmed=true`);
  không consent → không làm. Mặc định REJECT, kể cả người nổi tiếng.
- Model còn thử nghiệm: motion timing & biểu cảm mặt có thể lỗi — **luôn xem lại thủ công**
  từng clip sau swap trước khi ghép/đăng.
- Provider free (ZeroGPU): xếp hàng, có thể timeout — không hứa thời gian với hay;
  check `GET /video/character-swap/status` trước khi chạy hàng loạt.
- Mọi clip swap đều là AI-generated: nhắc hay **bật nhãn AI** khi đăng TikTok.
