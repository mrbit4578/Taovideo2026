# Shot-list 30 Keyframe — Video timelapse công trình (kiểu "Nể phục")

> Mẫu dựng lại từ phân tích video viral 1.3M views (@constructionandrestaura, repost @hang160).
> Điền 4 ô bên dưới rồi copy từng prompt đi generate. Mọi prompt đã khóa camera & vật neo.

## 0. Điền bối cảnh của bạn (chỉ cần làm 1 lần)

| Ô | Điền vào đây | Ví dụ |
|---|---|---|
| [BỐI CẢNH] | Lô đất kiểu gì, xung quanh ra sao | `narrow urban lot between two concrete houses, paved street in foreground, dense city skyline behind` |
| [VẬT NEO] | Nghịch lý không gian — vật thể bất khả thi, KHÔNG BAO GIỜ di chuyển/xê dịch | `giant granite boulder, 8 meters tall, occupying half the lot` |
| [KIẾN TRÚC] | Phong cách công trình cuối | `modern minimalist 3-storey villa, raw concrete, floor-to-ceiling glass, vertical wood slats` |
| [CHỮ] | 1–2 từ cảm xúc overlay giữa khung | `Nể phục` |

## 1. Prompt khóa camera (dán đầu MỌI prompt)

```
Same exact camera position, same focal length, same horizon line,
same neighbouring buildings and street in foreground, pixel-identical framing.
Aerial 3/4 view, 35-degree elevation, vertical 9:16.
```

## 2. Luật sắt (từ audit — vi phạm là hỏng video)

1. **Camera lệch >5–10px giữa 2 keyframe = mất ảo giác timelapse.** Luôn dùng image-to-image từ cùng plate + cùng seed.
2. **Bước tiến độ quá lớn = morph nhão.** 5 phút cần ≥25 keyframe; 60s cần ≥7.
3. **Không cắt cảnh.** Nối bằng cross-dissolve 8–12 frame; giữ 24fps xuyên suốt.
4. **Giữ ~4% đầu trên hiện trạng bất khả thi** — không có hook "làm sao xây nổi?" thì khán giả không ở lại.
5. **Ánh sáng kể chuyện song song**: sáng sớm → trưa gắt → hoàng hôn → đêm đèn vàng (đã ghi sẵn trong từng KF).

## 3. Bảng 30 keyframe

### PHA 0 — BEFORE: hiện trạng bất khả thi (0–4%)

**KF01 — Hook: giữ yên trên hiện trạng**
Thay đổi: toàn cảnh lô đất hoang, [VẬT NEO] nổi bật giữa khung, đổ nát xung quanh.
```
[KHÓA CAMERA]
[BỐI CẢNH]. [VẬT NEO] dominates the centre of the frame, untouched.
Scattered debris, broken bricks, overgrown weeds, rusted metal sheets.
Soft early-morning light, long gentle shadows. Photorealistic, cinematic,
architectural photography, ultra detailed.
```

**KF02 — Con người xuất hiện (gợi "sắp bắt đầu")**
Thay đổi: 2 công nhân đội mũ bảo hộ đứng đo đạc, thêm thước dây/cọc.
```
[KHÓA CAMERA]
[BỐI CẢNH]. [VẬT NEO] centre frame, untouched. Two construction workers
in orange helmets surveying with measuring tape and wooden stakes,
one wheelbarrow at the gate. Morning light. Photorealistic, cinematic.
```

### PHA 1 — PHÁ DỠ & PHÁT QUANG (4–20%)

**KF03 — Dọn dẹp bắt đầu**
Thay đổi: công nhân xúc rác lên xe cút kít, bao tải trắng chất đống.
```
[KHÓA CAMERA]
[BỐI CẢNH]. [VẬT NEO] centre frame. Four workers clearing rubble,
wheelbarrows in motion (slight motion blur), white rubble sacks piled
near the gate, dust in the air. Morning sun climbing. Photorealistic.
```

**KF04 — Vật neo lộ rõ ("à, vấn đề là đây")**
Thay đổi: mặt bằng trống một nửa, [VẬT NEO] hiện nguyên hình.
```
[KHÓA CAMERA]
[BỐI CẢNH]. [VẬT NEO] fully exposed, centre frame, half the lot now
bare earth. Remaining debris pushed to one corner. Bright late-morning
light, crisp shadows. Photorealistic, cinematic.
```

**KF05 — Mặt bằng sạch**
Thay đổi: đất san phẳng, chỉ còn vật neo + dụng cụ.
```
[KHÓA CAMERA]
[BỐI CẢNH]. [VẬT NEO] centre frame, untouched. Lot graded flat,
bare compacted earth, shovels and a cement mixer at the side.
Harsh midday sun, hard shadows falling left. Photorealistic.
```

**KF06 — Đánh dấu mặt bằng**
Thay đổi: vạch trắng, cọc gỗ, dây căng layout móng quanh vật neo.
```
[KHÓA CAMERA]
[BỐI CẢNH]. [VẬT NEO] centre frame. White painted layout lines,
wooden stakes and yellow string lines marking foundation grid AROUND
[VẬT NEO]. A worker kneeling with spray paint. Midday sun. Photorealistic.
```

### PHA 2 — PHẦN NGẦM (20–43%)

**KF07 — Đào móng**
Thay đổi: hố móng đào quanh vật neo, đất đắp thành đống.
```
[KHÓA CAMERA]
[BỐI CẢNH]. [VẬT NEO] centre frame, untouched. Foundation trenches
dug in a grid around [VẬT NEO], excavated soil piled at edges,
two workers with shovels inside trenches. Midday sun. Photorealistic.
```

**KF08 — Bê tông lót**
Thay đổi: đáy hố lót đá + lớp bê tông lót xám.
```
[KHÓA CAMERA]
[BỐI CẢNH]. [VẬT NEO] centre frame. Trenches lined with gravel and
a fresh grey lean-concrete layer, steel reinforcement bars stacked
nearby. Harsh midday light. Photorealistic, cinematic.
```

**KF09 — Cốt thép móng**
Thay đổi: lồng thép móng + thép chờ cột dựng đứng.
```
[KHÓA CAMERA]
[BỐI CẢNH]. [VẬT NEO] centre frame. Steel rebar cages laid in
trenches, vertical column starter bars rising, workers tying rebar
with wire. Bright afternoon sun. Photorealistic.
```

**KF10 — Đổ bê tông móng**
Thay đổi: bê tông tươi xám ướt trong hố, xe trộn mini.
```
[KHÓA CAMERA]
[BỐI CẢNH]. [VẬT NEO] centre frame. Wet grey concrete freshly poured
into foundation trenches, portable cement mixer churning, workers
screeding the surface. Afternoon sun. Photorealistic.
```

**KF11 — Cột tầng trệt đầu tiên**
Thay đổi: coffa gỗ dựng, cột bê tông đầu tiên mọc lên.
```
[KHÓA CAMERA]
[BỐI CẢNH]. [VẬT NEO] centre frame. Timber formwork for ground-floor
columns erected, first concrete columns cast, low scaffolding,
red brick pallets arriving. Afternoon light softening. Photorealistic.
```

**KF12 — Sàn tầng 1**
Thay đổi: sàn bê tông tầng 1 hoàn thành, thép chờ lên tầng 2.
```
[KHÓA CAMERA]
[BỐI CẢNH]. [VẬT NEO] centre frame, now framed by fresh concrete
slab of the first floor. Vertical rebar waiting for the next level,
ladders leaning. Late-afternoon warm light. Photorealistic, cinematic.
```

### PHA 3 — PHẦN THÂN (43–63%)

**KF13 — Khung tầng 2 + cầu thang ôm vật neo**
Thay đổi: cột tầng 2, cầu thang bê tông đầu tiên uốn quanh vật neo.
```
[KHÓA CAMERA]
[BỐI CẢNH]. [VẬT NEO] centre frame, now embraced by rising concrete
frame. First raw concrete staircase curving around [VẬT NEO],
second-floor columns cast. Golden late-afternoon light. Photorealistic.
```

**KF14 — Sàn tầng 2 & khung mái**
Thay đổi: sàn tầng 2, dầm mái, giàn giáo cao.
```
[KHÓA CAMERA]
[BỐI CẢNH]. [VẬT NEO] centre frame, towered over by two concrete
floor slabs and roof beams. Tall bamboo/steel scaffolding wrapping
the structure, workers silhouetted on top. Warm sunset light. Photorealistic.
```

**KF15 — Tường xây chèn**
Thay đổi: tường gạch bắt đầu lấp đầy khung, vật neo lọt thỏm giữa nhà.
```
[KHÓA CAMERA]
[BỐI CẢNH]. [VẬT NEO] centre frame, nestled inside the concrete
skeleton. Red-brick infill walls half-built, mortar buckets and
trowels visible, [VẬT NEO] now an indoor-outdoor feature.
Sunset glow. Photorealistic, cinematic.
```

**KF16 — Tường bao gần kín**
Thay đổi: tường kín, chừa ô kính lớn hướng vào vật neo.
```
[KHÓA CAMERA]
[BỐI CẢNH]. [VẬT NEO] centre frame, framed by near-complete walls
with large window openings facing it. Scaffolding partially removed.
Dusk approaching, sky turning orange. Photorealistic.
```

**KF17 — Mái hoàn thành**
Thay đổi: mái đúc xong, giàn giáo bao quanh, đường nét kiến trúc rõ.
```
[KHÓA CAMERA]
[BỐI CẢNH]. [KIẾN TRÚC] structural shell complete around untouched
[VẬT NEO] centre frame. Flat concrete roof cast, scaffolding still
up, building silhouette crisp against deep-orange dusk sky. Photorealistic.
```

**KF18 — Tháo giàn giáo**
Thay đổi: giàn giáo dỡ một nửa, khối nhà hiện hình.
```
[KHÓA CAMERA]
[BỐI CẢNH]. [KIẾN TRÚC] revealed as scaffolding comes half-down,
[VẬT NEO] centre frame integrated into the design. Workers carrying
scaffold poles away. Blue-hour sky. Photorealistic, cinematic.
```

### PHA 4 — VỎ & HOÀN THIỆN (63–77%)

**KF19 — Lắp kính mặt tiền**
Thay đổi: khung nhôm + kính lớn được lắp.
```
[KHÓA CAMERA]
[BỐI CẢNH]. [KIẾN TRÚC], [VẬT NEO] centre frame. Floor-to-ceiling
glass panels being installed in aluminium frames, reflections of
the sky on glass. Early blue hour, interior still dark. Photorealistic.
```

**KF20 — Ốp mặt tiền**
Thay đổi: lam gỗ / vật liệu ốp lên mặt tiền.
```
[KHÓA CAMERA]
[BỐI CẢNH]. [KIẾN TRÚC], [VẬT NEO] centre frame. Vertical wood-slat
cladding going up on the facade, warm wood tone against raw concrete.
Blue hour deepening. Photorealistic, cinematic.
```

**KF21 — Sân, tường rào, cổng mới**
Thay đổi: lát sân, cổng sắt mới, tường rào sơn.
```
[KHÓA CAMERA]
[BỐI CẢNH]. [KIẾN TRÚC], [VẬT NEO] centre frame. New stone-paved
courtyard, modern steel gate installed, boundary walls freshly
rendered. First landscape lights glowing. Night falling. Photorealistic.
```

**KF22 — Vệ sinh công nghiệp**
Thay đổi: vật liệu thừa dọn sạch, công trình sạch bong.
```
[KHÓA CAMERA]
[BỐI CẢNH]. [KIẾN TRÚC] pristine, [VẬT NEO] centre frame washed
clean. Last material piles removed, workers sweeping the courtyard.
Warm light spilling from windows. Night. Photorealistic.
```

### PHA 5 — NỘI THẤT + HỒ + ĐÈN (77–89%)

**KF23 — Đèn vàng bật lần đầu (nhịp cảm xúc thứ hai)**
Thay đổi: nội thất lấp ló, đèn vàng bật sáng — khoảnh khắc "wow".
```
[KHÓA CAMERA]
[BỐI CẢNH]. [KIẾN TRÚC] at night, [VẬT NEO] centre frame dramatically
uplighted. Warm golden interior lights switched on for the first time,
furniture silhouettes visible through glass. Magical night mood.
Photorealistic, cinematic.
```

**KF24 — Hồ bơi đổ nước**
Thay đổi: hồ bơi cạnh vật neo đầy nước xanh, lát đá quanh hồ.
```
[KHÓA CAMERA]
[BỐI CẢNH]. [KIẾN TRÚC] at night, [VẬT NEO] centre frame beside a
new infinity pool filled with glowing blue water, stone decking,
underwater lights on. Luxurious night atmosphere. Photorealistic.
```

**KF25 — Sân vườn & đèn cảnh quan**
Thay đổi: ghế ngoài trời, đèn lối đi, cây trồng mới.
```
[KHÓA CAMERA]
[BỐI CẢNH]. [KIẾN TRÚC] at night, [VẬT NEO] centre frame with
artistic uplighting. Outdoor lounge chairs, path lights lining the
walkway, young palm trees planted. Warm and inviting. Photorealistic.
```

**KF26 — Toàn nhà rực sáng**
Thay đổi: mọi đèn bật, vật neo thành tác phẩm nghệ thuật.
```
[KHÓA CAMERA]
[BỐI CẢNH]. [KIẾN TRÚC] fully lit at night, [VẬT NEO] centre frame
as a sculptural centrepiece with museum-grade uplighting, pool
glowing, every window warm. Peak beauty, wide and still. Photorealistic.
```

### PHA 6 — CẢNH QUAN + REVEAL (89–96%)

**KF27 — Tiểu cảnh quanh vật neo**
Thay đổi: lối đá, cây bụi, đèn âm đất quanh chân vật neo.
```
[KHÓA CAMERA]
[BỐI CẢNH]. [KIẾN TRÚC] at night, [VẬT NEO] centre frame surrounded
by finished landscaping: stepping-stone path, shrubs, in-ground
spotlights at its base. Serene luxury. Photorealistic, cinematic.
```

**KF28 — Reveal: cổng mở, toàn cảnh**
Thay đổi: cổng mở hé, nhìn xuyên vào toàn bộ công trình hoàn chỉnh.
```
[KHÓA CAMERA]
[BỐI CẢNH]. [KIẾN TRÚC] grand night reveal, [VẬT NEO] centre frame,
modern gate swung open, full view of the illuminated villa, pool
and landscaped garden. The impossible made real. Photorealistic.
```

### PHA 7 — BEAUTY SHOT (96–100%)

**KF29 — Giữ yên cho người xem ngắm**
Thay đổi: không thêm gì — frame đẹp nhất giữ 4% cuối.
```
[KHÓA CAMERA]
[BỐI CẢNH]. [KIẾN TRÚC] in its most beautiful night composition,
[VẬT NEO] centre frame glowing under accent lights, pool mirror-calm,
stars faint in the sky. Absolute stillness, hold for the viewer.
Photorealistic, cinematic masterpiece.
```

**KF30 — End card**
Thay đổi: nền đen + chữ.
```
Black screen. Centre: "[CHỮ]" in large white serif type.
Below, small: TikTok logo. Minimal, elegant, 3 seconds.
```

## 4. Chọn keyframe theo thời lượng

| Bản | Keyframe dùng | Mỗi đoạn | Tổng |
|---|---|---|---|
| **45–60s** (khuyên dùng) | KF01 → 04 → 08 → 13 → 19 → 24 → 29 (+30 end card) | ~7–8s | ~60s |
| **5 phút** (bản đầy đủ) | KF01 → KF30 toàn bộ | ~10s + nội suy morph giữa các cặp | ~5:30 |

Nội suy giữa 2 keyframe liền nhau: dùng image-to-video có **start frame + end frame**
(Kling / Runway Gen-3 / Luma) hoặc RIFE/FILM để morph mượt — đây là bí quyết tạo "0 cú cắt".

## 5. Âm thanh & overlay

- Nhạc: êm, **rất nhỏ (−35 đến −45 dBFS)** + lớp ambient công trường (búa, máy trộn xa). Không voice-over — để hình kể chuyện.
- Chữ "[CHỮ]" đặt ở **~40% chiều cao khung**, giữ nguyên suốt video; chừa đáy-phải ~25% cho UI TikTok.
- Nội dung AI → **gắn nhãn AI** khi đăng (TikTok 2026 bắt buộc với hình ảnh chân thực).
