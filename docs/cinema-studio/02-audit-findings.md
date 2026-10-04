# Audit mã nguồn và quy trình

Phần A01–A11 dưới đây audit **TikTok Video Maker**, nguồn tại `_audit/TikTok_Video_Maker/`. Director Studio được audit riêng tại [07-director-and-knowledge-audit.md](07-director-and-knowledge-audit.md); không gán các lỗi Canvas/upload của app cũ sang app director. P0 = điều kiện chặn trước SaaS riêng tư/nhiều tenant; P1 = chất lượng hoặc độ tin cậy quan trọng; P2 = cải tiến vận hành/trải nghiệm. Phân biệt **đã tái hiện bằng handler với mock**, **đọc mã** và **khoảng thiếu thiết kế**; không suy thành sự cố trên backend live.

## 1. Chức năng có thật

| Chức năng | Bằng chứng | Giới hạn |
|---|---|---|
| CRUD project + autosave | `convex/app.ts`; `src/App.tsx:258` | 50 project gần nhất, không có revision business |
| 1–30 slide chữ/ảnh, 5 animation | `convex/validators.ts`; `src/render.ts` | Không có video asset hoặc take |
| Upload ảnh | `src/App.tsx:365` | Client kiểm tra MIME/8 MB; thiếu finalize/ownership record |
| Preview/cắt thời gian đơn giản | `src/App.tsx:735` | Một chuỗi slide; chưa có timeline nhiều track |
| Xuất MP4 hoặc WebM | `src/App.tsx:817` | 720×1280, captureStream(30), thời gian thực, codec tùy trình duyệt |
| Nhạc upload local | `src/App.tsx:662` | Không persist; không VO/SFX/ducking/loudness |
| AI gợi ý kịch bản | `src/App.tsx:1074` | Chữ TikTok, Type runtime, tối đa 1.024 output token theo khai báo bridge |
| Capability read/write ở server | `convex/typeFunctions.ts:46` | Quyền theo app; chưa có owner/workspace ACL |

## 2. Phát hiện kỹ thuật

### A01 — P0 khi phát triển SaaS: thiếu phạm vi workspace/project

`convex/schema.ts:8` không có `workspaceId`, `ownerId`, member hoặc project ACL. `app.ts:45` liệt kê chung, `app.ts:77` đọc ID trực tiếp; save/delete tương tự. Wrapper có kiểm tra session/capability nên **không phải backend không auth**.

Hai subject có capability cùng đọc/sửa được cùng bản ghi trong source probe. Đây có thể là thiết kế shared app của Type gốc; khi sản phẩm hứa dữ liệu riêng tư thì phải thêm tenant ACL tại mọi query/mutation/storage action. Nghiệm thu: user ngoài workspace bị từ chối kể cả biết project/asset ID, member read-only không sửa được, public share chỉ truy cập snapshot cho phép.

### A02 — P1: xóa storage có thể làm hỏng project còn tham chiếu

`app.ts:149` xóa mọi `imageId` xuất hiện trong project mà không kiểm tra các tham chiếu khác. Source probe tạo hai project dùng chung asset; xóa A vẫn xóa storage dùng bởi B. Chia sẻ storage ID chưa có guard server nên trạng thái này có thể được lưu.

Sửa: Asset tách khỏi placement; reference index và GC sau grace period, không xóa trực tiếp qua slide. Thay/xóa slide hiện cũng không cleanup asset cũ → orphan storage. Cần upload lifecycle `pending → ready → unreferenced → collected` và quota server.

### A03 — P1: lưu không có kiểm soát phiên bản, trạng thái “đã lưu” chưa chắc là draft mới nhất

`App.tsx:258–293`: debounce 700 ms, doSave có thể chạy đồng thời; từng response gán `lastSaved` và `saved`. Không có expectedRevision trong mutation. `useEffect` chỉ initialize draft lần đầu, thay đổi remote không được merge vào draft đã mở.

**Đọc mã, chưa E2E:** khi save A đang chờ và người dùng tạo B, response A có thể hiển thị “đã lưu” trong khi B còn pending; đóng tab không đảm bảo promise cleanup hoàn tất. Hai editor ghi toàn project có thể ghi đè chỉnh sửa nhau. Không khẳng định request cùng client luôn đảo thứ tự: rủi ro chắc chắn cần giải quyết là thiếu revision/conflict và stale acknowledgement.

Sửa: serial save queue + monotonically increasing local revision; server CAS `expectedRevision`; báo saved khi ack đúng snapshot; recovery draft và conflict UI. Nghiệm thu với mạng chậm, hai editor, chuyển project và reload.

### A04 — P1: upload gắn theo index có thể nhầm slide

`App.tsx:365`, `:387`: upload giữ `i`, sau fetch gọi `updateSlide(i, ...)`. Trong lúc upload, vẫn có thể xóa/di chuyển slide hoặc thay bộ slide bằng AI. Index lúc hoàn tất có thể là slide khác.

Sửa: giữ `slide.key`/shotId trước await, khi hoàn tất tìm ID còn tồn tại và đúng project; nếu target đã xóa thì asset đi vào kho, không tự gắn vào target mới. Test reorder/delete/AI replacement khi upload pending.

### A05 — P1: export đọc project đang thay đổi và ảnh chưa load

`App.tsx:753`, `:765` dùng `slidesRef.current`; export không khóa editor, trong khi duration tổng lấy từ thời điểm bắt đầu. Sửa text/duration lúc đang xuất có thể khiến file chứa trạng thái lẫn nhiều revision. `useImages` không có onerror/retry, export không await decode; ảnh chưa load bị thay bằng gradient trong `render.ts`.

Sửa: render immutable snapshot, preflight mọi asset và font, chặn khi thiếu/decode lỗi; export worker dùng cùng snapshot và asset checksum. Nghiệm thu: chỉnh project trong lúc xuất không thay artifact đang chạy; asset thiếu báo lỗi rõ, không báo file thành công.

### A06 — P1: vòng đời recorder có thể treo/rò rỉ và sai hợp đồng xuất

`App.tsx:849–895`: chờ promise chỉ resolve từ `onstop`, không `onerror`, không timeout/cancel; stream stop ở success path, không ở finally. Thêm chờ 250 ms sau runtime → không frame-exact. Chunks giữ trong RAM; chưa kiểm tra dung lượng đích.

Sửa tạm cho exporter cũ: error/stop/cancel state machine, track/RAF cleanup trong finally, snapshot và preflight. Lõi mới: server FFmpeg worker với progress, artifact manifest và final QC. Codec support do browser kiểm tra vẫn có thể lỗi khi recorder thiếu tài nguyên. [MDN MediaRecorder](https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder/isTypeSupported_static).

### A07 — P1: app chưa tuân thủ chuẩn output của chính tài liệu

`render.ts:19` đặt 720×1280; tài liệu mô tả 1080×1920. Có fallback WebM, `videoBitsPerSecond=8_000_000`, không đảm bảo file <100 MB. Ước tính video 300s ở 8 Mbps ≈300 MB video payload; encoder thực tế có thể khác. Giới hạn 100 MB của tài liệu là policy lịch sử, cần kiểm chứng theo đích khi tích hợp.

Sửa: delivery profiles versioned, metadata final đọc bằng ffprobe; dung lượng, fps, codec, duration và audio theo profile. Profile cinema không phải profile TikTok.

### A08 — P1: chưa portable ra web độc lập

`typeAuth.tsx:85` cần `window.type.appBackend.resolveSession`; khi mở standalone báo mở trong Type. `main.tsx:10` có backend dev literal; `.type/app-config.json` có deployment production khác, auth config ràng buộc issuer Type. Không thay auth bằng shim giả để tiếp cận backend.

Sửa: tách host adapter, có auth thực cho standalone, config môi trường và local sandbox riêng. Giữ wrapper/platform-owned files trong bản Type; dùng code app làm tham chiếu, không ghi đè lớp platform một cách tùy tiện.

### A09 — P2: validator chưa khóa tính nhất quán

Source probe xác nhận duplicate `slide.key` được chấp nhận. Server chỉ kiểm tra `bg.length`, không enum palette. UI duration tối đa 10 giây; backend cho 15 giây. Font size cũng khác range. AI yêu cầu đúng count trong prompt nhưng schema không min/maxItems; chỉ lọc string, không enforce count.

Sửa: schema hợp nhất, unique ID, enum/preset kiểm tra đúng, runtime AI validation và versioned structured output. Bounds ngữ cảnh film khác social, không tăng giới hạn bằng cách bỏ validator.

### A10 — P2: CSS desktop vẫn bị giới hạn width của base shell

`styles.css:192` `.app-shell` có `width: min(640px, 100% - 32px)`. `.tvm.app-shell:323` chỉ đặt `max-width:1480px`, không override width. Trên desktop >1180px viewport, nested grids có minimum khoảng 1092px chưa tính padding, trong shell 640px → nguy cơ tràn ngang.

Đây là **đọc CSS**, chưa screenshot/E2E. Nghiệm thu ở 1440/1920px và mobile, sửa width app-specific hoặc đổi layout editor mới.

### A11 — P2: nhiều giới hạn vòng đời/trải nghiệm

Cache ảnh theo ID không cập nhật khi URL đổi và không giải phóng blob ảnh. Nhạc local biến mất khi reload. `take(50)` không pagination nên project cũ biến khỏi danh sách. Full caption có thể vượt 2200 vì caption và hashtag validate riêng. Read-only fieldset cũng vô hiệu nút copy caption dù copy không sửa dữ liệu. Error project/delete chưa có thông báo đủ cụ thể.

Sửa theo nhu cầu MVP: asset registry, pagination, media persistence, bounded metadata, copy outside write fieldset và lỗi có recovery.

## 3. Phát hiện về tri thức sản xuất

| ID | Lỗi hoặc giả định | Kaizen |
|---|---|---|
| K01 | Scene=10s, mọi phim có hook/CTA | Tách scene–shot–take; narrative profile |
| K02 | Character bible hoặc seed đảm bảo identity | Reference/bible version + continuity state + full-clip review |
| K03 | Batch toàn bộ trước khi kiểm chứng | Pilot 1–3 shot rủi ro trước; quota/cost gates |
| K04 | Một frame đủ QC | Contact sheets + xem toàn clip + reviewer timecode |
| K05 | `volume=0.15` gọi nhỏ hơn VO 20dB | −16.48dB so với chính nguồn nhạc, chưa biết tương quan VO; đo sau mix |
| K06 | `alimiter=limit=0.95` được coi là giữ peak ở 0.95 | Auto-level mặc định bật; khi cần giữ gain dùng `level=0`, đo final true peak sau encode |
| K07 | ASS `q2` rồi kỳ vọng tự wrap | Soát subtitle render, explicit line breaks hoặc wrap style phù hợp; font kiểm tra glyph Việt |
| K08 | 768×1344 gọi 9:16 | Tỉ lệ đúng 4:7; không stretch, ingest đo thật rồi reframe |
| K09 | 30×10s + overlap gọi 5:30 | 285.5–290.333s với 29 overlap 8–12 frame @24fps; end-card 3s phải tính riêng nếu thay clip cuối |
| K10 | Timelapse morph mô phỏng đúng quá trình xây | Giữ geometry/occlusion, phân biệt chuyển trạng thái và hành động thi công; kiểm tra từng đoạn |
| K11 | Crop center/xóa toàn audio mặc định | Reframe/sound theo shot và mục đích |
| K12 | Model/endpoint/account capability từ file cũ | Capability discovery theo phiên; ghi unavailable/unknown, không giả vờ job đã chạy |
| K13 | Beat fileId/consent bool đủ bàn giao | Asset thực, rights provenance, phạm vi quyền và reviewer; checkbox chỉ là UI |
| K14 | Audit cũ nói đã cập nhật live skill | Workspace chỉ có bản tường thuật; phân biệt claimed/available/verified |

FFmpeg xác nhận auto-level mặc định của `alimiter`; cũng hỗ trợ cấu hình subtitles theo kích thước/phong cách. Các preset cần test trên file thật. [Tài liệu FFmpeg filters](https://ffmpeg.org/ffmpeg-filters.html#alimiter).

## 4. Khoảng thiếu để làm phim chuyên nghiệp

TikTok Video Maker chưa có scene nghiệp vụ. Director Studio có bảng scenes và checkbox production, nhưng chưa tách scene–shot–take thành entity và chưa có footage/take asset thật. Cả hai còn thiếu series/episode, performance direction, take selection, reference asset graph, continuity, video ingest/proxy cho phim, multiple audio tracks, generation provider, durable queue, bounded retry/budget, multi-user ACL, immutable render, color pipeline, subtitles theo audio, timecode review, export NLE và master/stem package. Đây là backlog sản phẩm; không phải lỗi có thể sửa chỉ bằng đổi giao diện.

## 5. Những gì nên tái sử dụng

Giữ kinh nghiệm prompt/staging, UI tiếng Việt, các primitive UI, palette social, caption editor, CRUD pattern và nguyên tắc capability enforcement. Canvas renderer có thể dùng cho title card/social preview. Data model `slides[]`, browser recorder và bridge AI không nên trở thành lõi phim dài.
