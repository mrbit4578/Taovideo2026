# Lời đọc + phụ đề + mix tiếng (mặc định cho mọi video)

Quy trình sau bước ghép clip (mục 8 bước 6 của SKILL.md). Đọc ở bước 7 mọi video.

## 1. Kịch bản lời đọc

- Viết theo từng cảnh, tổng ~140–160 từ cho 60s, khớp nội dung từng keyframe.
- **Kỷ luật trim (đã chốt từ 3 video liên tiếp)**: lời đọc vượt slot → rút gọn câu thoại cho vừa,
  **giữ nguyên mọi claim, số liệu, disclaimer** (đặc biệt disclaimer y tế/pháp lý). Báo rõ cho hay
  chỗ nào đã trim + offer bản đầy đủ nếu muốn.
- Viết số/thời gian bằng chữ để TTS đọc đúng ("ba mươi giây", "tám trên mười").
- Không claim y tế/tài chính chưa kiểm chứng.

## 2. TTS

```
/opt/hatch/bin/tts speak --language vi --voice avocado_v2:briggs --output vo-canhN.mp3
```
- Giọng mặc định của hay: `avocado_v2:briggs` (nam miền Bắc, ấm, đọc tiếng Việt).
- Test thử **1 câu** trước khi render cả bài.
- Trên Type (không có tts): hay gửi file giọng đọc CapCut vào thread, dựng theo hợp đồng handoff trong `capcut-workflow.md`.

## 3. Phụ đề burn-in (.ass — bắt buộc)

**Bài học 2026-09-30**: filter `subtitles` với file `.srt` dùng PlayRes mặc định 384x288 của
libass (SRT không chứa thông tin resolution) → mọi giá trị px tính cho 1080x1920 đều sai:
`MarginV=300` đẩy phụ đề bottom ra khỏi khung hình, chữ top bị phóng to ~6x và xuống dòng từng từ.
→ Tự viết file `.ass` với header **PlayResX: 1080 / PlayResY: 1920** thì
`FontSize`/`MarginV`/`Alignment` mới chính xác theo pixel video.
**KHÔNG dùng `drawtext`** cho câu tiếng Việt dài (không tự xuống dòng, dễ tràn khung).

Template 2 style (Label trên + Sub dưới), chèn chữ hay yêu cầu vào Label:

```
[Script Info]
ScriptType: v4.00+
PlayResX: 1080
PlayResY: 1920
WrapStyle: 0
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Label,DejaVu Sans,54,&H0000FFFF,&H000000FF,&H80000000,&H80000000,-1,0,0,0,100,100,1,0,1,3,0,8,60,60,120,1
Style: Sub,DejaVu Sans,46,&H00FFFFFF,&H000000FF,&H80000000,&H80000000,-1,0,0,0,100,100,1,0,1,3,0,2,60,60,300,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
Dialogue: 0,0:00:00.00,0:00:03.00,Label,,0,0,0,,{\q2}Hook: chữ màn hình hay yêu cầu
Dialogue: 0,0:00:00.00,0:00:06.00,Sub,,0,0,0,,{\q2}Lời thoại câu 1
```

- Label: vàng, trên-center (Alignment 8), size 54 — chữ màn hình hay yêu cầu, điểm số.
- Sub: trắng, dưới-center (Alignment 2), size 46, MarginV 300 — lời thoại, chừa lề UI TikTok.
- Burn: `subtitles=labels.ass` rồi `subtitles=subs.ass` (2 lần filter liên tiếp).

## 4. Mix tiếng — beat LUÔN nhỏ hơn lời thuyết minh

- Narration giữ nguyên volume.
- Nhạc nền = beat mặc định của hay (`~/workspace/user/files/josepmonter-mariage-damour-2186_0_7hvz.mp3`,
  cắt `atrim=0:<DUR>` khớp video). **TẮT tiếng ambient AI của clip** (không mix chung).
- Công thức đã validate 2026-09-30 (beat lùi ~20dB dưới narration + tự dìm khi có tiếng nói):

```
[beat_in]atrim=0:60,asetpts=PTS-STARTPTS,volume=0.15[beat];
[narr]asplit=2[nkey][narr2];
[beat][nkey]sidechaincompress=threshold=0.02:ratio=8:attack=200:release=800:makeup=1[ducked];
[narr2][ducked]amix=inputs=2:duration=first:normalize=0,alimiter=limit=0.95[aout]
```

- **BẮT BUỘC `normalize=0` trên mọi `amix`** — mặc định `normalize=1` chia nhỏ tín hiệu
  theo số input (5 input ≈ -14dB) khiến lời đọc lí nhí.
- Thêm `alimiter=limit=0.95` cuối chuỗi chống clipping.
- Narration nhiều đoạn: `[n1][n2]...amix=inputs=N:duration=longest:dropout_transition=0:normalize=0[narr]`,
  căn thời gian bằng `adelay=<ms>|<ms>` theo timeline cảnh.

## 5. QC tiếng

Nghe thử toàn bộ — voiceover rõ, beat nhỏ hơn lời, không clipping; sub không che chủ thể.
