import { knowledgeLibrary } from "./knowledgeLibrary";
import { apiAvailable, directorJson } from "./providerClient";
import { projectToWorkflow } from "../shared/projectWorkflow";
import { splitBriefDocuments } from "../shared/production";
import { canVerify, sourceRegistry } from "../shared/evidence";
import { Component, useEffect, useMemo, useState, type ReactNode } from "react";
import { useMutation, useQuery } from "./studioClient";
import { api } from "../convex/_generated/api";
import type { Doc, Id } from "../convex/_generated/dataModel";
import { useTypeAppSession } from "./studioClient";

import { Project, Scene, Brief, SceneInput, Knowledge, HookType, ShotSize, CameraMove, ScreenLayout, Format, ClaimStatus, RiskLevel, StepId, ScenePatch, View, STEPS, HOOK_TYPES, hookLabel, SHOT_SIZES, CAMERAS, SCREEN_LAYOUTS, CLAIM_STATUS, RISK, TIMELAPSE_CAMERA_LOCK, TIMELAPSE_KF, QC_GROUPS, WORDS_PER_SEC, MIN_SCENE_SEC, blankStatus, SIZE_CYCLE, CAM_CYCLE, blankScene, standardScenes, timelapseScenes, ParsedClaim, ParsedBrief, slug, anchorsIn, stripQuotes, numbersIn, guessHookType, parseBrief, shortRole, scenesFromBrief, words, sentences, assTime, assEscape, assHeader, buildLabelsAss, subCues, buildSubsAss, beatOf, keyframePrompt, motionPrompt, hashtagList, captionText, sh, buildFfmpegScript, buildHandoff, Lint, lintProject } from "../shared/production";

// ───────────────────────── Small UI helpers ─────────────────────────
function download(filename: string, text: string) {
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function CopyButton({ text, label = "Chép" }: { text: string; label?: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      className="button button-small"
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setDone(true);
          setTimeout(() => setDone(false), 1200);
        } catch {
          setDone(false);
        }
      }}
    >
      {done ? "Đã chép ✓" : label}
    </button>
  );
}

function Field(props: {
  value: string;
  onSave: (v: string) => void;
  placeholder?: string;
  multiline?: boolean;
  rows?: number;
  disabled?: boolean;
  mono?: boolean;
}) {
  const { value, onSave, placeholder, multiline, rows, disabled, mono } = props;
  const [local, setLocal] = useState(value);
  const [focused, setFocused] = useState(false);
  useEffect(() => {
    if (!focused) setLocal(value);
  }, [value, focused]);
  const commit = () => {
    setFocused(false);
    if (local !== value) onSave(local);
  };
  const cls = `input${mono ? " mono" : ""}`;
  if (multiline) {
    return (
      <textarea
        className={cls}
        rows={rows ?? 3}
        value={local}
        placeholder={placeholder}
        disabled={disabled}
        onChange={(e) => setLocal(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={commit}
      />
    );
  }
  return (
    <input
      className={cls}
      value={local}
      placeholder={placeholder}
      disabled={disabled}
      onChange={(e) => setLocal(e.target.value)}
      onFocus={() => setFocused(true)}
      onBlur={commit}
    />
  );
}

function Labeled({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="labeled">
      <span className="text-label">{label}</span>
      {children}
      {hint ? <span className="text-small text-muted">{hint}</span> : null}
    </label>
  );
}

function Guide({ children }: { children: ReactNode }) {
  return <div className="guide text-small">{children}</div>;
}

function ErrorText({ text }: { text: string | null }) {
  return text ? (
    <div className="text-small" style={{ color: "var(--error-text)" }}>
      {text}
    </div>
  ) : null;
}

class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  render() {
    if (this.state.error) {
      return (
        <div className="card">
          <p className="text-label" style={{ color: "var(--error-text)" }}>
            Không tải được dữ liệu
          </p>
          <p className="text-secondary text-small">{this.state.error.message}</p>
        </div>
      );
    }
    return this.props.children;
  }
}

// ───────────────────────── AI helpers (typeAi) ─────────────────────────
const aiAvailable = () => typeof window !== "undefined" && (!!window.typeAi?.available || apiAvailable());
async function aiJson<T>(prompt: string, schema: Record<string, unknown> & { type: "object" }, system: string): Promise<T> {
  return directorJson<T>(prompt, schema, system);
}
const DIRECTOR_SYSTEM =
  "Bạn là đạo diễn + nhà sản xuất video ngắn TikTok tiếng Việt làm việc trên nền tri thức có nguồn. Nguyên tắc: một mục tiêu một CTA; hook = [nỗi đau/kết quả] + [đối tượng] + [lời hứa cụ thể], rõ ràng không giật tít; KHÔNG đưa số liệu/nhận định nào ngoài claim ledger được cung cấp — ví dụ minh họa phải nói rõ 'giả sử'/'ví dụ'; không claim y tế/tài chính chắc nịch; không mô phỏng người thật; nhân vật hư cấu; mỗi cảnh một chuyển động, camera chậm; không chữ trong hình AI. Trả lời ngắn gọn, tiếng Việt.";

function briefContext(p: Project, brief: Brief | null) {
  const hook = p.selectedHook >= 0 ? p.hooks[p.selectedHook]?.text : "";
  const lines = [
    `Brief: giúp ${p.brief.audience}; nỗi đau: ${p.brief.pain}; góc nhìn: ${p.brief.angle}; bằng chứng: ${p.brief.evidence}; CTA: ${p.brief.cta}.`,
    `Hook chính: ${hook || "(chưa có)"}.`,
  ];
  if (brief?.claims.length) {
    lines.push("Claim ledger (chỉ được dùng các dữ kiện này):");
    brief.claims.filter(c => c.status !== "unverified").forEach((c) => lines.push(`- [${CLAIM_STATUS[c.status].label}] ${c.text} ${c.anchors.map((a) => `[${a}]`).join(" ")}`));
  }
  if (brief?.risk.notes) lines.push(`Rủi ro/gate: ${brief.risk.notes}`);
  if (brief?.continuity) lines.push(`Continuity: ${brief.continuity}`);
  return lines.join("\n");
}

async function aiFillShotList(p: Project, scenes: Scene[], brief: Brief | null, patchScene: (id: Id<"scenes">, patch: ScenePatch) => Promise<void>) {
  const r = await aiJson<{ scenes: { order: number; subject: string; environment: string; prop: string; animal: string; action: string; label: string }[] }>(
    `${briefContext(p, brief)}\nCharacter bible: ${p.characterBible || "(chưa có — nhân vật hư cấu)"}.\n\nCác cảnh:\n${scenes
      .map((s) => `${s.order + 1}. ${s.startSec}–${s.endSec}s · ${s.role} · ${SHOT_SIZES[s.shotSize].label} · ${CAMERAS[s.camera].label}${beatOf(brief, s.order) ? ` · Ý: ${beatOf(brief, s.order)}` : ""}`)
      .join("\n")}\n\nVới mỗi cảnh điền: subject (ai đang làm gì, tiếng Anh ≤ 15 từ, có người/bàn tay thật — không chỉ sơ đồ), environment (ở đâu, tiếng Anh ≤ 10 từ), prop (vật kể chuyện cụ thể neo cho ý trừu tượng, tiếng Anh ≤ 6 từ), animal (tiếng Anh hoặc rỗng), action (MỘT chuyển động duy nhất, tiếng Anh ≤ 10 từ, không phá logic tay–mắt–vật), label (chữ màn hình tiếng Việt ≤ 6 từ; cảnh 1 và CTA bắt buộc, cảnh khác có thể rỗng). Trả order đúng số thứ tự.`,
    {
      type: "object",
      properties: {
        scenes: {
          type: "array",
          items: {
            type: "object",
            properties: {
              order: { type: "integer" },
              subject: { type: "string" },
              environment: { type: "string" },
              prop: { type: "string" },
              animal: { type: "string" },
              action: { type: "string" },
              label: { type: "string" },
            },
            required: ["order", "subject", "environment", "prop", "animal", "action", "label"],
          },
        },
      },
      required: ["scenes"],
    },
    DIRECTOR_SYSTEM,
  );
  const byOrder = new Map(scenes.map((s) => [s.order + 1, s]));
  const pick = (cur: string, next: unknown) => (cur.trim() ? cur : typeof next === "string" ? next.trim().slice(0, 1000) : cur);
  await Promise.all(
    (r.scenes ?? []).map(async (x) => {
      const s = byOrder.get(Number(x.order));
      if (!s) return;
      await patchScene(s._id, {
        subject: pick(s.subject, x.subject),
        environment: pick(s.environment, x.environment),
        prop: pick(s.prop, x.prop),
        animal: pick(s.animal, x.animal),
        action: pick(s.action, x.action),
        label: pick(s.label, x.label),
      });
    }),
  );
}

async function aiWriteVo(p: Project, scenes: Scene[], brief: Brief | null, patchScene: (id: Id<"scenes">, patch: ScenePatch) => Promise<void>) {
  const target = Math.round(p.durationSec * WORDS_PER_SEC);
  const r = await aiJson<{ lines: { order: number; text: string }[] }>(
    `${briefContext(p, brief)}\n\nViết lời đọc tiếng Việt cho từng cảnh, tổng ~${target} từ cho ${p.durationSec}s (2,5 từ/giây). Mỗi cảnh ≤ số từ cho phép:\n${scenes
      .map(
        (s) =>
          `${s.order + 1}. ${s.role} (${s.startSec}–${s.endSec}s, tối đa ${Math.round((s.endSec - s.startSec) * WORDS_PER_SEC)} từ)${beatOf(brief, s.order) ? ` — ý: ${beatOf(brief, s.order)}` : ""}${s.action ? ` — hình: ${s.action}` : ""}`,
      )
      .join("\n")}\nQuy tắc: cảnh 1 mở bằng hook; giá trị đầu tiên trước giây 15; mỗi cảnh một ý + một cầu nối; cảnh cuối MỘT CTA duy nhất; viết số bằng chữ để TTS đọc đúng; chỉ dùng dữ kiện trong claim ledger, ví dụ minh họa phải có chữ "giả sử"/"ví dụ"; không claim y tế/tài chính chắc nịch.`,
    {
      type: "object",
      properties: {
        lines: {
          type: "array",
          items: { type: "object", properties: { order: { type: "integer" }, text: { type: "string" } }, required: ["order", "text"] },
        },
      },
      required: ["lines"],
    },
    DIRECTOR_SYSTEM,
  );
  const byOrder = new Map(scenes.map((s) => [s.order + 1, s]));
  await Promise.all(
    (r.lines ?? []).map(async (x) => {
      const s = byOrder.get(Number(x.order));
      if (!s || typeof x.text !== "string") return;
      await patchScene(s._id, { voiceover: x.text.trim().slice(0, 2000) });
    }),
  );
}

type ClaimFinding = { scene: number; sentence: string; status: "covered" | "uncovered" | "illustrative"; reason: string };
async function aiCheckClaims(p: Project, scenes: Scene[], brief: Brief): Promise<ClaimFinding[]> {
  const r = await aiJson<{ findings: ClaimFinding[] }>(
    `Claim ledger:\n${brief.claims.map((c) => `- [${CLAIM_STATUS[c.status].label}] ${c.text} ${c.anchors.map((a) => `[${a}]`).join(" ")}`).join("\n") || "(trống)"}\n\nLời đọc theo cảnh:\n${scenes
      .filter((s) => s.voiceover.trim())
      .map((s) => `${s.order + 1}. ${s.voiceover.trim()}`)
      .join("\n")}\n\nTách lời đọc thành từng câu có nhận định/số liệu. Với mỗi câu: status = covered (được claim ledger bao phủ), illustrative (ví dụ giả định, có chữ giả sử/ví dụ), uncovered (nhận định/số liệu không có trong ledger). reason ≤ 15 từ. Chỉ liệt kê câu có nhận định; bỏ câu chuyển tiếp/CTA.`,
    {
      type: "object",
      properties: {
        findings: {
          type: "array",
          items: {
            type: "object",
            properties: {
              scene: { type: "integer" },
              sentence: { type: "string" },
              status: { type: "string", enum: ["covered", "uncovered", "illustrative"] },
              reason: { type: "string" },
            },
            required: ["scene", "sentence", "status", "reason"],
          },
        },
      },
      required: ["findings"],
    },
    "Bạn là biên tập viên kiểm chứng (fact-check) cho video tri thức. Chỉ đối chiếu với claim ledger được cung cấp, không dùng kiến thức ngoài. Trả lời tiếng Việt, ngắn gọn.",
  );
  return (r.findings ?? []).filter((f) => typeof f.sentence === "string" && ["covered", "uncovered", "illustrative"].includes(f.status));
}

// ───────────────────────── App ─────────────────────────
export default function App() {
  const [view, setView] = useState<View>({ kind: "welcome" });
  const open = (id: Id<"projects">) => setView({ kind: "project", id });
  return (
    <div className="studio">
      <ErrorBoundary>
        <Sidebar view={view} onSelect={open} onIntake={() => setView({ kind: "intake" })} />
      </ErrorBoundary>
      <main className="studio-main">
        <ErrorBoundary>
          {view.kind === "project" ? (
            <Workspace projectId={view.id} onDeleted={() => setView({ kind: "welcome" })} />
          ) : view.kind === "intake" ? (
            <Intake onCreated={open} />
          ) : (
            <Welcome onIntake={() => setView({ kind: "intake" })} />
          )}
        </ErrorBoundary>
      </main>
    </div>
  );
}

function Welcome({ onIntake }: { onIntake: () => void }) {
  const { capabilities } = useTypeAppSession();
  return (
    <div className="welcome">
      <h1>Director Studio</h1>
      <p className="text-secondary">
        Hệ thống tạo video tri thức cho TikTok 9:16: kho tri thức có nguồn → brief → production board → prompt/lời đọc có kiểm chứng → phụ đề .ass, mix
        beat → QC 5 lượt → gói bàn giao.
      </p>
      <div className="pipeline">
        {[
          "Tri thức: brief 8 trường + claim ledger có anchor → nhập một hoặc cả series",
          "Tiền kỳ: brief, hook, character bible, shot list có logic vật lý, ý nội dung từng cảnh",
          "Quay: keyframe trước, animate sau; 2 take cảnh hero; dailies frame giữa",
          "Dựng & QC: 1080x1920, sub .ass, beat 0.15 + ducking; số liệu phải có anchor; gắn nhãn AI",
        ].map((t, i) => (
          <div key={i} className="card pipeline-step">
            <span className="badge badge-info">{i + 1}</span>
            <span className="text-small">{t}</span>
          </div>
        ))}
      </div>
      {capabilities.write ? (
        <div className="row">
          <button className="button button-primary" type="button" onClick={onIntake}>
            Nhập brief tri thức
          </button>
          <span className="text-small text-muted">hoặc tạo dự án trống ở cột bên trái.</span>
        </div>
      ) : (
        <p className="text-small text-muted">Chọn một dự án ở cột bên trái.</p>
      )}
    </div>
  );
}

// ───────────────────────── Sidebar ─────────────────────────
function Sidebar({ view, onSelect, onIntake }: { view: View; onSelect: (id: Id<"projects">) => void; onIntake: () => void }) {
  const projects = useQuery(api.app.listProjects);
  const briefs = useQuery(api.app.listBriefs);
  const create = useMutation(api.app.createProject);
  const { capabilities } = useTypeAppSession();
  const canWrite = capabilities.write;

  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [format, setFormat] = useState<Format>("standard");
  const [duration, setDuration] = useState(60);
  const [tl, setTl] = useState({
    boiCanh: "narrow urban lot between two concrete houses, paved street in foreground, dense city skyline behind",
    vatNeo: "giant granite boulder, 8 meters tall, occupying half the lot",
    kienTruc: "modern minimalist 3-storey villa, raw concrete, floor-to-ceiling glass, vertical wood slats",
    chu: "Nể phục",
  });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const selectedId = view.kind === "project" ? view.id : null;

  const submit = async () => {
    if (!title.trim()) {
      setErr("Cần tiêu đề dự án");
      return;
    }
    setBusy(true);
    setErr(null);
    try {
      const scenes = format === "timelapse" ? timelapseScenes(tl) : standardScenes(duration);
      const id = await create({
        title: title.trim(),
        format,
        durationSec: format === "timelapse" ? 60 : duration,
        timelapse: format === "timelapse" ? tl : undefined,
        scenes,
        now: Date.now(),
      });
      setTitle("");
      setOpen(false);
      onSelect(id);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Không tạo được dự án");
    } finally {
      setBusy(false);
    }
  };

  const briefMap = useMemo(() => new Map((briefs ?? []).map((b) => [b.projectId, b])), [briefs]);
  const groups = useMemo(() => {
    const map = new Map<string, NonNullable<typeof projects>>();
    (projects ?? []).forEach((p) => {
      const b = briefMap.get(p._id);
      const key = b?.series?.trim() || (b ? "Series chưa đặt tên" : "Dự án lẻ");
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(p);
    });
    return Array.from(map.entries()).sort((a, b) => (a[0] === "Dự án lẻ" ? 1 : b[0] === "Dự án lẻ" ? -1 : a[0].localeCompare(b[0])));
  }, [projects, briefMap]);

  return (
    <aside className="studio-side">
      <div className="side-head">
        <div>
          <div className="text-label">Director Studio</div>
          <div className="text-small text-muted">TikTok 9:16 · 1080x1920</div>
        </div>
        {canWrite ? (
          <button className="button button-primary button-small" type="button" onClick={() => setOpen((o) => !o)}>
            {open ? "Đóng" : "+ Dự án"}
          </button>
        ) : null}
      </div>
      {canWrite ? (
        <button className={`button${view.kind === "intake" ? " button-primary" : ""}`} type="button" onClick={onIntake}>
          Nhập brief tri thức (.md)
        </button>
      ) : null}

      {open && canWrite ? (
        <div className="card new-project">
          <Labeled label="Tiêu đề video">
            <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="VD: 3 lỗi khiến video tụt view" />
          </Labeled>
          <Labeled label="Format">
            <div className="segment">
              <button type="button" className={`segment-item${format === "standard" ? " on" : ""}`} onClick={() => setFormat("standard")}>
                Giải thích / kể chuyện
              </button>
              <button type="button" className={`segment-item${format === "timelapse" ? " on" : ""}`} onClick={() => setFormat("timelapse")}>
                Timelapse công trình
              </button>
            </div>
          </Labeled>
          {format === "standard" ? (
            <Labeled label="Thời lượng" hint="Mỗi cảnh ≈ 10s · 30s = 4 cảnh · 60s = 6 cảnh">
              <div className="segment">
                {[30, 45, 60].map((d) => (
                  <button key={d} type="button" className={`segment-item${duration === d ? " on" : ""}`} onClick={() => setDuration(d)}>
                    {d}s
                  </button>
                ))}
              </div>
            </Labeled>
          ) : (
            <>
              <Guide>Bản 60s: KF01 → 04 → 08 → 13 → 19 → 24 → 29 + end card. Camera khóa, vật neo KHÔNG BAO GIỜ xê dịch.</Guide>
              <Labeled label="[BỐI CẢNH]">
                <textarea className="input" rows={2} value={tl.boiCanh} onChange={(e) => setTl({ ...tl, boiCanh: e.target.value })} />
              </Labeled>
              <Labeled label="[VẬT NEO] — nghịch lý không gian">
                <textarea className="input" rows={2} value={tl.vatNeo} onChange={(e) => setTl({ ...tl, vatNeo: e.target.value })} />
              </Labeled>
              <Labeled label="[KIẾN TRÚC]">
                <textarea className="input" rows={2} value={tl.kienTruc} onChange={(e) => setTl({ ...tl, kienTruc: e.target.value })} />
              </Labeled>
              <Labeled label="[CHỮ] overlay">
                <input className="input" value={tl.chu} onChange={(e) => setTl({ ...tl, chu: e.target.value })} />
              </Labeled>
            </>
          )}
          <ErrorText text={err} />
          <button className="button button-primary" type="button" disabled={busy} onClick={submit}>
            {busy ? "Đang tạo…" : "Tạo production board"}
          </button>
        </div>
      ) : null}

      <div className="side-list">
        {projects === undefined ? (
          <div className="text-small text-muted">Đang tải…</div>
        ) : projects.length === 0 ? (
          <div className="text-small text-muted empty">Chưa có dự án nào.</div>
        ) : (
          groups.map(([series, items]) => (
            <div key={series} className="side-group">
              <div className="side-group-title text-small text-muted">
                {series} · {items.length}
              </div>
              {items.map((p) => {
                const b = briefMap.get(p._id);
                return (
                  <button key={p._id} type="button" className={`side-item${selectedId === p._id ? " on" : ""}`} onClick={() => onSelect(p._id)}>
                    <span className="side-item-title">
                      {b?.briefNo ? <span className="text-muted">{b.briefNo} · </span> : null}
                      {p.title}
                    </span>
                    <span className="text-small text-muted">
                      {p.format === "timelapse" ? "Timelapse" : "Giải thích"} · {p.durationSec}s
                      {b ? ` · ${b.verified}✓${b.unverified ? ` ${b.unverified}?` : ""}` : ""}
                    </span>
                  </button>
                );
              })}
            </div>
          ))
        )}
      </div>
      {!canWrite ? <div className="text-small text-muted">Chế độ xem — không thể chỉnh sửa.</div> : null}
    </aside>
  );
}

// ───────────────────────── Intake (knowledge → projects) ─────────────────────────
function Intake({ onCreated }: { onCreated: (id: Id<"projects">) => void }) {
  const create = useMutation(api.app.createProjectFromBrief);
  const { capabilities } = useTypeAppSession();
  const canWrite = capabilities.write;
  const [series, setSeries] = useState("");
  const [cta, setCta] = useState("Lưu video và theo dõi để xem phần tiếp theo của series");
  const [bible, setBible] = useState("");
  const [durationMode, setDurationMode] = useState<"auto" | 60 | 75 | 90>("auto");
  const [paste, setPaste] = useState("");
  const [items, setItems] = useState<ParsedBrief[]>([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const addText = (md: string) => {
    let parsed: ParsedBrief[];
    try { parsed = splitBriefDocuments(md).map(parseBrief); } catch (e) { setErr(e instanceof Error ? e.message : "Brief không hợp lệ"); return; }
    setItems((prev) => [...prev, ...parsed]);
  };
  const onFiles = async (files: FileList | null) => {
    if (!files) return;
    const texts = await Promise.all(Array.from(files).map((f) => f.text()));
    texts.forEach(addText);
  };
  const audiences = Array.from(new Set(items.map((b) => b.audience.trim()).filter(Boolean)));

  const submit = async () => {
    if (!items.length) return;
    setBusy(true);
    setErr(null);
    try {
      let first: Id<"projects"> | null = null;
      for (const b of items) {
        const duration = durationMode === "auto" ? b.durationSec : durationMode;
        const ctaFinal = b.cta || cta;
        const { scenes, outline } = scenesFromBrief(b, duration, ctaFinal);
        const verified = b.claims.filter((c) => c.status === "verified").length;
        const knowledge: Knowledge = {
          series: series.trim() || b.series,
          briefNo: b.briefNo,
          source: b.source,
          claims: b.claims,
          risk: { accuracy: b.riskAccuracy, notes: b.riskNotes },
          outline,
          continuity: b.continuity,
          raw: b.raw,
        };
        const id = await create({
          title: b.title,
          durationSec: duration,
          now: Date.now(),
          brief: {
            audience: b.audience,
            pain: b.hook,
            angle: b.angle,
            evidence: b.claims.length
              ? `${verified}/${b.claims.length} claim VERIFIED — ${b.source.docId || "nguồn"} ${b.source.section} ${b.source.anchors.map((a) => `[${a}]`).join(" ")}`.trim()
              : "",
            cta: ctaFinal,
          },
          hooks: b.hook ? [{ type: b.hookType, text: b.hook }] : [],
          selectedHook: b.hook ? 0 : -1,
          characterBible: bible,
          scenes,
          knowledge,
        });
        first = first ?? id;
      }
      setItems([]);
      setPaste("");
      if (first) onCreated(first);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Không tạo được dự án");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="workspace">
      <header className="ws-head">
        <div className="ws-title">
          <h2>Nhập brief tri thức → production board</h2>
          <p className="text-small text-muted">
            Đọc brief 8 trường (Nguồn · Đối tượng · Góc mới · Hook · Dàn ý cảnh · Claim ledger · Rủi ro/gate · Format) ở dạng bullet hiện tại hoặc frontmatter v2.
            Mỗi brief → 1 dự án; nhiều brief → 1 series dùng chung character bible + CTA.
          </p>
        </div>
      </header>
      <div className="grid-2">
        <div className="stack">
          <div className="card">
            <h3>Cấp series (dùng chung)</h3>
            <Labeled label="Ghi đè tên series (tùy chọn)" hint="Để trống giữ series của từng brief. Khán giả khác nhau nên tách series.">
              <input className="input" value={series} onChange={(e) => setSeries(e.target.value)} placeholder="VD: nn-co-ban" />
            </Labeled>
            <Labeled label="CTA mặc định (khi brief không có CTA)">
              <input className="input" value={cta} onChange={(e) => setCta(e.target.value)} />
            </Labeled>
            <Labeled label="Character bible chung cho series" hint="Nhân vật hư cấu, tiếng Anh, 40–90 từ. Có thể sửa riêng từng dự án sau.">
              <textarea
                className="input"
                rows={4}
                value={bible}
                onChange={(e) => setBible(e.target.value)}
                placeholder="VD: Vietnamese male presenter, late 20s, short neat black hair, round thin-frame glasses, navy knit sweater over white tee, calm friendly expression. Same outfit in every scene."
              />
            </Labeled>
            <Labeled label="Thời lượng" hint="Auto = theo brief (thường 60s). Brief có > 3 ý nên dùng 90s.">
              <div className="segment">
                {(["auto", 60, 75, 90] as const).map((d) => (
                  <button key={String(d)} type="button" className={`segment-item${durationMode === d ? " on" : ""}`} onClick={() => setDurationMode(d)}>
                    {d === "auto" ? "Theo brief" : `${d}s`}
                  </button>
                ))}
              </div>
            </Labeled>
          </div>
          <div className="card">
            <h3>Kho brief đã đấu nối</h3>
            <p className="text-small text-muted">6 brief v2 · 2 series. Tài liệu gốc và sources-index.json chưa được cung cấp; claim có nguồn chưa đối chiếu giữ UNVERIFIED.</p>
            <div className="row wrap">
              {["nn-co-ban", "ai-agent-doanh-nghiep"].map(name => <button className="button" key={name} onClick={() => knowledgeLibrary.filter(b => b.series === name).forEach(b => addText(b.raw))}>{name} · 3 brief</button>)}
            </div>
            {knowledgeLibrary.map(b => <button className="button library-item" key={b.path} onClick={() => addText(b.raw)}>{b.title}</button>)}
            <h3>Thêm brief của bạn</h3>
            <label className="button">
              Chọn file .md (nhiều file)
              <input type="file" accept=".md,.txt,text/markdown" multiple hidden onChange={(e) => onFiles(e.target.files)} />
            </label>
            <textarea className="input mono" rows={10} value={paste} onChange={(e) => setPaste(e.target.value)} placeholder="…hoặc dán nội dung brief vào đây (có thể dán nhiều brief liền nhau, mỗi brief bắt đầu bằng '# ')" />
            <button
              className="button"
              type="button"
              disabled={!paste.trim()}
              onClick={() => {
                addText(paste);
                setPaste("");
              }}
            >
              Phân tích brief đã dán
            </button>
          </div>
        </div>
        <div className="stack">
          <div className="card">
            <div className="row space-between">
              <h3>Đã phân tích ({items.length})</h3>
              {items.length ? (
                <button className="button button-small" type="button" onClick={() => setItems([])}>
                  Xóa hết
                </button>
              ) : null}
            </div>
            {!items.length ? <p className="text-small text-muted empty">Chưa có brief nào. Chọn file hoặc dán nội dung.</p> : null}
            {audiences.length > 1 ? (
              <div className="text-small lint-warn">
                {audiences.length} nhóm khán giả trong danh sách nhập ({audiences.map((a) => a.slice(0, 30)).join(" · ")}) — cân nhắc tách series.
              </div>
            ) : null}
            {items.map((b, i) => {
              const duration = durationMode === "auto" ? b.durationSec : durationMode;
              const { scenes } = scenesFromBrief(b, duration, b.cta || cta);
              return (
                <div key={i} className="intake-item">
                  <div className="row space-between">
                    <div>
                      <b>
                        {b.briefNo ? `${b.briefNo} · ` : ""}
                        {b.title}
                      </b>
                      <div className="text-small text-muted">
                        {b.audience || "—"} · {duration}s · {scenes.length} cảnh · {b.claims.length} claim ({b.claims.filter((c) => c.status === "verified").length} ✓) ·{" "}
                        {b.source.docId || "không rõ nguồn"} {b.source.section}
                      </div>
                    </div>
                    <div className="row">
                      <span className={`badge ${RISK[b.riskAccuracy].badge}`}>{RISK[b.riskAccuracy].label}</span>
                      <button className="button button-small" type="button" onClick={() => setItems((prev) => prev.filter((_, j) => j !== i))}>
                        Bỏ
                      </button>
                    </div>
                  </div>
                  <Timeline scenesLike={scenes} duration={duration} />
                  {b.warnings.length ? (
                    <ul className="lint-list">
                      {b.warnings.map((w, k) => (
                        <li key={k} className="lint-warn">
                          {w}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              );
            })}
            <ErrorText text={err} />
            {canWrite ? (
              <button className="button button-primary" type="button" disabled={!items.length || busy} onClick={submit}>
                {busy ? "Đang tạo…" : `Tạo ${items.length || ""} dự án từ brief`}
              </button>
            ) : (
              <p className="text-small text-muted">Chế độ xem — không thể tạo dự án.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ───────────────────────── Workspace ─────────────────────────
function Workspace({ projectId, onDeleted }: { projectId: Id<"projects">; onDeleted: () => void }) {
  const data = useQuery(api.app.getProject, { projectId });
  const brief = useQuery(api.app.getBrief, { projectId });
  const updateProject = useMutation(api.app.updateProject);
  const updateScene = useMutation(api.app.updateScene);
  const replaceScenes = useMutation(api.app.replaceScenes);
  const deleteProject = useMutation(api.app.deleteProject);
  const upsertBrief = useMutation(api.app.upsertBrief);
  const { capabilities } = useTypeAppSession();
  const canWrite = capabilities.write;
  const [step, setStep] = useState<StepId>("brief");
  const [error, setError] = useState<string | null>(null);
  const [drafting, setDrafting] = useState<string | null>(null);

  useEffect(() => {
    setStep("brief");
    setError(null);
  }, [projectId]);

  const run = async (fn: () => Promise<unknown>) => {
    try {
      setError(null);
      await fn();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Có lỗi xảy ra");
    }
  };

  if (data === undefined || brief === undefined) return <div className="text-muted">Đang tải dự án…</div>;
  if (data === null)
    return (
      <div className="card">
        <p>Dự án không còn tồn tại.</p>
      </div>
    );
  const { project, scenes } = data;
  const lints = lintProject(project, scenes, brief);
  const patchProject = (patch: Parameters<typeof updateProject>[0]["patch"]) => run(() => updateProject({ projectId, patch, now: Date.now() }));
  const patchScene = (sceneId: Id<"scenes">, patch: ScenePatch) => run(() => updateScene({ sceneId, patch, now: Date.now() }));
  const patchBrief = (patch: Parameters<typeof upsertBrief>[0]["patch"]) => run(() => upsertBrief({ projectId, patch, now: Date.now() }));

  const progress = scenes.length ? Math.round((scenes.filter((s) => s.status.approved).length / scenes.length) * 100) : 0;
  const warnCount = lints.filter((l) => l.level === "warn").length;

  const draftAll = async () => {
    setDrafting("Đang điền shot list…");
    try {
      await aiFillShotList(project, scenes, brief, patchScene);
      setDrafting("Đang viết lời đọc…");
      await aiWriteVo(project, scenes, brief, patchScene);
      setStep("shots");
    } catch (e) {
      setError(e instanceof Error ? e.message : "AI không phản hồi");
    } finally {
      setDrafting(null);
    }
  };

  const ctx: StepCtx = { project, scenes, brief, canWrite, patchProject, patchScene, patchBrief, run, replaceScenes, lints };

  return (
    <div className="workspace">
      <header className="ws-head">
        <div className="ws-title">
          {canWrite ? <Field value={project.title} onSave={(v) => patchProject({ title: v })} /> : <h2>{project.title}</h2>}
          <div className="row ws-meta">
            {brief?.series ? <span className="badge badge-info">Series: {brief.series}</span> : null}
            <span className="badge">{project.format === "timelapse" ? "Timelapse công trình" : "Giải thích / kể chuyện"}</span>
            <span className="badge">
              {project.durationSec}s · {scenes.length} cảnh
            </span>
            {brief ? <span className={`badge ${RISK[brief.risk.accuracy].badge}`}>{RISK[brief.risk.accuracy].label}</span> : null}
            {brief ? (
              <span className="badge">
                Claim {brief.claims.filter((c) => c.status === "verified").length}✓ / {brief.claims.length}
              </span>
            ) : null}
            <span className={`badge ${progress === 100 ? "badge-success" : "badge-info"}`}>Duyệt {progress}%</span>
            {warnCount ? <span className="badge badge-warning">{warnCount} cảnh báo</span> : <span className="badge badge-success">Không cảnh báo</span>}
          </div>
        </div>
        <div className="row">
          {canWrite && aiAvailable() && project.format !== "timelapse" ? (
            <button className="button button-primary button-small" type="button" disabled={!!drafting} onClick={draftAll} title="AI điền ô trống shot list rồi viết lời đọc theo beat + claim ledger">
              {drafting ?? "⚡ AI dựng nháp"}
            </button>
          ) : null}
          {canWrite ? (
            <button
              className="button button-small danger"
              type="button"
              onClick={() => {
                if (confirm("Xóa dự án này và toàn bộ cảnh?")) run(() => deleteProject({ projectId }).then(onDeleted));
              }}
            >
              Xóa
            </button>
          ) : null}
        </div>
      </header>

      <nav className="steps">
        {STEPS.map((s) => (
          <button key={s.id} type="button" className={`step${step === s.id ? " on" : ""}`} onClick={() => setStep(s.id)}>
            {s.label}
          </button>
        ))}
      </nav>

      {error ? <div className="card alert-error text-small">{error}</div> : null}

      <section className="step-body">
        {step === "brief" && <BriefStep {...ctx} />}
        {step === "claims" && <ClaimStep {...ctx} />}
        {step === "hook" && <HookStep {...ctx} />}
        {step === "cast" && <CastStep {...ctx} />}
        {step === "shots" && <ShotsStep {...ctx} />}
        {step === "prompts" && <PromptsStep {...ctx} />}
        {step === "audio" && <AudioStep {...ctx} />}
        {step === "caption" && <CaptionStep {...ctx} />}
        {step === "qc" && <QcStep {...ctx} />}
      </section>
    </div>
  );
}

type StepCtx = {
  project: Project;
  scenes: Scene[];
  brief: Brief | null;
  canWrite: boolean;
  patchProject: (patch: {
    title?: string;
    brief?: Project["brief"];
    hooks?: Project["hooks"];
    selectedHook?: number;
    characterBible?: string;
    timelapse?: Project["timelapse"];
    caption?: Project["caption"];
    qc?: string[];
  }) => Promise<void>;
  patchScene: (sceneId: Id<"scenes">, patch: ScenePatch) => Promise<void>;
  patchBrief: (patch: Partial<Omit<Knowledge, "raw">>) => Promise<void>;
  run: (fn: () => Promise<unknown>) => Promise<void>;
  replaceScenes: (args: { projectId: Id<"projects">; scenes: SceneInput[]; now: number }) => Promise<null>;
  lints: Lint[];
};

// ───────────────────────── Step 1: Brief ─────────────────────────
function BriefStep({ project, scenes, brief, canWrite, patchProject }: StepCtx) {
  const b = project.brief;
  const save = (k: keyof Project["brief"]) => (v: string) => patchProject({ brief: { ...b, [k]: v } });
  return (
    <div className="grid-2">
      <div className="card">
        <h3>Brief — mỗi video chỉ một mục tiêu chính</h3>
        <Guide>Không làm "cho tất cả mọi người". Thiếu ô nào thì hỏi đúng 1 câu rồi làm tiếp.</Guide>
        <Labeled label="Người xem cụ thể">
          <Field value={b.audience} onSave={save("audience")} disabled={!canWrite} placeholder="VD: người mới làm TikTok 3 tháng, đăng đều nhưng view dưới 500" />
        </Labeled>
        <Labeled label="Giúp họ việc gì / nỗi đau nào?">
          <Field value={b.pain} onSave={save("pain")} disabled={!canWrite} multiline rows={2} placeholder="VD: video tụt view ngay 3 giây đầu" />
        </Labeled>
        <Labeled label="Góc nhìn DUY NHẤT của video" hint="Không ôm đồm. Một angle, 2–3 ý, mỗi ý một bằng chứng.">
          <Field value={b.angle} onSave={save("angle")} disabled={!canWrite} multiline rows={2} placeholder="VD: 3 lỗi hook phổ biến và cách sửa trong 10 giây" />
        </Labeled>
        <Labeled label="Bằng chứng / minh họa sẽ dùng" hint={brief ? "Nguồn & claim chi tiết ở bước 2 · Claim ledger" : undefined}>
          <Field value={b.evidence} onSave={save("evidence")} disabled={!canWrite} multiline rows={2} placeholder="VD: so sánh trước–sau 2 bản hook; số liệu % dừng 3s" />
        </Labeled>
        <Labeled label="CTA duy nhất" hint="theo dõi / lưu / bình luận / link bio — chọn MỘT">
          <Field value={b.cta} onSave={save("cta")} disabled={!canWrite} placeholder="VD: Lưu video này lại trước khi quay bản tiếp theo" />
        </Labeled>
      </div>
      <div className="stack">
        {brief ? (
          <div className="card">
            <h3>Nguồn tri thức</h3>
            <table className="mini-table">
              <tbody>
                <tr>
                  <td>Series</td>
                  <td>{brief.series || "—"}</td>
                </tr>
                <tr>
                  <td>doc_id</td>
                  <td>
                    <code>{brief.source.docId || "—"}</code> {brief.source.section}
                  </td>
                </tr>
                <tr>
                  <td>Anchor</td>
                  <td>{brief.source.anchors.map((a) => `[${a}]`).join(" ") || "—"}</td>
                </tr>
                <tr>
                  <td>Rủi ro</td>
                  <td>
                    <span className={`badge ${RISK[brief.risk.accuracy].badge}`}>{RISK[brief.risk.accuracy].label}</span>
                  </td>
                </tr>
              </tbody>
            </table>
            <details>
              <summary className="text-small">Brief gốc</summary>
              <pre className="prompt small">{brief.raw || "—"}</pre>
            </details>
          </div>
        ) : null}
        <div className="card">
          <h3>Timeline kế hoạch {project.durationSec}s</h3>
          <Timeline scenesLike={scenes} duration={project.durationSec} />
          <table className="mini-table"><tbody>{scenes.map(scene => <tr key={scene._id}>
            <td>{scene.startSec}–{scene.endSec}s</td><td>{scene.role}</td>
          </tr>)}</tbody></table>
        </div>
        <div className="card">
          <h3>Guardrails</h3>
          <ul className="text-small checklist-plain">
            <li>Original-first: nguồn chỉ là tín hiệu chủ đề + dữ kiện — góc kể, lời dẫn viết mới; không re-upload.</li>
            <li>Mọi số liệu lấy từ claim ledger có anchor; không để AI "tính nhẩm".</li>
            <li>Không claim y tế/tài chính chắc nịch; không hứa thu nhập.</li>
            <li>Không mô phỏng người thật khi chưa có consent văn bản. Nội dung AI chân thực → gắn nhãn AI.</li>
            <li>Sản phẩm thật: verify hình dáng bằng ảnh ref TRƯỚC khi vẽ keyframe.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

function Timeline({ scenesLike, duration }: { scenesLike?: SceneInput[] | Scene[]; duration: number }) {
  if (!scenesLike) return null;
  return (
    <div className="timeline">
      {scenesLike.map((s, i) => (
        <div key={i} className={`tl-seg${s.hero ? " hero" : ""}`} style={{ flexGrow: s.endSec - s.startSec }} title={`${s.role} (${s.startSec}–${s.endSec}s)`}>
          <span>{s.startSec}s</span>
        </div>
      ))}
      <div className="tl-end text-small text-muted">{duration}s</div>
    </div>
  );
}

// ───────────────────────── Step 2: Claim ledger ─────────────────────────
function ClaimStep({ project, scenes, brief, canWrite, patchBrief }: StepCtx) {
  const [busy, setBusy] = useState(false);
  const [aiErr, setAiErr] = useState<string | null>(null);
  const [findings, setFindings] = useState<ClaimFinding[] | null>(null);
  if (!brief) {
    return (
      <div className="card">
        <h3>Dự án này chưa có lớp tri thức</h3>
        <p className="text-small text-muted">Claim ledger giữ mọi số liệu / nhận định có anchor nguồn. Lời đọc chỉ được dùng dữ kiện trong ledger.</p>
        {canWrite ? (
          <button className="button button-primary" type="button" onClick={() => patchBrief({ claims: [] })}>
            Tạo claim ledger trống
          </button>
        ) : null}
      </div>
    );
  }
  const claims = brief.claims;
  const setClaims = (next: Brief["claims"]) => patchBrief({ claims: next });
  const update = (i: number, patch: Partial<Brief["claims"][number]>) => setClaims(claims.map((c, j) => (j === i ? { ...c, ...patch } : c)));
  const parseAnchors = (s: string) => Array.from(new Set((s.match(/\d{1,3}/g) ?? []).map((a) => a.padStart(2, "0"))));
  const check = async () => {
    setBusy(true);
    setAiErr(null);
    try {
      setFindings(await aiCheckClaims(project, scenes, brief));
    } catch (e) {
      setAiErr(e instanceof Error ? e.message : "AI không phản hồi");
    } finally {
      setBusy(false);
    }
  };
  const hasVo = scenes.some((s) => s.voiceover.trim());
  return (
    <div className="grid-2">
      <div className="stack">
        <div className="card">
          <div className="row space-between">
            <h3>Claim ledger ({claims.length})</h3>
            {canWrite ? (
              <button className="button button-small" type="button" onClick={() => setClaims([...claims, { text: "", anchors: [], status: "unverified" }])}>
                + Claim
              </button>
            ) : null}
          </div>
          <Guide>
            Mỗi claim = một nhận định cần đối chiếu trước khi dùng trong video. <b>VERIFIED</b> cần mã nguồn <code>[NN]</code> và bằng chứng đã được người duyệt đối chiếu; chỉ tham chiếu "mục" →{" "}
            <b>EDITORIAL</b> (diễn đạt như ý kiến biên soạn); <b>UNVERIFIED</b> không được lên kịch bản.
          </Guide>
          <p className="text-small lint-warn">Nguồn chưa có: {sourceRegistry.filter(s => !s.available).map(s => s.file).join(" · ")} · sources-index.json.</p>
          {!claims.length ? <p className="text-small text-muted empty">Chưa có claim.</p> : null}
          {claims.map((c, i) => (
            <div key={i} className="claim-row">
              <Field value={c.text} disabled={!canWrite} multiline rows={2} onSave={(v) => update(i, { text: v })} placeholder="Dữ kiện được phép nói…" />
              <div className="claim-meta">
                <Field value={c.anchors.join(", ")} disabled={!canWrite} onSave={(v) => update(i, { anchors: parseAnchors(v) })} placeholder="anchor: 41, 42" />
                <select className="input" value={c.status} disabled={!canWrite} onChange={(e) => update(i, { status: e.target.value as ClaimStatus })}>
                  {(Object.keys(CLAIM_STATUS) as ClaimStatus[]).map((k) => (
                    <option key={k} value={k} disabled={k === "verified" && !canVerify(brief.source.docId, c)}>
                      {CLAIM_STATUS[k].label}
                    </option>
                  ))}
                </select>
                <span className={`badge ${CLAIM_STATUS[c.status].badge}`}>{c.anchors.map((a) => `[${a}]`).join(" ") || "no anchor"}</span>
                {canWrite ? (
                  <button className="button button-small" type="button" onClick={() => setClaims(claims.filter((_, j) => j !== i))}>
                    Xóa
                  </button>
                ) : null}
              </div>
            </div>
          ))}
        </div>
        <div className="card">
          <h3>Nguồn, rủi ro, continuity</h3>
          <div className="grid-3">
            <Labeled label="Series">
              <Field value={brief.series} disabled={!canWrite} onSave={(v) => patchBrief({ series: v })} placeholder="nn-co-ban" />
            </Labeled>
            <Labeled label="Mã brief">
              <Field value={brief.briefNo} disabled={!canWrite} onSave={(v) => patchBrief({ briefNo: v })} placeholder="01" />
            </Labeled>
            <Labeled label="Mức rủi ro sai lệch">
              <select className="input" value={brief.risk.accuracy} disabled={!canWrite} onChange={(e) => patchBrief({ risk: { ...brief.risk, accuracy: e.target.value as RiskLevel } })}>
                {(Object.keys(RISK) as RiskLevel[]).map((k) => (
                  <option key={k} value={k}>
                    {RISK[k].label}
                  </option>
                ))}
              </select>
            </Labeled>
            <Labeled label="doc_id">
              <Field value={brief.source.docId} disabled={!canWrite} onSave={(v) => patchBrief({ source: { ...brief.source, docId: v } })} placeholder="nn-knowledge-map-v1" />
            </Labeled>
            <Labeled label="Mục">
              <Field value={brief.source.section} disabled={!canWrite} onSave={(v) => patchBrief({ source: { ...brief.source, section: v } })} placeholder="mục 2" />
            </Labeled>
            <Labeled label="Anchor nguồn">
              <Field value={brief.source.anchors.join(", ")} disabled={!canWrite} onSave={(v) => patchBrief({ source: { ...brief.source, anchors: parseAnchors(v) } })} placeholder="41, 42, 44" />
            </Labeled>
          </div>
          <Labeled label="Ghi chú rủi ro / gate" hint="Ví dụ giả lập → caption phải ghi 'mô phỏng minh họa'. Không claim y tế/tài chính.">
            <Field value={brief.risk.notes} disabled={!canWrite} multiline rows={2} onSave={(v) => patchBrief({ risk: { ...brief.risk, notes: v } })} />
          </Labeled>
          <Labeled label="Continuity — nhất quán với video trước trong series" hint="Mốc năm, số liệu, cách gọi tên đã dùng (VD: 2012 AlexNet, 2017 Transformer).">
            <Field value={brief.continuity} disabled={!canWrite} multiline rows={2} onSave={(v) => patchBrief({ continuity: v })} />
          </Labeled>
        </div>
      </div>
      <div className="stack">
        <div className="card">
          <div className="row space-between">
            <h3>Đối chiếu lời đọc ↔ ledger</h3>
            {aiAvailable() ? (
              <button className="button" type="button" disabled={busy || !hasVo} onClick={check}>
                {busy ? "Đang đối chiếu…" : "AI đối chiếu"}
              </button>
            ) : null}
          </div>
          <Guide>AI chỉ tách câu và so với ledger — kết quả là gợi ý để người duyệt, không tự sửa kịch bản.</Guide>
          {!hasVo ? <p className="text-small text-muted">Chưa có lời đọc (bước 7) để đối chiếu.</p> : null}
          <ErrorText text={aiErr} />
          {findings ? (
            findings.length ? (
              <ul className="finding-list">
                {findings.map((f, i) => (
                  <li key={i} className={`finding ${f.status}`}>
                    <span className={`badge ${f.status === "covered" ? "badge-success" : f.status === "illustrative" ? "badge-info" : "badge-error"}`}>
                      {f.status === "covered" ? "khớp ledger" : f.status === "illustrative" ? "ví dụ giả định" : "KHÔNG có nguồn"}
                    </span>
                    <div>
                      <div className="text-small">
                        Cảnh {f.scene}: “{f.sentence}”
                      </div>
                      <div className="text-small text-muted">{f.reason}</div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-small text-muted">Không tìm thấy câu có nhận định/số liệu.</p>
            )
          ) : null}
        </div>
        <div className="card">
          <h3>Dàn ý (ý nội dung từng cảnh)</h3>
          <p className="text-small text-muted">Beat từ brief — AI shot-list dịch beat thành SUBJECT/ENV/PROP/ACTION cụ thể; lời đọc bám beat.</p>
          {scenes.map((s) => (
            <div key={s._id} className="beat-row">
              <span className="text-small text-muted">
                {s.order + 1} · {s.startSec}–{s.endSec}s
              </span>
              <Field
                value={beatOf(brief, s.order)}
                disabled={!canWrite}
                onSave={(v) => {
                  const next = brief.outline.filter((o) => o.order !== s.order);
                  if (v.trim()) next.push({ order: s.order, text: v });
                  patchBrief({ outline: next.sort((a, b) => a.order - b.order) });
                }}
                placeholder={s.role}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ───────────────────────── Step 3: Hook ─────────────────────────
function HookStep({ project, brief, canWrite, patchProject }: StepCtx) {
  const [type, setType] = useState<HookType>("ket_qua");
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [aiErr, setAiErr] = useState<string | null>(null);
  const hooks = project.hooks;

  const add = () => {
    if (!text.trim()) return;
    patchProject({ hooks: [...hooks, { type, text: text.trim() }] });
    setText("");
  };
  const remove = (i: number) => {
    const next = hooks.filter((_, j) => j !== i);
    const sel = project.selectedHook === i ? -1 : project.selectedHook > i ? project.selectedHook - 1 : project.selectedHook;
    patchProject({ hooks: next, selectedHook: sel });
  };
  const suggest = async () => {
    setBusy(true);
    setAiErr(null);
    try {
      const r = await aiJson<{ hooks: { type: string; text: string }[] }>(
        `${briefContext(project, brief)}\n\nViết 6 hook mở đầu (≤ 18 từ mỗi hook), mỗi hook một dạng: ket_qua, sai_lam, doi_lap, cau_hoi, demo, cau_chuyen. Giúp đúng người nhận ra "cái này cho vấn đề của mình". Không dùng số liệu nào ngoài claim ledger.`,
        {
          type: "object",
          properties: {
            hooks: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  type: { type: "string", enum: HOOK_TYPES.map((h) => h.key) },
                  text: { type: "string" },
                },
                required: ["type", "text"],
              },
            },
          },
          required: ["hooks"],
        },
        DIRECTOR_SYSTEM,
      );
      const valid = (r.hooks ?? [])
        .filter((h) => HOOK_TYPES.some((t) => t.key === h.type) && typeof h.text === "string" && h.text.trim())
        .map((h) => ({ type: h.type as HookType, text: h.text.trim().slice(0, 600) }));
      if (valid.length) await patchProject({ hooks: [...hooks, ...valid].slice(0, 20) });
    } catch (e) {
      setAiErr(e instanceof Error ? e.message : "AI không phản hồi");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid-2">
      <div className="card">
        <h3>Hook mở đầu video</h3>
        <Guide>
          Công thức: <b>[Nỗi đau / kết quả] + [đối tượng] + [lời hứa cụ thể]</b>. Viết 5–10 bản, chọn bản RÕ nhất — không giật tít, không số liệu chưa có anchor.
        </Guide>
        <div className="hook-types">
          {HOOK_TYPES.map((h) => (
            <button key={h.key} type="button" className={`chip${type === h.key ? " on" : ""}`} onClick={() => setType(h.key)} title={h.example}>
              {h.label}
            </button>
          ))}
        </div>
        <p className="text-small text-muted">Ví dụ dạng này: “{HOOK_TYPES.find((h) => h.key === type)?.example}”</p>
        {canWrite ? (
          <>
            <textarea className="input" rows={2} value={text} onChange={(e) => setText(e.target.value)} placeholder="Viết một bản hook…" />
            <div className="row">
              <button className="button button-primary" type="button" onClick={add} disabled={!text.trim()}>
                Thêm hook
              </button>
              {aiAvailable() ? (
                <button className="button" type="button" onClick={suggest} disabled={busy}>
                  {busy ? "Đang gợi ý…" : "Gợi ý 6 hook bằng AI"}
                </button>
              ) : null}
            </div>
            <ErrorText text={aiErr} />
          </>
        ) : null}
      </div>
      <div className="card">
        <h3>Các bản hook ({hooks.length})</h3>
        {hooks.length === 0 ? (
          <p className="text-small text-muted empty">Chưa có hook nào.</p>
        ) : (
          <ul className="hook-list">
            {hooks.map((h, i) => (
              <li key={i} className={`hook-item${project.selectedHook === i ? " on" : ""}`}>
                <button
                  type="button"
                  className="hook-pick"
                  disabled={!canWrite}
                  onClick={() => patchProject({ selectedHook: project.selectedHook === i ? -1 : i })}
                  title="Chọn làm hook chính"
                >
                  {project.selectedHook === i ? "●" : "○"}
                </button>
                <div className="hook-text">
                  <span className="badge">{hookLabel(h.type)}</span> {h.text}
                </div>
                {canWrite ? (
                  <button type="button" className="button button-small" onClick={() => remove(i)}>
                    Xóa
                  </button>
                ) : null}
              </li>
            ))}
          </ul>
        )}
        {project.selectedHook >= 0 && hooks[project.selectedHook] ? (
          <Guide>
            Hook chính: <b>{hooks[project.selectedHook].text}</b>. Trong video, hook phải xuất hiện bằng lời + hình + chữ màn hình (Label cảnh 1) cùng một thông điệp.
          </Guide>
        ) : null}
      </div>
    </div>
  );
}

// ───────────────────────── Step 4: Casting ─────────────────────────
function CastStep({ project, canWrite, patchProject }: StepCtx) {
  const isTl = project.format === "timelapse";
  return (
    <div className="grid-2">
      <div className="card">
        <h3>{isTl ? "Bối cảnh khóa (4 ô)" : "Character bible — khóa casting một lần"}</h3>
        {isTl ? (
          <>
            <Guide>Đổi 4 ô này sẽ cần tạo lại shot list (bước 5 → "Tạo lại từ template") để prompt cập nhật.</Guide>
            {(["boiCanh", "vatNeo", "kienTruc", "chu"] as const).map((k) => (
              <Labeled key={k} label={{ boiCanh: "[BỐI CẢNH]", vatNeo: "[VẬT NEO]", kienTruc: "[KIẾN TRÚC]", chu: "[CHỮ]" }[k]}>
                <Field value={project.timelapse[k]} disabled={!canWrite} multiline={k !== "chu"} rows={2} onSave={(v) => patchProject({ timelapse: { ...project.timelapse, [k]: v } })} />
              </Labeled>
            ))}
          </>
        ) : (
          <>
            <Guide>
              Viết MỘT đoạn mô tả nhân vật duy nhất (tuổi, tóc, trang phục từng cảnh, đặc điểm nhận dạng) và paste nguyên văn vào mọi prompt keyframe. Đổi 1 chữ = đổi nhân vật.
              Cùng một series dùng cùng một bible để xây nhận diện kênh.
            </Guide>
            <Field
              value={project.characterBible}
              disabled={!canWrite}
              multiline
              rows={8}
              onSave={(v) => patchProject({ characterBible: v })}
              placeholder="VD: Vietnamese woman, early 30s, shoulder-length straight black hair tucked behind ears, small silver stud earrings, sage-green linen shirt with sleeves rolled, no glasses, warm neutral makeup, calm confident expression. Same outfit in every scene."
            />
            <p className="text-small text-muted">{words(project.characterBible)} từ · nên 40–90 từ, viết tiếng Anh để model giữ đúng.</p>
          </>
        )}
      </div>
      <div className="stack">
        <div className="card">
          <h3>Cast & world — 4 yếu tố mỗi cảnh (7c)</h3>
          <ul className="text-small checklist-plain">
            <li>
              <b>SUBJECT</b> — ai, đang làm gì (diễn xuất tự nhiên).
            </li>
            <li>
              <b>ENVIRONMENT</b> — ở đâu, cụ thể: quán cà phê, xưởng, lớp học, kho hàng…
            </li>
            <li>
              <b>PROP</b> — vật kể chuyện neo cho ý trừu tượng: bảng trắng, mô hình, hộp gia vị, phiếu kho…
            </li>
            <li>
              <b>ANIMAL</b> — chó/mèo/chim nếu hợp, tạo sức sống đời thường.
            </li>
            <li>Ý trừu tượng (sơ đồ, đường cong, vòng lặp) → luôn có bàn tay/người thao tác trên vật thật.</li>
          </ul>
        </div>
        <div className="card">
          <h3>Logic vật lý (7d) — kiểm tra trên giấy trước khi generate</h3>
          <ul className="text-small checklist-plain">
            <li>Tay – mắt – vật khớp: tay gõ → màn hình đối diện mặt; mắt nhìn vào vật đang tương tác.</li>
            <li>Màn hình luôn ĐỐI DIỆN người xem nó — viết "screen facing toward her", "in front of her" không đủ.</li>
            <li>Cảnh có màn hình chỉ dùng 1/3 bố cục: Over-the-shoulder · Chính diện (thấy lưng máy) · PiP.</li>
            <li>Đồ vật có chỗ đứng, không lơ lửng; bóng đổ nhất quán.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

// ───────────────────────── Step 5: Shot list / Production board ─────────────────────────
function ShotsStep({ project, scenes, brief, canWrite, patchScene, run, replaceScenes, lints }: StepCtx) {
  const [busy, setBusy] = useState(false);
  const [aiErr, setAiErr] = useState<string | null>(null);
  const isTl = project.format === "timelapse";

  const regenerate = () => {
    if (!confirm("Tạo lại toàn bộ cảnh từ template? Nội dung đã điền trong các cảnh sẽ mất.")) return;
    const next = isTl ? timelapseScenes(project.timelapse) : brief?.raw ? scenesFromBrief(parseBrief(brief.raw), project.durationSec, project.brief.cta).scenes : standardScenes(project.durationSec);
    run(() => replaceScenes({ projectId: project._id, scenes: next, now: Date.now() }));
  };
  const suggest = async () => {
    setBusy(true);
    setAiErr(null);
    try {
      await aiFillShotList(project, scenes, brief, patchScene);
    } catch (e) {
      setAiErr(e instanceof Error ? e.message : "AI không phản hồi");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="stack">
      <div className="card">
        <div className="row space-between">
          <div>
            <h3>Production board — {scenes.length} cảnh</h3>
            <p className="text-small text-muted">
              Mỗi cảnh ≈ 10s: SHOT · CAMERA (một chuyển động, chậm) · ACTION (một chuyển động trong khung) · SUBJECT / ENVIRONMENT / PROP / ANIMAL. ★ = cảnh hero, 2 take. Không ghép
              cảnh nào chưa duyệt.
            </p>
          </div>
          {canWrite ? (
            <div className="row">
              {!isTl && aiAvailable() ? (
                <button className="button" type="button" onClick={suggest} disabled={busy}>
                  {busy ? "Đang gợi ý…" : "AI điền ô trống"}
                </button>
              ) : null}
              <button className="button button-small" type="button" onClick={regenerate}>
                Tạo lại từ template
              </button>
            </div>
          ) : null}
        </div>
        <ErrorText text={aiErr} />
        <Timeline scenesLike={scenes} duration={project.durationSec} />
      </div>

      {lints.length ? (
        <div className="card lint">
          <h3>Mắt đạo diễn</h3>
          <ul>
            {lints.map((l, i) => (
              <li key={i} className={`lint-${l.level}`}>
                {l.text}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {scenes.map((s) => (
        <SceneCard key={s._id} scene={s} beat={beatOf(brief, s.order)} canWrite={canWrite} isTl={isTl} onPatch={(patch) => patchScene(s._id, patch)} />
      ))}
    </div>
  );
}

function SceneCard({ scene: s, beat, canWrite, isTl, onPatch }: { scene: Scene; beat: string; canWrite: boolean; isTl: boolean; onPatch: (patch: ScenePatch) => void }) {
  const statusKeys: (keyof Scene["status"])[] = ["keyframe", "take", "approved", "assembled"];
  const statusLabel: Record<keyof Scene["status"], string> = { keyframe: "Keyframe", take: "Take", approved: "Duyệt", assembled: "Ghép" };
  return (
    <div className={`card scene${s.hero ? " hero" : ""}`}>
      <div className="scene-head">
        <div className="scene-no">{s.order + 1}</div>
        <div className="scene-title">
          <Field value={s.role} disabled={!canWrite} onSave={(v) => onPatch({ role: v })} />
          <span className="text-small text-muted">
            {s.startSec}–{s.endSec}s · {(s.endSec - s.startSec).toFixed(0)}s{s.hero ? " · ★ hero" : ""}
          </span>
          {beat ? <span className="beat text-small">Ý: {beat}</span> : null}
        </div>
        <div className="status-row">
          {statusKeys.map((k) => (
            <label key={k} className={`status-pill${s.status[k] ? " on" : ""}`}>
              <input type="checkbox" checked={s.status[k]} disabled={!canWrite} onChange={(e) => onPatch({ status: { ...s.status, [k]: e.target.checked } })} />
              {statusLabel[k]}
            </label>
          ))}
        </div>
      </div>

      <div className="scene-grid">
        <Labeled label="SHOT">
          <select className="input" value={s.shotSize} disabled={!canWrite} onChange={(e) => onPatch({ shotSize: e.target.value as ShotSize })}>
            {(Object.keys(SHOT_SIZES) as ShotSize[]).map((k) => (
              <option key={k} value={k}>
                {SHOT_SIZES[k].label}
              </option>
            ))}
          </select>
        </Labeled>
        <Labeled label="CAMERA">
          <select className="input" value={s.camera} disabled={!canWrite} onChange={(e) => onPatch({ camera: e.target.value as CameraMove })}>
            {(Object.keys(CAMERAS) as CameraMove[]).map((k) => (
              <option key={k} value={k}>
                {CAMERAS[k].label}
              </option>
            ))}
          </select>
        </Labeled>
        <Labeled label="Bố cục màn hình (7d)">
          <select className="input" value={s.screenLayout} disabled={!canWrite} onChange={(e) => onPatch({ screenLayout: e.target.value as ScreenLayout })}>
            {(Object.keys(SCREEN_LAYOUTS) as ScreenLayout[]).map((k) => (
              <option key={k} value={k}>
                {SCREEN_LAYOUTS[k].label}
              </option>
            ))}
          </select>
        </Labeled>
        <Labeled label="Takes">
          <select className="input" value={s.takes} disabled={!canWrite} onChange={(e) => onPatch({ takes: Number(e.target.value) })}>
            {[1, 2, 3].map((n) => (
              <option key={n} value={n}>
                {n} take
              </option>
            ))}
          </select>
        </Labeled>
        <Labeled label="ACTION — một chuyển động duy nhất">
          <Field value={s.action} disabled={!canWrite} onSave={(v) => onPatch({ action: v })} placeholder="VD: she slowly turns the phone face-down on the table" />
        </Labeled>
        <Labeled label="Chữ màn hình (Label)">
          <Field value={s.label} disabled={!canWrite} onSave={(v) => onPatch({ label: v })} placeholder="chèn bằng .ass, không bake vào clip AI" />
        </Labeled>
        {!isTl ? (
          <>
            <Labeled label="SUBJECT — ai, đang làm gì">
              <Field value={s.subject} disabled={!canWrite} onSave={(v) => onPatch({ subject: v })} placeholder="VD: woman sitting directly in front of the laptop, both hands on the keyboard" />
            </Labeled>
            <Labeled label="ENVIRONMENT — ở đâu">
              <Field value={s.environment} disabled={!canWrite} onSave={(v) => onPatch({ environment: v })} placeholder="VD: small sunlit café, blurred customers in background" />
            </Labeled>
            <Labeled label="PROP — vật kể chuyện">
              <Field value={s.prop} disabled={!canWrite} onSave={(v) => onPatch({ prop: v })} placeholder="VD: a paper invoice and a ceramic coffee cup" />
            </Labeled>
            <Labeled label="ANIMAL (nếu hợp)">
              <Field value={s.animal} disabled={!canWrite} onSave={(v) => onPatch({ animal: v })} placeholder="VD: a small tabby cat asleep on the chair behind" />
            </Labeled>
          </>
        ) : null}
        <div className="span-2">
          <Labeled label="Ghi chú retry / fallback (Ken Burns, take hạ cấp…)">
            <Field value={s.note} disabled={!canWrite} onSave={(v) => onPatch({ note: v })} placeholder="VD: take 2 biến dạng tay → dùng Ken Burns từ keyframe đã duyệt" />
          </Labeled>
        </div>
      </div>
    </div>
  );
}

// ───────────────────────── Step 6: Prompts ─────────────────────────
function PromptsStep({ project, scenes, brief, canWrite, patchScene }: StepCtx) {
  const all = scenes.map((s) => `### Cảnh ${s.order + 1} — ${s.role}\nKEYFRAME:\n${keyframePrompt(project, s, brief)}\n\nMOTION:\n${motionPrompt(s)}`).join("\n\n");
  return (
    <div className="stack">
      <div className="card">
        <div className="row space-between">
          <div>
            <h3>Prompt từng cảnh — ảnh trước, video sau</h3>
            <p className="text-small text-muted">
              Sinh keyframe → soi logic từng ảnh → mới animate. Kiểm tra độ phân giải và fps thực tế của clip trước khi chuẩn hóa; trích frame giữa mỗi clip trước khi ghép.
            </p>
          </div>
          <div className="row">
            <CopyButton text={all} label="Chép tất cả" />
            <button className="button button-small" type="button" onClick={() => download(`${slug(project.title)}-prompts.md`, all)}>
              Tải .md
            </button>
          </div>
        </div>
      </div>
      {scenes.map((s) => (
        <div key={s._id} className="card">
          <div className="row space-between">
            <h3>
              Cảnh {s.order + 1} · {s.startSec}–{s.endSec}s · {s.role}
            </h3>
            <span className="text-small text-muted">
              {SHOT_SIZES[s.shotSize].label} · {CAMERAS[s.camera].label}
            </span>
          </div>
          <div className="grid-2">
            <div>
              <div className="row space-between">
                <span className="text-label">Keyframe prompt (generate_image / CapCut AI image)</span>
                <CopyButton text={keyframePrompt(project, s, brief)} />
              </div>
              <pre className="prompt">{keyframePrompt(project, s, brief)}</pre>
            </div>
            <div>
              <div className="row space-between">
                <span className="text-label">Motion prompt (image-to-video / Seedance)</span>
                <CopyButton text={motionPrompt(s)} />
              </div>
              <pre className="prompt">{motionPrompt(s)}</pre>
            </div>
          </div>
          <details>
            <summary className="text-small">Ghi đè keyframe prompt (tùy chọn)</summary>
            <Field
              value={s.promptOverride}
              disabled={!canWrite}
              multiline
              rows={5}
              mono
              onSave={(v) => patchScene(s._id, { promptOverride: v })}
              placeholder="Để trống = dùng prompt tự sinh ở trên. Điền để thay toàn bộ."
            />
          </details>
        </div>
      ))}
    </div>
  );
}

// ───────────────────────── Step 7: Audio ─────────────────────────
function AudioStep({ project, scenes, brief, canWrite, patchScene }: StepCtx) {
  const isTl = project.format === "timelapse";
  const [busy, setBusy] = useState(false);
  const [aiErr, setAiErr] = useState<string | null>(null);
  const total = scenes.reduce((a, s) => a + words(s.voiceover), 0);
  const target = Math.round(project.durationSec * WORDS_PER_SEC);
  const labels = useMemo(() => buildLabelsAss(project, scenes), [project, scenes]);
  const subs = useMemo(() => buildSubsAss(project, scenes), [project, scenes]);
  const script = useMemo(() => buildFfmpegScript(project, scenes), [project, scenes]);

  const writeVo = async () => {
    setBusy(true);
    setAiErr(null);
    try {
      await aiWriteVo(project, scenes, brief, patchScene);
    } catch (e) {
      setAiErr(e instanceof Error ? e.message : "AI không phản hồi");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="stack">
      {!isTl ? (
        <div className="card">
          <div className="row space-between">
            <div>
              <h3>Lời đọc theo cảnh</h3>
              <p className="text-small text-muted">
                Tổng <b className={total > target * 1.1 ? "over" : ""}>{total}</b> / ~{target} từ (140–160 từ cho 60s). Vượt slot → rút gọn câu nhưng GIỮ nguyên claim, số liệu, disclaimer.
                Viết số bằng chữ ("ba mươi giây"). {brief ? "Chỉ dùng dữ kiện trong claim ledger; ví dụ phải có 'giả sử/ví dụ'." : ""}
              </p>
            </div>
            {canWrite && aiAvailable() ? (
              <button className="button" type="button" onClick={writeVo} disabled={busy}>
                {busy ? "Đang viết…" : "AI viết lời đọc (ghi đè)"}
              </button>
            ) : null}
          </div>
          <ErrorText text={aiErr} />
          <div className="vo-list">
            {scenes.map((s) => {
              const budget = Math.round((s.endSec - s.startSec) * WORDS_PER_SEC);
              const w = words(s.voiceover);
              const beat = beatOf(brief, s.order);
              return (
                <div key={s._id} className="vo-row">
                  <div className="vo-meta">
                    <b>Cảnh {s.order + 1}</b>
                    <span className="text-small text-muted">
                      {s.startSec}–{s.endSec}s · {s.role}
                    </span>
                    {beat ? <span className="text-small beat">Ý: {beat}</span> : null}
                    <span className={`text-small ${w > budget * 1.15 ? "over" : "text-muted"}`}>
                      {w}/{budget} từ · vo-canh{s.order + 1}.mp3
                    </span>
                  </div>
                  <Field value={s.voiceover} disabled={!canWrite} multiline rows={3} onSave={(v) => patchScene(s._id, { voiceover: v })} placeholder="Lời đọc cho cảnh này…" />
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="card">
          <h3>Timelapse: không voice-over</h3>
          <p className="text-small text-muted">
            Nhạc êm rất nhỏ (−35…−45 dBFS) + ambient công trường xa. Chữ "{project.timelapse.chu}" giữ nguyên suốt video ở ~40% chiều cao khung (Label MarginV 740).
          </p>
        </div>
      )}

      <div className="grid-2">
        <div className="card">
          <div className="row space-between">
            <h3>labels.ass</h3>
            <div className="row">
              <CopyButton text={labels} />
              <button className="button button-small" type="button" onClick={() => download("labels.ass", labels)}>
                Tải
              </button>
            </div>
          </div>
          <Guide>PlayResX 1080 / PlayResY 1920 — bắt buộc, SRT dùng PlayRes 384x288 làm sai mọi px. Label vàng, trên-center, size 54.</Guide>
          <pre className="prompt small">{labels}</pre>
        </div>
        <div className="card">
          <div className="row space-between">
            <h3>subs.ass</h3>
            <div className="row">
              <CopyButton text={subs} />
              <button className="button button-small" type="button" onClick={() => download("subs.ass", subs)}>
                Tải
              </button>
            </div>
          </div>
          <Guide>Sub trắng, dưới-center, size 46, MarginV 300 chừa lề UI TikTok. Thời gian chia theo câu, khớp cảnh. KHÔNG dùng drawtext cho câu tiếng Việt dài.</Guide>
          <pre className="prompt small">{subs}</pre>
        </div>
      </div>

      <div className="card">
        <div className="row space-between">
          <h3>build.sh — ghép, phụ đề, mix beat + ducking</h3>
          <div className="row">
            <CopyButton text={script} />
            <button className="button button-small" type="button" onClick={() => download("build.sh", script)}>
              Tải
            </button>
          </div>
        </div>
        <Guide>
          Beat volume 0.15 + sidechaincompress (threshold 0.02, ratio 8, attack 200, release 800) → beat luôn dưới lời. <b>normalize=0</b> trên mọi amix; alimiter 0.95 cuối chuỗi. Audio AI của clip bị bỏ (-an).
        </Guide>
        <pre className="prompt small">{script}</pre>
      </div>
    </div>
  );
}

// ───────────────────────── Step 8: Caption ─────────────────────────
function CaptionStep({ project, brief, canWrite, patchProject }: StepCtx) {
  const c = project.caption;
  const save = (k: keyof Project["caption"]) => (v: string) => patchProject({ caption: { ...c, [k]: v } });
  const tags = hashtagList(c.hashtags);
  const text = captionText(project);
  const hookDefault = project.selectedHook >= 0 ? project.hooks[project.selectedHook]?.text : "";
  const needsDisclaimer = brief ? /giả lập|mô phỏng|minh họa/i.test(brief.risk.notes) : false;
  return (
    <div className="grid-2">
      <div className="card">
        <h3>Caption contract</h3>
        <Guide>
          1 HOOK + 2–3 câu ngắn + 1 CTA + 5–8 hashtag tiếng Việt, từ khóa tự nhiên. Không engagement bait rỗng.
          {needsDisclaimer ? (
            <>
              {" "}
              <b>Brief có ví dụ giả lập → thêm "Ví dụ trong video là mô phỏng minh họa."</b>
            </>
          ) : null}
        </Guide>
        <Labeled label="Hook" hint={hookDefault ? `Để trống = dùng hook chính: "${hookDefault}"` : undefined}>
          <Field value={c.hook} disabled={!canWrite} onSave={save("hook")} placeholder={hookDefault || "Câu đầu caption"} />
        </Labeled>
        <Labeled label="2–3 câu ngắn">
          <Field value={c.body} disabled={!canWrite} multiline rows={3} onSave={save("body")} />
        </Labeled>
        <Labeled label="CTA duy nhất" hint={project.brief.cta ? `Brief: ${project.brief.cta}` : undefined}>
          <Field value={c.cta} disabled={!canWrite} onSave={save("cta")} />
        </Labeled>
        <Labeled label={`Hashtag (${tags.length}/5–8)`}>
          <Field value={c.hashtags} disabled={!canWrite} onSave={save("hashtags")} placeholder="#tiktokviet #hocai #mangnoron …" />
        </Labeled>
      </div>
      <div className="stack">
        <div className="card">
          <div className="row space-between">
            <h3>Xem trước</h3>
            <CopyButton text={text} />
          </div>
          <pre className="prompt">{text || "—"}</pre>
        </div>
        <div className="card">
          <h3>Ghi chú đăng bài</h3>
          <ul className="text-small checklist-plain">
            <li>Giờ đăng: 7–9h · 11–13h · 19–22h.</li>
            <li>60 phút đầu: kiểm tra caption/phụ đề → ghim 1 bình luận đặt câu hỏi → trả lời bình luận đầu bằng thông tin hữu ích.</li>
            <li>Bật nhãn "nội dung do AI tạo"; bật Commercial Content Disclosure nếu có affiliate.</li>
            <li>Theo dõi phễu: reach → % dừng 3s → % xem hết → saves/shares/comments → profile visits → ghi câu hỏi mới vào kho ý tưởng/brief tiếp theo.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

// ───────────────────────── Step 9: QC & handoff ─────────────────────────
function QcStep({ project, scenes, brief, canWrite, patchProject, lints }: StepCtx) {
  const groups = brief ? QC_GROUPS : QC_GROUPS.slice(0, 5);
  const totalItems = groups.reduce((a, g) => a + g.items.length, 0);
  const done = project.qc.filter((k) => Number(k.split("-")[0]) < groups.length).length;
  const handoff = useMemo(() => buildHandoff(project, scenes, brief), [project, scenes, brief]);
  const toggle = (key: string, on: boolean) => {
    const next = on ? Array.from(new Set([...project.qc, key])) : project.qc.filter((k) => k !== key);
    patchProject({ qc: next });
  };
  const unapproved = scenes.filter((s) => !s.status.approved).length;
  return (
    <div className="grid-2">
      <div className="stack">
        <div className="card">
          <div className="row space-between">
            <h3>QC {groups.length - 1} lượt — mỗi lượt một việc</h3>
            <span className={`badge ${done === totalItems ? "badge-success" : "badge-info"}`}>
              {done}/{totalItems}
            </span>
          </div>
          {unapproved > 0 ? <div className="text-small lint-warn">Còn {unapproved} cảnh chưa duyệt trên production board — không ghép cảnh chưa duyệt.</div> : null}
          {groups.map((g, gi) => (
            <div key={gi} className="qc-group">
              <div className="text-label">{g.title}</div>
              {g.items.map((it, ii) => {
                const key = `${gi}-${ii}`;
                const on = project.qc.includes(key);
                return (
                  <label key={key} className={`qc-item${on ? " on" : ""}`}>
                    <input type="checkbox" checked={on} disabled={!canWrite} onChange={(e) => toggle(key, e.target.checked)} />
                    <span>{it}</span>
                  </label>
                );
              })}
            </div>
          ))}
        </div>
        {lints.length ? (
          <div className="card lint">
            <h3>Cảnh báo còn lại</h3>
            <ul>
              {lints.map((l, i) => (
                <li key={i} className={`lint-${l.level}`}>
                  {l.text}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
      <div className="stack">
        <div className="card">
          <h3>Gói bàn giao</h3>
          <p className="text-small text-muted">
            Production pack (.md) gồm nguồn tri thức, brief, hook, claim ledger, character bible, production board (có ý nội dung), handoff contract CapCut (canhN.mp4 / vo-canhN.mp3 /
            beat.mp3), prompt từng cảnh, caption và QC. Pack là bản tiền kỳ; cần asset thật để dựng video.
          </p>
          <div className="row wrap">
            <button className="button button-primary" type="button" onClick={() => download(`${slug(project.title)}-production-pack.md`, handoff)}>
              Tải production pack
            </button>
            <button className="button" type="button" onClick={() => download("labels.ass", buildLabelsAss(project, scenes))}>
              labels.ass
            </button>
            <button className="button" type="button" onClick={() => download("subs.ass", buildSubsAss(project, scenes))}>
              subs.ass
            </button>
            <button className="button" type="button" onClick={() => download("build.sh", buildFfmpegScript(project, scenes))}>
              build.sh
            </button>
            <CopyButton text={handoff} label="Chép pack" />
            <button className="button" type="button" onClick={() => download(`${slug(project.title)}-workflow.json`, JSON.stringify(projectToWorkflow(project, scenes, brief), null, 2))}>
              Xuất dự án sang Workflow điện ảnh
            </button>
          </div>
          <p className="text-small text-muted">{handoff.length.toLocaleString("vi-VN")} ký tự{handoff.length > 20000 ? " — vượt giới hạn 20.000; chia pack trước khi gửi hệ thống có giới hạn này." : ""}</p>
          <p className="text-small text-muted">Nhập file workflow vừa xuất ở tab Workflow điện ảnh để tạo/import take cho đúng kế hoạch cảnh. Giữ nguyên character bible, prompt và thời lượng; không tự duyệt footage mới.</p>
        </div>
        <div className="card">
          <h3>Failover — không bao giờ bỏ cảnh</h3>
          <ul className="text-small checklist-plain">
            <li>Clip lỗi/biến dạng → thử lại 1 lần với motion đơn giản hơn → vẫn lỗi → Ken Burns từ keyframe đã duyệt.</li>
            <li>Keyframe lỗi → thử lại với prompt rút gọn.</li>
            <li>Sản phẩm thật bị vẽ lại giữa clip → motion gần tĩnh + lệnh giữ thiết kế → vẫn sai → Ken Burns.</li>
            <li>Tối đa 4 job media song song mỗi đợt; ghi take hạ cấp vào ô ghi chú của cảnh để QC soi kỹ.</li>
          </ul>
        </div>
        <div className="card">
          <h3>Xem trước pack</h3>
          <pre className="prompt small tall">{handoff}</pre>
        </div>
      </div>
    </div>
  );
}
