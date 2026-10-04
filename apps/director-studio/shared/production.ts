import { canVerify } from "./evidence";
import type { Doc, Id } from "../convex/_generated/dataModel";
// ───────────────────────── Types ─────────────────────────
type Project = Doc<"projects">;
type Scene = Doc<"scenes">;
type Brief = Doc<"briefs">;
type SceneInput = Omit<Scene, "_id" | "_creationTime" | "projectId">;
type Knowledge = Omit<Brief, "_id" | "_creationTime" | "projectId">;
type HookType = Project["hooks"][number]["type"];
type ShotSize = Scene["shotSize"];
type CameraMove = Scene["camera"];
type ScreenLayout = Scene["screenLayout"];
type Format = Project["format"];
type ClaimStatus = Brief["claims"][number]["status"];
type RiskLevel = Brief["risk"]["accuracy"];
type StepId = "brief" | "claims" | "hook" | "cast" | "shots" | "prompts" | "audio" | "caption" | "qc";
type ScenePatch = Partial<Omit<SceneInput, "order" | "startSec" | "endSec">>;
type View = { kind: "welcome" } | { kind: "intake" } | { kind: "project"; id: Id<"projects"> };

// ───────────────────────── Knowledge (from the skill) ─────────────────────────
const STEPS: { id: StepId; label: string }[] = [
  { id: "brief", label: "1 · Brief" },
  { id: "claims", label: "2 · Claim ledger" },
  { id: "hook", label: "3 · Hook" },
  { id: "cast", label: "4 · Casting" },
  { id: "shots", label: "5 · Shot list" },
  { id: "prompts", label: "6 · Prompt" },
  { id: "audio", label: "7 · Lời đọc & sub" },
  { id: "caption", label: "8 · Caption" },
  { id: "qc", label: "9 · QC & bàn giao" },
];

const HOOK_TYPES: { key: HookType; label: string; example: string }[] = [
  { key: "ket_qua", label: "Kết quả", example: "Sau 30 ngày, đây là 3 thay đổi rõ nhất…" },
  { key: "sai_lam", label: "Sai lầm", example: "Nếu video tụt view ngay giây đầu, kiểm tra điều này." },
  { key: "doi_lap", label: "Đối lập", example: "Nhiều view chưa chắc có khách hàng." },
  { key: "cau_hoi", label: "Câu hỏi cụ thể", example: "Vì sao bạn đăng đều nhưng không ai lưu bài?" },
  { key: "demo", label: "Demo", example: "Mở bằng kết quả trước–sau." },
  { key: "cau_chuyen", label: "Câu chuyện", example: "Một tình huống thật, một thất bại, một quyết định khó." },
];
const hookLabel = (t: HookType) => HOOK_TYPES.find((h) => h.key === t)?.label ?? t;

const SHOT_SIZES: Record<ShotSize, { label: string; en: string }> = {
  toan: { label: "Toàn cảnh", en: "wide shot, full body and environment visible" },
  trung: { label: "Trung cảnh", en: "medium shot, waist-up" },
  can: { label: "Cận vừa", en: "medium close-up, chest-up, no extreme facial close-up" },
};
const CAMERAS: Record<CameraMove, { label: string; en: string }> = {
  push_in: { label: "Push-in (tiến chậm)", en: "slow camera push-in" },
  pull_out: { label: "Pull-out (lùi chậm)", en: "slow camera pull-out" },
  pan: { label: "Pan (lia ngang)", en: "slow lateral pan" },
  tilt: { label: "Tilt (lia dọc)", en: "slow tilt" },
  static: { label: "Khóa máy (tĩnh)", en: "locked-off static camera" },
};
const SCREEN_LAYOUTS: Record<ScreenLayout, { label: string; en: string }> = {
  none: { label: "Không có màn hình", en: "" },
  ots: {
    label: "Over-the-shoulder",
    en: "camera placed behind the person's shoulder, the screen content fully visible and facing toward the person, shoulder and hair softly blurred in the foreground",
  },
  front: {
    label: "Chính diện người xem",
    en: "camera facing the person who looks down at the device, only the BACK of the device is visible, screen facing toward them, not toward camera",
  },
  pip: {
    label: "PiP (mặt + khung nhỏ)",
    en: "the person's face looking at the device, screen facing toward them; keep one clean corner free for a picture-in-picture inset added later",
  },
};
const CLAIM_STATUS: Record<ClaimStatus, { label: string; badge: string }> = {
  verified: { label: "VERIFIED", badge: "badge-success" },
  unverified: { label: "UNVERIFIED", badge: "badge-error" },
  editorial: { label: "EDITORIAL (biên soạn)", badge: "badge-warning" },
};
const RISK: Record<RiskLevel, { label: string; badge: string }> = {
  low: { label: "Rủi ro sai lệch: thấp", badge: "badge-success" },
  medium: { label: "Rủi ro sai lệch: trung bình", badge: "badge-warning" },
  high: { label: "Rủi ro sai lệch: cao", badge: "badge-error" },
};

const TIMELAPSE_CAMERA_LOCK =
  "Same exact camera position, same focal length, same horizon line, same neighbouring buildings and street in foreground, pixel-identical framing. Aerial 3/4 view, 35-degree elevation, vertical 9:16.";

const TIMELAPSE_KF: { kf: string; role: string; body: string }[] = [
  {
    kf: "KF01",
    role: "Hook — hiện trạng bất khả thi",
    body: "[BC]. [VN] dominates the centre of the frame, untouched. Scattered debris, broken bricks, overgrown weeds, rusted metal sheets. Soft early-morning light, long gentle shadows. Photorealistic, cinematic, architectural photography, ultra detailed.",
  },
  {
    kf: "KF04",
    role: "Vật neo lộ rõ",
    body: "[BC]. [VN] fully exposed, centre frame, half the lot now bare earth. Remaining debris pushed to one corner. Bright late-morning light, crisp shadows. Photorealistic, cinematic.",
  },
  {
    kf: "KF08",
    role: "Bê tông lót móng",
    body: "[BC]. [VN] centre frame. Trenches lined with gravel and a fresh grey lean-concrete layer, steel reinforcement bars stacked nearby. Harsh midday light. Photorealistic, cinematic.",
  },
  {
    kf: "KF13",
    role: "Khung tầng 2 ôm vật neo",
    body: "[BC]. [VN] centre frame, now embraced by rising concrete frame. First raw concrete staircase curving around [VN], second-floor columns cast. Golden late-afternoon light. Photorealistic.",
  },
  {
    kf: "KF19",
    role: "Lắp kính mặt tiền",
    body: "[BC]. [KT], [VN] centre frame. Floor-to-ceiling glass panels being installed in aluminium frames, reflections of the sky on glass. Early blue hour, interior still dark. Photorealistic.",
  },
  {
    kf: "KF24",
    role: "Hồ bơi đổ nước",
    body: "[BC]. [KT] at night, [VN] centre frame beside a new infinity pool filled with glowing blue water, stone decking, underwater lights on. Luxurious night atmosphere. Photorealistic.",
  },
  {
    kf: "KF29",
    role: "Beauty shot — giữ yên",
    body: "[BC]. [KT] in its most beautiful night composition, [VN] centre frame glowing under accent lights, pool mirror-calm, stars faint in the sky. Absolute stillness, hold for the viewer. Photorealistic, cinematic masterpiece.",
  },
];

// Keys are "<group>-<item>" and stored on the project; append new groups at the END only.
const QC_GROUPS: { title: string; items: string[] }[] = [
  {
    title: "Lượt 1 — Logic (7d)",
    items: [
      "Tay – mắt – vật khớp nhau ở frame ranh giới mọi cảnh",
      "Màn hình ĐỐI DIỆN người xem, không quay về camera",
      "Sản phẩm thật đúng thiết kế trong mọi cảnh (7e)",
      "Quy tắc 180° và đồng tone màu/ánh sáng giữa các cảnh",
    ],
  },
  {
    title: "Lượt 2 — Chữ",
    items: [
      "Sub không che chủ thể, không tràn khung (MarginV 300)",
      "Label đúng chính tả, chữ hay yêu cầu nằm trong Label, không bake vào clip AI",
      "Hook: lời + hình + chữ cùng một thông điệp",
    ],
  },
  {
    title: "Lượt 3 — Tiếng",
    items: [
      "Voiceover rõ, beat luôn nhỏ hơn lời (0.15 + ducking)",
      "amix normalize=0, alimiter 0.95 — không clipping",
      "Đã bỏ track audio AI của mọi clip",
    ],
  },
  {
    title: "Lượt 4 — Kỹ thuật",
    items: [
      "1080x1920, MP4 H.264, ≤100MB",
      "Đúng thời lượng (±0.5s)",
      "Đã trích frame đầu/giữa/cuối + ranh giới cảnh để soi",
      "File thật, chmod 644, không symlink",
    ],
  },
  {
    title: "Bàn giao & nội dung",
    items: [
      "Đúng một mục tiêu, một CTA (không CTA kép)",
      "Hook rõ vấn đề/kết quả trong 3s; giá trị đầu tiên trước giây 15",
      "Không claim y tế/tài chính chắc nịch chưa kiểm chứng",
      "G0 originality: không dùng lại nhạc/hình/lời/nhịp dựng của nguồn",
      "Caption: hook + 2–3 câu + CTA + 5–8 hashtag",
      "Ghi chú kèm video: GẮN NHÃN AI khi đăng; bật Commercial Disclosure nếu có affiliate",
    ],
  },
  {
    title: "Lượt 5 — Claim & series (lớp tri thức)",
    items: [
      "Mọi số liệu / nhận định trong lời đọc có anchor VERIFIED trong claim ledger, hoặc ghi rõ 'mô phỏng minh họa'",
      "Không còn claim UNVERIFIED trong kịch bản; claim EDITORIAL được diễn đạt như ý kiến biên soạn",
      "Ví dụ giả lập (mã đơn, số liệu doanh nghiệp) được ghi 'minh họa' trong caption",
      "Mốc năm / số liệu nhất quán với các video trước trong series (continuity notes)",
    ],
  },
];

const WORDS_PER_SEC = 2.5; // 140–160 từ / 60s
const MIN_SCENE_SEC = 8;

// ───────────────────────── Scene templates ─────────────────────────
const blankStatus = () => ({ keyframe: false, take: false, approved: false, assembled: false });
const SIZE_CYCLE: ShotSize[] = ["trung", "toan", "can", "trung", "toan", "can", "trung", "toan"];
const CAM_CYCLE: CameraMove[] = ["push_in", "pan", "pull_out", "push_in", "pan", "push_in", "pan", "pull_out"];

function blankScene(order: number, start: number, end: number, role: string, hero: boolean): SceneInput {
  return {
    order,
    startSec: start,
    endSec: end,
    role,
    hero,
    shotSize: SIZE_CYCLE[order % SIZE_CYCLE.length],
    camera: CAM_CYCLE[order % CAM_CYCLE.length],
    action: "",
    subject: "",
    environment: "",
    prop: "",
    animal: "",
    screenLayout: "none",
    voiceover: "",
    label: "",
    promptOverride: "",
    status: blankStatus(),
    takes: hero ? 2 : 1,
    note: "",
  };
}

function standardScenes(duration: number): SceneInput[] {
  const plan: [string, number, number, boolean][] =
    duration >= 60
      ? [
          ["HOOK + định hướng", 0, 10, true],
          ["Ý 1 + minh họa", 10, 22, false],
          ["Ý 2 + minh họa", 22, 34, false],
          ["Ý 3 + minh họa", 34, 45, false],
          ["Tóm tắt một câu", 45, 55, false],
          ["CTA duy nhất", 55, 60, true],
        ]
      : duration >= 45
        ? [
            ["HOOK + định hướng", 0, 10, true],
            ["Ý 1 + minh họa", 10, 20, false],
            ["Ý 2 + minh họa", 20, 30, false],
            ["Tóm tắt một câu", 30, 40, false],
            ["CTA duy nhất", 40, 45, true],
          ]
        : [
            ["HOOK + định hướng", 0, 10, true],
            ["Ý 1 + minh họa", 10, 19, false],
            ["Ý 2 + tóm tắt", 19, 26, false],
            ["CTA duy nhất", 26, 30, true],
          ];
  const scale = duration / plan[plan.length - 1][2];
  return plan.map(([role, start, end, hero], i) => blankScene(i, Math.round(start * scale * 10) / 10, Math.round(end * scale * 10) / 10, role, hero));
}

function timelapseScenes(t: Project["timelapse"]): SceneInput[] {
  const fill = (s: string) =>
    s.replaceAll("[BC]", t.boiCanh || "[BỐI CẢNH]").replaceAll("[VN]", t.vatNeo || "[VẬT NEO]").replaceAll("[KT]", t.kienTruc || "[KIẾN TRÚC]");
  const per = 57 / TIMELAPSE_KF.length;
  const scenes: SceneInput[] = TIMELAPSE_KF.map((k, i) => ({
    ...blankScene(i, Math.round(i * per * 10) / 10, Math.round((i + 1) * per * 10) / 10, `${k.kf} — ${k.role}`, i === 0 || i === TIMELAPSE_KF.length - 1),
    shotSize: "toan",
    camera: "static",
    action: i === 0 ? "giữ yên, chỉ bụi/cỏ lay nhẹ" : "morph từ keyframe trước (start frame → end frame), cross-dissolve 8–12 frame",
    subject: i === 0 ? "công trình hoang" : "công trình đang hình thành",
    environment: t.boiCanh,
    prop: t.vatNeo,
    label: t.chu,
    promptOverride: `${TIMELAPSE_CAMERA_LOCK}\n${fill(k.body)}`,
  }));
  scenes.push({
    ...blankScene(scenes.length, 57, 60, "KF30 — End card", false),
    shotSize: "toan",
    camera: "static",
    action: "nền đen, chữ giữ yên",
    label: t.chu,
    promptOverride: "KHÔNG generate AI. End card dựng bằng ffmpeg: nền đen + chữ \"" + (t.chu || "[CHỮ]") + "\" (Label trong .ass). 3 giây.",
    takes: 1,
  });
  return scenes;
}

// ───────────────────────── Brief parser (knowledge intake) ─────────────────────────
type ParsedClaim = { text: string; anchors: string[]; status: ClaimStatus };
type ParsedBrief = {
  briefNo: string;
  title: string;
  series: string;
  audience: string;
  angle: string;
  hook: string;
  hookType: HookType;
  cta: string;
  outline: string[];
  claims: ParsedClaim[];
  riskAccuracy: RiskLevel;
  riskNotes: string;
  source: { docId: string; section: string; anchors: string[] };
  durationSec: number;
  continuity: string;
  raw: string;
  warnings: string[];
};

function slug(s: string) {
  return (
    s
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/gi, "d")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "video"
  );
}
const anchorsIn = (s: string) => Array.from(new Set((s.match(/\[(\d{1,3})\]/g) ?? []).map((a) => a.replace(/[[\]]/g, "").padStart(2, "0"))));
const stripQuotes = (s: string) => s.trim().replace(/^[“"'`]+|[”"'`]+$/g, "").trim();
// Numbers that read as facts: percentages, decimals, integers ≥ 10. Small counts ("3 lỗi", "4 bước", "8 giờ") are structure, not claims.
const numbersIn = (s: string) => Array.from(new Set((s.match(/\d+(?:[.,]\d+)?\s*%|\d+[.,]\d+|\d{2,}/g) ?? []).map((n) => n.replace(/\s+/g, ""))));

function guessHookType(hook: string): HookType {
  const h = hook.toLowerCase();
  if (/\?\s*$/.test(hook)) return "cau_hoi";
  if (/bí quyết|sau \d+|kết quả|thay đổi|giỏi lên/.test(h)) return "ket_qua";
  if (/lỗi|sai lầm|làm sai|sai bét|coi chừng|đừng/.test(h)) return "sai_lam";
  if (/\d+\s*(h|giờ)|một ngày|nhật ký|câu chuyện/.test(h)) return "cau_chuyen";
  if (/cùng (một|1).*khác|nhưng|chưa chắc/.test(h)) return "doi_lap";
  if (/trước.*sau|demo|xem thử/.test(h)) return "demo";
  return "ket_qua";
}

function parseBrief(md: string): ParsedBrief {
  const warnings: string[] = [];
  let body = md.replace(/\r\n?/g, "\n");
  const fm: Record<string, string> = {};
  const fmMatch = body.match(/^---\n([\s\S]*?)\n---\n?/);
  if (fmMatch) {
    for (const line of fmMatch[1].split("\n")) {
      const m = line.match(/^([A-Za-z_][\w]*):\s*(.*)$/);
      if (m) fm[m[1].toLowerCase()] = stripQuotes(m[2].trim().replace(/\s+#.*$/, ""));
    }
    body = body.slice(fmMatch[0].length);
  }

  const titleRaw = body.match(/^#\s+(.+)$/m)?.[1]?.trim() ?? "";
  const noMatch = titleRaw.match(/brief\s*(\d+)/i);
  const briefNo = fm.brief_id ?? (noMatch ? noMatch[1].padStart(2, "0") : "");
  const title = titleRaw.replace(/^video brief\s*\d+\s*[—–-]\s*/i, "").trim() || "Brief chưa có tiêu đề";

  // Top-level "- **Field:** value" blocks; nested lines belong to the current block.
  const blocks: Record<string, string[]> = {};
  let current: string | null = null;
  for (const line of body.split("\n")) {
    const head = line.match(/^-\s*\*\*(.+?)\*\*\s*(.*)$/);
    if (head) {
      current = slug(head[1]);
      blocks[current] = head[2].trim() ? [head[2].trim()] : [];
    } else if (current && line.trim() && !/^#/.test(line)) {
      blocks[current].push(line);
    }
  }
  const block = (prefix: string) => {
    const key = Object.keys(blocks).find((k) => k.startsWith(prefix));
    return key ? blocks[key] : [];
  };
  const text = (lines: string[]) => lines.map((l) => l.trim()).join(" ").trim();

  const nguon = text(block("nguon"));
  const docId = fm.doc_id ?? nguon.match(/`([^`]+)`/)?.[1] ?? "";
  const sectionMatch = nguon.match(/mục\s*([\d.]+(?:\s*\([^)]*\))?)/i);
  const section = fm.section ? `mục ${fm.section}` : sectionMatch ? `mục ${sectionMatch[1]}`.trim() : "";
  const sourceAnchors = fm.anchors ? Array.from(new Set((fm.anchors.match(/\d{1,3}/g) ?? []).map(a => a.padStart(2, "0")))) : anchorsIn(nguon);

  const audience = fm.audience ?? text(block("doi-tuong"));
  const angle = text(block("goc-moi"));
  const hook = stripQuotes(text(block("hook")));
  const hookType = (fm.hook_type as HookType | undefined) && HOOK_TYPES.some((h) => h.key === fm.hook_type) ? (fm.hook_type as HookType) : guessHookType(hook);

  const outline = block("dan-y")
    .map((l) => l.match(/^\s*\d+[.)]\s*(.+)$/)?.[1]?.trim() ?? "")
    .filter(Boolean);

  const claims: ParsedClaim[] = block("claim")
    .map((l) => l.replace(/^\s*-\s*/, "").trim())
    .filter((l) => l && !/^claim ledger/i.test(l))
    .map((l) => {
      const m = l.match(/^[“"'](.+?)[”"']\s*[—–-]+\s*(.*)$/);
      const textPart = m ? m[1].trim() : l;
      const rest = m ? m[2] : "";
      const anchors = anchorsIn(rest);
      let status: ClaimStatus = /UNVERIFIED/i.test(rest) ? "unverified" : /VERIFIED/i.test(rest) ? "verified" : "unverified";
      if (/EDITORIAL|biên soạn/i.test(rest)) status = "editorial";
      if (status === "verified" && !canVerify(docId, { text: textPart, anchors, status })) {
        status = "unverified";
        warnings.push(`Claim "${textPart.slice(0, 50)}…": nguồn ghi VERIFIED nhưng chưa có bằng chứng đã đối chiếu → UNVERIFIED.`);
      }
      return { text: textPart, anchors, status };
    });

  const riskNotes = text(block("rui-ro"));
  const riskWord = fm.risk_accuracy ?? riskNotes.match(/(?:accuracy|rủi ro|độ chính xác)\s*[:\-]?\s*(thấp|trung bình|cao|low|medium|high)/i)?.[1] ?? "";
  const riskAccuracy: RiskLevel = /cao|high/i.test(riskWord) ? "high" : /trung|medium/i.test(riskWord) ? "medium" : /thấp|low/i.test(riskWord) ? "low" : "medium";
  if (!riskWord) warnings.push("Không đọc được mức rủi ro — mặc định trung bình.");

  const fmt = text(block("thoi-luong"));
  const durationSec = Number(fm.duration ?? fmt.match(/(\d{2,3})\s*s\b/)?.[1] ?? 60);
  if (!Number.isFinite(durationSec) || durationSec < 5 || durationSec > 600) throw new Error("Thời lượng brief phải từ 5 đến 600 giây");
  if (outline.length > 10) throw new Error("Brief có quá nhiều ý: tối đa 12 cảnh gồm hook và CTA");

  const continuityParts = [fm.continuity ?? "", ...riskNotes.split(/[;.]\s+/).filter((s) => /video trước|nhất quán|series/i.test(s))].filter(Boolean);
  const continuity = continuityParts.join(" ").trim();

  const cta = fm.cta ?? "";
  if (!cta) warnings.push("Brief không có CTA — sẽ dùng CTA mặc định của series (skill §1: một CTA duy nhất).");
  const hookNums = numbersIn(hook).filter((n) => !claims.some((c) => c.text.includes(n)));
  if (hookNums.length) warnings.push(`Hook chứa số liệu ${hookNums.join(", ")} chưa có anchor trong claim ledger — cần nguồn hoặc viết dạng giả định rõ.`);
  if (!outline.length) warnings.push("Không tìm thấy 'Dàn ý cảnh' — dùng template chuẩn.");
  const ideaCount = outline.filter((o, i) => !(i === outline.length - 1 && /^kết(?:\s|:|\+|$)/i.test(o))).length;
  if (ideaCount > 3 && durationSec <= 60) warnings.push(`${ideaCount} ý trong ${durationSec}s → mỗi cảnh < ${MIN_SCENE_SEC}s. Cân nhắc 90s hoặc gộp còn 3 ý (+ phần 2).`);
  if (claims.length === 0) warnings.push("Không có claim ledger — mọi số liệu trong lời đọc sẽ bị đánh UNVERIFIED.");
  if (!docId) warnings.push("Không đọc được doc_id nguồn.");
  if (/giả lập|mô phỏng|minh họa/i.test(riskNotes)) warnings.push("Brief có ví dụ giả lập → caption phải ghi 'mô phỏng minh họa'.");

  return {
    briefNo,
    title,
    series: fm.series ?? "",
    audience,
    angle,
    hook,
    hookType,
    cta,
    outline,
    claims,
    riskAccuracy,
    riskNotes,
    source: { docId, section, anchors: sourceAnchors },
    durationSec,
    continuity,
    raw: md.slice(0, 20000),
    warnings,
  };
}

const shortRole = (txt: string, prefix: string) => {
  const head = txt.split(/[:—–(,]/)[0].trim();
  return `${prefix} — ${head.length > 42 ? head.slice(0, 40) + "…" : head}`;
};

function scenesFromBrief(b: ParsedBrief, duration: number, cta: string): { scenes: SceneInput[]; outline: { order: number; text: string }[] } {
  if (!b.outline.length) {
    const scenes = standardScenes(duration);
    return { scenes, outline: [{ order: 0, text: `Hook: ${b.hook}` }, { order: scenes.length - 1, text: `CTA: ${cta}` }] };
  }
  const items = [...b.outline];
  const summary = items.length && /^kết(?:\s|:|\+|$)/i.test(items[items.length - 1]) ? items.pop()! : null;
  const hookDur = Math.min(10, duration / 6);
  const ctaDur = Math.min(5, duration / 12);
  const sumDur = summary ? Math.min(10, (duration - hookDur - ctaDur) / (items.length + 1)) : 0;
  const per = items.length ? (duration - hookDur - ctaDur - sumDur) / items.length : 0;
  const r1 = (x: number) => Math.round(x * 10) / 10;
  const plan: { role: string; start: number; end: number; hero: boolean; beat: string }[] = [];
  plan.push({ role: "HOOK + định hướng", start: 0, end: hookDur, hero: true, beat: `Hook: ${b.hook}` });
  let t = hookDur;
  items.forEach((txt, i) => {
    plan.push({ role: shortRole(txt, `Ý ${i + 1}`), start: r1(t), end: r1(t + per), hero: false, beat: txt });
    t += per;
  });
  if (summary) {
    plan.push({ role: "Tóm tắt một câu", start: r1(t), end: r1(t + sumDur), hero: false, beat: summary });
    t += sumDur;
  }
  plan.push({ role: "CTA duy nhất", start: r1(t), end: duration, hero: true, beat: `CTA: ${cta}` });
  const scenes = plan.map((p, i) => blankScene(i, p.start, p.end, p.role, p.hero));
  return { scenes, outline: plan.map((p, i) => ({ order: i, text: p.beat })) };
}

// ───────────────────────── Generators ─────────────────────────
function words(text: string) {
  return text.trim() ? text.trim().split(/\s+/).length : 0;
}
function sentences(text: string): string[] {
  const m = text.replace(/\s+/g, " ").trim().match(/[^.!?…]+[.!?…]*/g);
  return (m ?? []).map((s) => s.trim()).filter(Boolean);
}
function assTime(sec: number) {
  const ticks = Math.max(0, Math.round(sec * 100));
  return `${Math.floor(ticks / 360000)}:${String(Math.floor(ticks / 6000) % 60).padStart(2, "0")}:${String(Math.floor(ticks / 100) % 60).padStart(2, "0")}.${String(ticks % 100).padStart(2, "0")}`;
}
function assEscape(t: string) {
  return t.replace(/[{}]/g, "").replace(/\n/g, "\\N");
}
function assHeader(format: Format) {
  const labelMarginV = format === "timelapse" ? 740 : 120;
  return `[Script Info]
ScriptType: v4.00+
PlayResX: 1080
PlayResY: 1920
WrapStyle: 0
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Label,DejaVu Sans,${format === "timelapse" ? 96 : 54},&H0000FFFF,&H000000FF,&H80000000,&H80000000,-1,0,0,0,100,100,1,0,1,3,0,8,60,60,${labelMarginV},1
Style: Sub,DejaVu Sans,46,&H00FFFFFF,&H000000FF,&H80000000,&H80000000,-1,0,0,0,100,100,1,0,1,3,0,2,60,60,300,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
`;
}
function buildLabelsAss(p: Project, scenes: Scene[]) {
  const lines = scenes
    .filter((s) => s.label.trim())
    .map((s) => `Dialogue: 0,${assTime(s.startSec)},${assTime(s.endSec)},Label,,0,0,0,,{\\q2}${assEscape(s.label.trim())}`);
  return assHeader(p.format) + lines.join("\n") + "\n";
}
function subCues(s: Scene): { start: number; end: number; text: string }[] {
  const parts = sentences(s.voiceover);
  if (!parts.length) return [];
  const total = parts.reduce((a, b) => a + b.length, 0) || 1;
  const dur = s.endSec - s.startSec;
  let cursor = s.startSec;
  return parts.map((text, i) => {
    const share = i === parts.length - 1 ? s.endSec - cursor : (text.length / total) * dur;
    const start = cursor;
    const end = Math.min(s.endSec, cursor + share);
    cursor = end;
    return { start, end, text };
  });
}
function buildSubsAss(p: Project, scenes: Scene[]) {
  const lines = scenes.flatMap((s) =>
    subCues(s).map((c) => `Dialogue: 0,${assTime(c.start)},${assTime(c.end)},Sub,,0,0,0,,{\\q2}${assEscape(c.text)}`),
  );
  return assHeader(p.format) + lines.join("\n") + "\n";
}

const beatOf = (brief: Brief | null | undefined, order: number) => brief?.outline.find((o) => o.order === order)?.text ?? "";

function keyframePrompt(p: Project, s: Scene, brief?: Brief | null) {
  if (s.role.includes("End card")) return s.promptOverride.trim();
  const parts: string[] = [];
  if (s.promptOverride.trim()) parts.push(`CUSTOM STAGING: ${s.promptOverride.trim()}`);
  const beat = beatOf(brief, s.order);
  if (beat) parts.push(`SCENE INTENT (for staging only, never render text): ${beat}`);
  if (p.characterBible.trim()) parts.push(`CHARACTER (paste verbatim, keep identical in every scene): ${p.characterBible.trim()}`);
  parts.push(`SUBJECT: ${s.subject.trim() || "[chưa điền — ai đang làm gì]"}`);
  parts.push(`ENVIRONMENT: ${s.environment.trim() || "[chưa điền — ở đâu, chi tiết cụ thể]"}`);
  if (s.prop.trim()) parts.push(`PROP: ${s.prop.trim()}, resting on a real surface within arm's reach, correct relative size, consistent shadows`);
  if (s.animal.trim()) parts.push(`ANIMAL: ${s.animal.trim()}, natural animal behavior`);
  if (s.screenLayout !== "none") parts.push(`SCREEN STAGING: ${SCREEN_LAYOUTS[s.screenLayout].en}`);
  parts.push(
    `${SHOT_SIZES[s.shotSize].en}, subject centered in a vertical 9:16 frame, generous headroom and bottom margin for captions, right edge clear for TikTok UI.`,
  );
  parts.push(
    "Hands, eyes and objects physically consistent: hands rest on what they touch, eyes look at what they interact with, nothing floats.",
  );
  parts.push("Photorealistic, cinematic natural lighting, ultra detailed, 35mm look. No text, no letters, no watermark, no logo.");
  return parts.join("\n");
}
function motionPrompt(s: Scene) {
  const dur = s.endSec - s.startSec;
  return [
    `${CAMERAS[s.camera].en}, very slow, one camera movement only.`,
    `ACTION: ${s.action.trim() || "[chưa điền — một chuyển động duy nhất trong khung]"}.`,
    "Natural human movement, realistic body physics, subtle facial expression; ambient life in the background.",
    s.screenLayout !== "none" ? "Screen stays facing the person; hands stay on the device/keyboard." : "",
    "Keep the subject's face, clothing, product design and framing exactly as in the reference image. No text.",
    `About ${dur}s, vertical 9:16, 24fps. Audio track will be discarded.`,
  ]
    .filter(Boolean)
    .join(" ");
}

function hashtagList(s: string) {
  return (s.match(/#[\p{L}\p{N}_]+/gu) ?? []).map((h) => h.toLowerCase());
}
function captionText(p: Project) {
  const hook = p.caption.hook.trim() || (p.selectedHook >= 0 ? p.hooks[p.selectedHook]?.text ?? "" : "");
  return [hook, p.caption.body.trim(), p.caption.cta.trim(), hashtagList(p.caption.hashtags).join(" ")]
    .filter(Boolean)
    .join("\n\n");
}

function sh(s: string) {
  return `'${s.replace(/'/g, `'\\''`)}'`;
}
function buildFfmpegScript(p: Project, scenes: Scene[]) {
  const transition = 10 / 24;
  const slotDuration = (s: Scene) => (Math.round(s.endSec * 24) - Math.round(s.startSec * 24)) / 24;
  const dur = p.durationSec;
  const lines: string[] = ["#!/usr/bin/env bash", "# Director Studio — script dựng (ffmpeg). Chạy trong thư mục chứa asset.", "set -euo pipefail", `DUR=${dur}`, ""];
  const vis = scenes.filter((s) => !s.role.includes("End card"));
  lines.push("# 1) Chuẩn hoá clip: bỏ audio AI, 1080x1920, 24fps, đúng độ dài cảnh (clone frame cuối nếu clip ngắn)");
  vis.forEach((s) => {
    const d = (slotDuration(s) + (p.format === "timelapse" && s.order < scenes.length - 1 ? transition : 0)).toFixed(6);
    lines.push(
      `ffmpeg -y -i canh${s.order + 1}.mp4 -an -vf "scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,fps=24,tpad=stop_mode=clone:stop_duration=${d}" -t ${d} -c:v libx264 -crf 20 -pix_fmt yuv420p n${s.order + 1}.mp4`,
    );
  });
  const endCard = scenes.find((s) => s.role.includes("End card"));
  if (endCard) {
    const d = slotDuration(endCard).toFixed(6);
    lines.push(`ffmpeg -y -f lavfi -i color=c=black:s=1080x1920:r=24 -t ${d} -c:v libx264 -crf 20 -pix_fmt yuv420p n${endCard.order + 1}.mp4`);
  }
  lines.push("");
  if (p.format === "timelapse") {
    lines.push("# 2) Nối không cú cắt: cross-dissolve 10 frame (24fps), đã bù overlap vào clip nguồn giữa các keyframe");
    const all = [...vis, ...(endCard ? [endCard] : [])];
    const inputs = all.map((s) => `-i n${s.order + 1}.mp4`).join(" ");
    const T = transition;
    let acc = 0;
    const chain: string[] = [];
    all.forEach((s, i) => {
      const d = slotDuration(s) + (i < all.length - 1 ? T : 0);
      if (i === 0) {
        acc = d;
        return;
      }
      const prev = i === 1 ? "[0:v]" : `[v${i - 1}]`;
      const offset = (acc - T).toFixed(6);
      chain.push(`${prev}[${i}:v]xfade=transition=fade:duration=${T}:offset=${offset}[v${i}]`);
      acc = acc - T + d;
    });
    const last = all.length > 1 ? `[v${all.length - 1}]` : "[0:v]";
    lines.push(`ffmpeg -y ${inputs} -filter_complex ${sh(chain.join(";"))} -map ${sh(last)} -c:v libx264 -crf 20 -pix_fmt yuv420p video_raw.mp4`);
    lines.push("");
    lines.push("# 3) Nhạc rất nhỏ (≈ -40 dBFS) + ambient công trường xa, không voice-over; burn Label");
    lines.push(
      `ffmpeg -y -i video_raw.mp4 -stream_loop -1 -i beat.mp3 -filter_complex ${sh(
        `[1:a]atrim=0:${acc.toFixed(2)},asetpts=PTS-STARTPTS,volume=0.01,alimiter=limit=0.95:level=0:latency=1[aout];[0:v]subtitles=labels.ass[vout]`,
      )} -map "[vout]" -map "[aout]" -c:v libx264 -crf 20 -pix_fmt yuv420p -c:a aac -b:a 160k -shortest final.mp4`,
    );
  } else {
    lines.push("# 2) Nối cảnh");
    lines.push(`printf '%s\\n' ${vis.map((s) => sh(`file 'n${s.order + 1}.mp4'`)).join(" ")} > list.txt`);
    lines.push("ffmpeg -y -f concat -safe 0 -i list.txt -c copy video_raw.mp4");
    lines.push("");
    lines.push("# 3) Lời đọc từng cảnh (vo-canhN.mp3) + beat 0.15 có ducking + burn Label rồi Sub (.ass PlayRes 1080x1920)");
    const vo = vis.filter((s) => s.voiceover.trim());
    const inputs = ["-i video_raw.mp4", ...vo.map((s) => `-i vo-canh${s.order + 1}.mp3`), "-stream_loop -1 -i beat.mp3"].join(" ");
    const beatIdx = vo.length + 1;
    const delays = vo.map((s, i) => {
      const ms = Math.round(Math.round(s.startSec * 24) / 24 * 1000);
      const slot = slotDuration(s).toFixed(6);
      return `[${i + 1}:a]atrim=duration=${slot},asetpts=PTS-STARTPTS,apad=whole_dur=${slot},adelay=${ms}|${ms}[n${i + 1}]`;
    });
    const narr =
      vo.length > 0
        ? `${vo.map((_, i) => `[n${i + 1}]`).join("")}amix=inputs=${vo.length}:duration=longest:dropout_transition=0:normalize=0,apad=whole_dur=${dur},atrim=duration=${dur}[narr]`
        : "";
    const filter = [
      ...delays,
      narr,
      `[${beatIdx}:a]atrim=0:${dur},asetpts=PTS-STARTPTS,volume=0.15[beat]`,
      vo.length > 0
        ? "[narr]asplit=2[nkey][narr2];[beat][nkey]sidechaincompress=threshold=0.02:ratio=8:attack=200:release=800:makeup=1[ducked];[narr2][ducked]amix=inputs=2:duration=first:normalize=0,alimiter=limit=0.95:level=0:latency=1[aout]"
        : "[beat]alimiter=limit=0.95:level=0:latency=1[aout]",
      "[0:v]subtitles=labels.ass,subtitles=subs.ass[vout]",
    ]
      .filter(Boolean)
      .join(";");
    lines.push(
      `ffmpeg -y ${inputs} -filter_complex ${sh(filter)} -map "[vout]" -map "[aout]" -c:v libx264 -crf 20 -pix_fmt yuv420p -c:a aac -b:a 192k -t $DUR final.mp4`,
    );
  }
  lines.push("");
  lines.push("# 4) QC kỹ thuật + trích frame đầu/giữa/cuối và ranh giới cảnh");
  lines.push('ffprobe -v error -select_streams v:0 -show_entries stream=width,height,duration -of default=nw=1 final.mp4; ls -la final.mp4');
  const marks = Array.from(new Set([0.5, ...scenes.map((s) => s.startSec + 0.2).slice(1), dur / 2, dur - 0.5])).sort((a, b) => a - b);
  marks.forEach((t, i) => lines.push(`ffmpeg -y -ss ${t.toFixed(2)} -i final.mp4 -frames:v 1 qc_${String(i + 1).padStart(2, "0")}.png`));
  lines.push('echo "Nhắc: gắn nhãn nội dung AI khi đăng TikTok."');
  return lines.join("\n") + "\n";
}

function buildHandoff(p: Project, scenes: Scene[], brief: Brief | null) {
  const hook = p.selectedHook >= 0 ? p.hooks[p.selectedHook] : undefined;
  const L: string[] = [];
  L.push(`# ${p.title} — Production pack (${p.durationSec}s · ${p.format === "timelapse" ? "Timelapse công trình" : "Video giải thích"} · 1080x1920)`);
  L.push("");
  if (brief) {
    L.push("## Nguồn tri thức");
    L.push(`- Series: ${brief.series || "—"} · Brief: ${brief.briefNo || "—"}`);
    L.push(`- doc_id: \`${brief.source.docId || "—"}\` · ${brief.source.section || ""} · anchor: ${brief.source.anchors.map((a) => `[${a}]`).join(" ") || "—"}`);
    L.push(`- ${RISK[brief.risk.accuracy].label}${brief.risk.notes ? ` — ${brief.risk.notes}` : ""}`);
    if (brief.continuity) L.push(`- Continuity: ${brief.continuity}`);
    L.push("");
  }
  L.push("## Brief (một mục tiêu)");
  L.push(`- Giúp ai: ${p.brief.audience || "—"}`);
  L.push(`- Nỗi đau / việc cần giải quyết: ${p.brief.pain || "—"}`);
  L.push(`- Góc nhìn duy nhất: ${p.brief.angle || "—"}`);
  L.push(`- Bằng chứng / minh họa: ${p.brief.evidence || "—"}`);
  L.push(`- CTA duy nhất: ${p.brief.cta || "—"}`);
  L.push("");
  L.push("## Hook đã chọn");
  L.push(hook ? `**[${hookLabel(hook.type)}]** ${hook.text}` : "_chưa chọn_");
  if (p.hooks.length > 1) {
    L.push("");
    L.push("Các bản khác:");
    p.hooks.forEach((h, i) => {
      if (i !== p.selectedHook) L.push(`- [${hookLabel(h.type)}] ${h.text}`);
    });
  }
  L.push("");
  if (brief && brief.claims.length) {
    L.push("## Claim ledger");
    L.push("| Claim | Anchor | Trạng thái |");
    L.push("|---|---|---|");
    brief.claims.forEach((c) => L.push(`| ${c.text} | ${c.anchors.map((a) => `[${a}]`).join(" ") || "—"} | ${CLAIM_STATUS[c.status].label} |`));
    L.push("");
  }
  L.push("## Character bible (paste nguyên văn vào mọi prompt)");
  L.push(p.characterBible.trim() || "_chưa viết_");
  L.push("");
  L.push("## Production board");
  L.push("| # | Thời gian | Vai trò | Ý nội dung | Shot | Camera | Action | Cast / Env / Prop | Label | Takes | KF | Take | Duyệt | Ghép |");
  L.push("|---|---|---|---|---|---|---|---|---|---|---|---|---|---|");
  scenes.forEach((s) => {
    const cast = [s.subject, s.environment, s.prop, s.animal].filter(Boolean).join(" · ");
    const b = (x: boolean) => (x ? "☑" : "☐");
    L.push(
      `| ${s.order + 1} | ${s.startSec}–${s.endSec}s | ${s.role}${s.hero ? " ★" : ""} | ${beatOf(brief, s.order) || "—"} | ${SHOT_SIZES[s.shotSize].label} | ${CAMERAS[s.camera].label} | ${s.action || "—"} | ${cast || "—"} | ${s.label || "—"} | ${s.takes} | ${b(s.status.keyframe)} | ${b(s.status.take)} | ${b(s.status.approved)} | ${b(s.status.assembled)} |`,
    );
  });
  L.push("");
  L.push("## Handoff contract (CapCut → dựng)");
  L.push("- Clip/ảnh: `canh1.mp4`, `canh2.mp4`… đúng thứ tự cảnh, ưu tiên 9:16 (16:9 sẽ crop center). Xuất không watermark. Bỏ track audio AI khi ghép.");
  if (p.format !== "timelapse") L.push("- Giọng đọc: `vo-canh1.mp3`, `vo-canh2.mp3`… khớp từng cảnh (voice tiếng Việt, test 1 câu trước).");
  L.push("- Nhạc: `beat.mp3` (" + (p.format === "timelapse" ? "rất nhỏ −35…−45 dBFS, không voice-over" : "volume 0.15 + sidechain ducking dưới lời") + ").");
  L.push("- Kèm `labels.ass`, `subs.ass`, `build.sh` xuất từ app này.");
  L.push("");
  L.push("## Prompt từng cảnh");
  scenes.forEach((s) => {
    L.push(`### Cảnh ${s.order + 1} · ${s.startSec}–${s.endSec}s · ${s.role}`);
    L.push("**Keyframe prompt (ảnh trước):**");
    L.push("```");
    L.push(keyframePrompt(p, s, brief));
    L.push("```");
    L.push("**Motion prompt (image-to-video):**");
    L.push("```");
    L.push(motionPrompt(s));
    L.push("```");
    if (s.voiceover.trim()) L.push(`**Lời đọc (${words(s.voiceover)} từ):** ${s.voiceover.trim()}`);
    if (s.label.trim()) L.push(`**Label trên màn hình:** ${s.label.trim()}`);
    if (s.note.trim()) L.push(`**Ghi chú retry/fallback:** ${s.note.trim()}`);
    L.push("");
  });
  L.push("## Caption");
  L.push(captionText(p) || "_chưa viết_");
  L.push("");
  L.push("## QC đã tick");
  QC_GROUPS.forEach((g, gi) => {
    L.push(`**${g.title}**`);
    g.items.forEach((it, ii) => L.push(`- [${p.qc.includes(`${gi}-${ii}`) ? "x" : " "}] ${it}`));
  });
  L.push("");
  L.push("> Nội dung AI chân thực → gắn nhãn AI khi đăng. Giờ đăng gợi ý: 7–9h, 11–13h, 19–22h. 60 phút đầu: ghim 1 bình luận đặt câu hỏi, trả lời bình luận đầu bằng thông tin hữu ích.");
  return L.join("\n") + "\n";
}

// ───────────────────────── Lint (director's eye) ─────────────────────────
type Lint = { level: "warn" | "info"; text: string };
function lintProject(p: Project, scenes: Scene[], brief: Brief | null): Lint[] {
  const out: Lint[] = [];
  const isTl = p.format === "timelapse";
  if (!p.brief.audience.trim() || !p.brief.cta.trim()) out.push({ level: "warn", text: "Brief chưa đủ: cần rõ 'giúp ai' và 'CTA duy nhất'." });
  if (p.selectedHook < 0 && !isTl) out.push({ level: "warn", text: "Chưa chọn hook. Viết 5–10 bản rồi chọn bản RÕ nhất (không giật tít)." });
  if (!isTl && p.hooks.length > 0 && p.hooks.length < 5) out.push({ level: "info", text: `Mới có ${p.hooks.length} hook — skill khuyên viết 5–10 bản để so.` });
  if (!p.characterBible.trim() && !isTl) out.push({ level: "warn", text: "Chưa có character bible — không có nó nhân vật sẽ đổi mặt giữa các cảnh." });
  for (let i = 1; i < scenes.length; i++) {
    if (!isTl && scenes[i].shotSize === scenes[i - 1].shotSize)
      out.push({ level: "warn", text: `Cảnh ${i} và ${i + 1} cùng cỡ shot (${SHOT_SIZES[scenes[i].shotSize].label}) — xen kẽ toàn/trung/cận.` });
  }
  const claimText = brief ? brief.claims.filter(c => c.status === "verified").map((c) => c.text).join(" ") : "";
  scenes.forEach((s) => {
    const n = s.order + 1;
    const txt = `${s.subject} ${s.prop} ${s.action}`.toLowerCase();
    if (/màn hình|điện thoại|laptop|máy tính|screen|phone|tv|gọi video|ipad/.test(txt) && s.screenLayout === "none")
      out.push({ level: "warn", text: `Cảnh ${n} có màn hình nhưng chưa khóa bố cục (OTS / chính diện / PiP) — luật 7d.` });
    if (/giấy|hợp đồng|hóa đơn|tài liệu|bảng|checklist|document|paper|invoice|chart|diagram/.test(txt) && !/tay|người|hand|person|woman|man/.test(txt))
      out.push({ level: "info", text: `Cảnh ${n} chỉ có đồ vật/giấy tờ/sơ đồ — thêm bàn tay hoặc người đang thao tác (7c).` });
    if (s.hero && s.takes < 2) out.push({ level: "info", text: `Cảnh ${n} là cảnh hero — nên sinh 2 take để có coverage.` });
    if (!isTl) {
      const dur = s.endSec - s.startSec;
      if (dur < MIN_SCENE_SEC && !/CTA/i.test(s.role)) out.push({ level: "warn", text: `Cảnh ${n} chỉ ${dur}s (< ${MIN_SCENE_SEC}s) — gộp ý hoặc tăng thời lượng video.` });
      const budget = Math.round(dur * WORDS_PER_SEC);
      const w = words(s.voiceover);
      if (w > budget * 1.15) out.push({ level: "warn", text: `Cảnh ${n}: lời đọc ${w} từ vượt slot (~${budget} từ) — rút gọn nhưng GIỮ claim/disclaimer.` });
      if (brief && s.voiceover.trim()) {
        const loose = numbersIn(s.voiceover).filter((num) => !claimText.includes(num) && !/giả sử|ví dụ|minh họa|mô phỏng/i.test(s.voiceover));
        if (loose.length) out.push({ level: "warn", text: `Cảnh ${n}: số liệu ${loose.join(", ")} không có trong claim ledger — cần anchor hoặc ghi "giả sử/minh họa".` });
      }
    }
    if (s.order === 0 && !isTl && !s.label.trim()) out.push({ level: "info", text: "Cảnh hook chưa có chữ màn hình — hook cần lời + hình + chữ cùng thông điệp." });
  });
  if (!isTl) {
    const total = scenes.reduce((a, s) => a + words(s.voiceover), 0);
    const target = Math.round(p.durationSec * WORDS_PER_SEC);
    if (total > 0 && total > target * 1.1) out.push({ level: "warn", text: `Tổng lời đọc ${total} từ > mục tiêu ~${target} từ cho ${p.durationSec}s.` });
    const tags = hashtagList(p.caption.hashtags).length;
    if (p.caption.hashtags.trim() && (tags < 5 || tags > 8)) out.push({ level: "warn", text: `Caption có ${tags} hashtag — contract là 5–8.` });
  }
  if (brief) {
    const unverified = brief.claims.filter((c) => c.status === "unverified").length;
    if (unverified) out.push({ level: "warn", text: `${unverified} claim UNVERIFIED — xác minh với sources-index.json hoặc bỏ khỏi kịch bản.` });
    if (/giả lập|mô phỏng|minh họa/i.test(brief.risk.notes) && !/mô phỏng|minh họa|giả lập/i.test(captionText(p)))
      out.push({ level: "warn", text: "Brief có ví dụ giả lập — caption cần ghi rõ 'mô phỏng minh họa' (README kho tri thức)." });
    const hookText = p.selectedHook >= 0 ? p.hooks[p.selectedHook]?.text ?? "" : "";
    const hookNums = numbersIn(hookText).filter((num) => !claimText.includes(num));
    if (hookNums.length) out.push({ level: "warn", text: `Hook chứa số liệu ${hookNums.join(", ")} chưa có anchor — đổi thành câu không số hoặc thêm claim.` });
    if (brief.continuity) out.push({ level: "info", text: `Continuity: ${brief.continuity}` });
  }
  return out;
}


export { STEPS, HOOK_TYPES, hookLabel, SHOT_SIZES, CAMERAS, SCREEN_LAYOUTS, CLAIM_STATUS, RISK, TIMELAPSE_CAMERA_LOCK, TIMELAPSE_KF, QC_GROUPS, WORDS_PER_SEC, MIN_SCENE_SEC, blankStatus, SIZE_CYCLE, CAM_CYCLE, blankScene, standardScenes, timelapseScenes, slug, anchorsIn, stripQuotes, numbersIn, guessHookType, parseBrief, shortRole, scenesFromBrief, words, sentences, assTime, assEscape, assHeader, buildLabelsAss, subCues, buildSubsAss, beatOf, keyframePrompt, motionPrompt, hashtagList, captionText, sh, buildFfmpegScript, buildHandoff, lintProject };
export type { Project, Scene, Brief, SceneInput, Knowledge, HookType, ShotSize, CameraMove, ScreenLayout, Format, ClaimStatus, RiskLevel, StepId, ScenePatch, View, ParsedClaim, ParsedBrief, Lint };

// Keep frontmatter attached to its heading when importing one or several documents.
export function splitBriefDocuments(raw: string): string[] {
  const md = raw.replace(/\r\n?/g, "\n").trim();
  const fronts = Array.from(md.matchAll(/^---\n[\s\S]*?\n---\n(?=#\s)/gm));
  const starts = Array.from(md.matchAll(/^#\s+.+$/gm)).map(m => {
    const front = fronts.find(f => f.index! + f[0].length === m.index);
    return front?.index ?? m.index!;
  });
  if (!starts.length) return [md];
  return starts.map((start, i) => md.slice(start, starts[i + 1] ?? md.length).trim());
}
