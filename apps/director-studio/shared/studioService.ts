import { v, type Infer } from "convex/values";
import { assertEvidence } from "./evidence";
import type { QueryCtx, MutationCtx } from "../convex/_generated/server";
import {
  briefFields,
  captionFields,
  claimStatus,
  formatType,
  hookType,
  knowledgeFields,
  projectFields,
  riskLevel,
  sceneInputFields,
  timelapseFields,
} from "../convex/schema";

const MAX_TEXT = 8000;
const MAX_RAW = 20000;
const MAX_SCENES = 12;
const MAX_HOOKS = 20;
const MAX_QC = 80;
const MAX_CLAIMS = 40;
const MAX_ANCHORS = 20;
const MAX_TIME = 4102444800000;

function assertText(value: string, name: string, max = MAX_TEXT) {
  if (typeof value !== "string" || value.length > max) {
    throw new Error(`${name} quá dài (tối đa ${max} ký tự)`);
  }
}
function assertNum(value: number, name: string, min: number, max: number) {
  if (!Number.isFinite(value) || value < min || value > max) {
    throw new Error(`${name} không hợp lệ`);
  }
}

type SceneInput = {
  order: number;
  startSec: number;
  endSec: number;
  role: string;
  hero: boolean;
  shotSize: "toan" | "trung" | "can";
  camera: "push_in" | "pull_out" | "pan" | "tilt" | "static";
  action: string;
  subject: string;
  environment: string;
  prop: string;
  animal: string;
  screenLayout: "none" | "ots" | "front" | "pip";
  voiceover: string;
  label: string;
  promptOverride: string;
  status: { keyframe: boolean; take: boolean; approved: boolean; assembled: boolean };
  takes: number;
  note: string;
};

type Knowledge = {
  series: string;
  briefNo: string;
  source: { docId: string; section: string; anchors: string[] };
  claims: { text: string; anchors: string[]; status: "verified" | "unverified" | "editorial" }[];
  risk: { accuracy: "low" | "medium" | "high"; notes: string };
  outline: { order: number; text: string }[];
  continuity: string;
  raw: string;
};

function validateScene(s: SceneInput) {
  if (!Number.isInteger(s.order) || !Number.isInteger(s.takes)) throw new Error("Thứ tự và số take phải là số nguyên");
  assertNum(s.order, "Thứ tự cảnh", 0, MAX_SCENES);
  assertNum(s.startSec, "Giây bắt đầu", 0, 600);
  assertNum(s.endSec, "Giây kết thúc", 0, 600);
  if (s.endSec <= s.startSec) throw new Error("Giây kết thúc phải lớn hơn giây bắt đầu");
  assertNum(s.takes, "Số take", 1, 3);
  for (const key of [
    "role",
    "action",
    "subject",
    "environment",
    "prop",
    "animal",
    "voiceover",
    "label",
    "promptOverride",
    "note",
  ] as const) {
    assertText(s[key], key);
  }
}

function validateTimeline(scenes: SceneInput[], duration: number) {
  if (!scenes.length || scenes.length > MAX_SCENES) throw new Error("Dự án cần 1–12 cảnh");
  let cursor = 0;
  scenes.forEach((s, i) => {
    validateScene(s);
    if (s.order !== i || Math.abs(s.startSec - cursor) > 0.001) throw new Error("Timeline phải liên tục, đúng thứ tự và không trùng cảnh");
    cursor = s.endSec;
  });
  if (Math.abs(cursor - duration) > 0.001) throw new Error("Timeline phải khớp thời lượng dự án");
}

function validateHookSelection(selected: number, hooks: { text: string }[]) {
  if (!Number.isInteger(selected) || selected < -1 || selected >= hooks.length) throw new Error("Hook được chọn không tồn tại");
}

const resetStatus = () => ({ keyframe: false, take: false, approved: false, assembled: false });

async function invalidateProduction(ctx: MutationCtx, projectId: Infer<typeof vProjectId>) {
  const scenes = await ctx.db.query("scenes").withIndex("by_project", q => q.eq("projectId", projectId)).take(MAX_SCENES + 1);
  for (const scene of scenes) await ctx.db.patch(scene._id, { status: resetStatus() });
}
const vProjectId = v.id("projects");

function validateBrief(b: { audience: string; pain: string; angle: string; evidence: string; cta: string }) {
  for (const key of ["audience", "pain", "angle", "evidence", "cta"] as const) assertText(b[key], key);
}
function validateCaption(c: { hook: string; body: string; cta: string; hashtags: string }) {
  for (const key of ["hook", "body", "cta", "hashtags"] as const) assertText(c[key], key);
}
function validateTimelapse(t: { boiCanh: string; vatNeo: string; kienTruc: string; chu: string }) {
  for (const key of ["boiCanh", "vatNeo", "kienTruc", "chu"] as const) assertText(t[key], key);
}
function validateHooks(hooks: { type: string; text: string }[]) {
  if (hooks.length > MAX_HOOKS) throw new Error(`Tối đa ${MAX_HOOKS} hook`);
  hooks.forEach((h) => assertText(h.text, "Hook", 600));
}
function validateAnchors(anchors: string[], name: string) {
  if (anchors.length > MAX_ANCHORS) throw new Error(`${name}: quá nhiều anchor`);
  anchors.forEach((a) => assertText(a, name, 40));
}
function validateKnowledge(k: Partial<Knowledge>) {
  if (k.series !== undefined) assertText(k.series, "Series", 120);
  if (k.briefNo !== undefined) assertText(k.briefNo, "Mã brief", 20);
  if (k.source) {
    assertText(k.source.docId, "doc_id", 120);
    assertText(k.source.section, "Mục nguồn", 120);
    validateAnchors(k.source.anchors, "Anchor nguồn");
  }
  if (k.claims) {
    if (k.claims.length > MAX_CLAIMS) throw new Error(`Tối đa ${MAX_CLAIMS} claim`);
    k.claims.forEach((c) => {
      assertText(c.text, "Claim", 1000);
      validateAnchors(c.anchors, "Anchor claim");
    });
  }
  if (k.risk) assertText(k.risk.notes, "Ghi chú rủi ro", 2000);
  if (k.outline) {
    if (k.outline.length > MAX_SCENES + 2) throw new Error("Dàn ý quá dài");
    k.outline.forEach((o) => {
      assertNum(o.order, "Thứ tự ý", 0, MAX_SCENES + 2);
      assertText(o.text, "Ý nội dung", 1500);
    });
  }
  if (k.continuity !== undefined) assertText(k.continuity, "Continuity", 4000);
  if (k.raw !== undefined) assertText(k.raw, "Brief gốc", MAX_RAW);
}

const sceneDoc = v.object({
  _id: v.id("scenes"),
  _creationTime: v.number(),
  projectId: v.id("projects"),
  ...sceneInputFields,
});
const projectDoc = v.object({
  _id: v.id("projects"),
  _creationTime: v.number(),
  ...projectFields,
});
const briefDoc = v.object({
  _id: v.id("briefs"),
  _creationTime: v.number(),
  projectId: v.id("projects"),
  ...knowledgeFields,
});

const emptyKnowledge = (): Knowledge => ({
  series: "",
  briefNo: "",
  source: { docId: "", section: "", anchors: [] },
  claims: [],
  risk: { accuracy: "medium", notes: "" },
  outline: [],
  continuity: "",
  raw: "",
});


export const statusArgs = v.object({});
export const statusReturns = v.object({ ready: v.boolean() });
export const status = async () => ({ ready: true });

export const listProjectsArgs = v.object({});
export const listProjectsReturns = v.array(
    v.object({
      _id: v.id("projects"),
      title: v.string(),
      format: formatType,
      durationSec: v.number(),
      updatedAt: v.number(),
    }),
  );
export const listProjects = async (ctx: QueryCtx) => {
    const rows = await ctx.db.query("projects").withIndex("by_updated").order("desc").take(50);
    return rows.map((p) => ({
      _id: p._id,
      title: p.title,
      format: p.format,
      durationSec: p.durationSec,
      updatedAt: p.updatedAt,
    }));
  };

export const getProjectArgs = v.object({ projectId: v.id("projects") });
export const getProjectReturns = v.union(v.null(), v.object({ project: projectDoc, scenes: v.array(sceneDoc) }));
export const getProject = async (ctx: QueryCtx, { projectId }: Infer<typeof getProjectArgs>) => {
    const project = await ctx.db.get(projectId);
    if (!project) return null;
    const scenes = await ctx.db
      .query("scenes")
      .withIndex("by_project", (q) => q.eq("projectId", projectId))
      .take(MAX_SCENES + 4);
    return { project, scenes };
  };

export const getBriefArgs = v.object({ projectId: v.id("projects") });
export const getBriefReturns = v.union(v.null(), briefDoc);
export const getBrief = async (ctx: QueryCtx, { projectId }: Infer<typeof getBriefArgs>) => {
    const brief = await ctx.db
      .query("briefs")
      .withIndex("by_project", (q) => q.eq("projectId", projectId))
      .unique();
    return brief ?? null;
  };

export const listBriefsArgs = v.object({});
export const listBriefsReturns = v.array(
    v.object({
      projectId: v.id("projects"),
      series: v.string(),
      briefNo: v.string(),
      accuracy: riskLevel,
      verified: v.number(),
      unverified: v.number(),
    }),
  );
export const listBriefs = async (ctx: QueryCtx) => {
    const rows = await ctx.db.query("briefs").take(100);
    return rows.map((b) => ({
      projectId: b.projectId,
      series: b.series,
      briefNo: b.briefNo,
      accuracy: b.risk.accuracy,
      verified: b.claims.filter((c) => c.status === "verified").length,
      unverified: b.claims.filter((c) => c.status !== "verified").length,
    }));
  };

export const createProjectArgs = v.object({
    title: v.string(),
    format: formatType,
    durationSec: v.number(),
    timelapse: v.optional(v.object(timelapseFields)),
    scenes: v.array(v.object(sceneInputFields)),
    now: v.number(),
  });
export const createProjectReturns = v.id("projects");
export const createProject = async (ctx: MutationCtx, args: Infer<typeof createProjectArgs>) => {
    assertText(args.title, "Tiêu đề", 200);
    if (!args.title.trim()) throw new Error("Cần tiêu đề dự án");
    assertNum(args.durationSec, "Thời lượng", 5, 600);
    assertNum(args.now, "Thời gian", 0, MAX_TIME);
    if (args.scenes.length > MAX_SCENES) throw new Error(`Tối đa ${MAX_SCENES} cảnh`);
    validateTimeline(args.scenes, args.durationSec);
    const timelapse = args.timelapse ?? { boiCanh: "", vatNeo: "", kienTruc: "", chu: "" };
    validateTimelapse(timelapse);

    const projectId = await ctx.db.insert("projects", {
      title: args.title.trim(),
      format: args.format,
      durationSec: args.durationSec,
      brief: { audience: "", pain: "", angle: "", evidence: "", cta: "" },
      hooks: [],
      selectedHook: -1,
      characterBible: "",
      timelapse,
      caption: { hook: "", body: "", cta: "", hashtags: "" },
      qc: [],
      createdAt: args.now,
      updatedAt: args.now,
    });
    for (const scene of args.scenes) {
      await ctx.db.insert("scenes", { projectId, ...scene });
    }
    return projectId;
  };

export const createProjectFromBriefArgs = v.object({
    title: v.string(),
    durationSec: v.number(),
    now: v.number(),
    brief: v.object(briefFields),
    hooks: v.array(v.object({ type: hookType, text: v.string() })),
    selectedHook: v.number(),
    characterBible: v.string(),
    scenes: v.array(v.object(sceneInputFields)),
    knowledge: v.object(knowledgeFields),
  });
export const createProjectFromBriefReturns = v.id("projects");
export const createProjectFromBrief = async (ctx: MutationCtx, args: Infer<typeof createProjectFromBriefArgs>) => {
    assertText(args.title, "Tiêu đề", 200);
    if (!args.title.trim()) throw new Error("Cần tiêu đề dự án");
    assertNum(args.durationSec, "Thời lượng", 5, 600);
    assertNum(args.now, "Thời gian", 0, MAX_TIME);
    validateBrief(args.brief);
    validateHooks(args.hooks);
    assertNum(args.selectedHook, "Hook được chọn", -1, MAX_HOOKS);
    assertText(args.characterBible, "Character bible");
    if (args.scenes.length > MAX_SCENES) throw new Error(`Tối đa ${MAX_SCENES} cảnh`);
    validateTimeline(args.scenes, args.durationSec);
    validateHookSelection(args.selectedHook, args.hooks);
    validateKnowledge(args.knowledge);
    assertEvidence(args.knowledge.source.docId, args.knowledge.claims);

    const projectId = await ctx.db.insert("projects", {
      title: args.title.trim(),
      format: "standard",
      durationSec: args.durationSec,
      brief: args.brief,
      hooks: args.hooks,
      selectedHook: args.selectedHook,
      characterBible: args.characterBible,
      timelapse: { boiCanh: "", vatNeo: "", kienTruc: "", chu: "" },
      caption: { hook: "", body: "", cta: args.brief.cta, hashtags: "" },
      qc: [],
      createdAt: args.now,
      updatedAt: args.now,
    });
    for (const scene of args.scenes) {
      await ctx.db.insert("scenes", { projectId, ...scene });
    }
    await ctx.db.insert("briefs", { projectId, ...args.knowledge });
    return projectId;
  };

export const upsertBriefArgs = v.object({
    projectId: v.id("projects"),
    now: v.number(),
    patch: v.object({
      series: v.optional(v.string()),
      briefNo: v.optional(v.string()),
      source: v.optional(knowledgeFields.source),
      claims: v.optional(knowledgeFields.claims),
      risk: v.optional(knowledgeFields.risk),
      outline: v.optional(knowledgeFields.outline),
      continuity: v.optional(v.string()),
    }),
  });
export const upsertBriefReturns = v.null();
export const upsertBrief = async (ctx: MutationCtx, { projectId, patch, now }: Infer<typeof upsertBriefArgs>) => {
    const project = await ctx.db.get(projectId);
    if (!project) throw new Error("Không tìm thấy dự án");
    assertNum(now, "Thời gian", 0, MAX_TIME);
    validateKnowledge(patch);
    const existing = await ctx.db
      .query("briefs")
      .withIndex("by_project", (q) => q.eq("projectId", projectId))
      .unique();
    if (existing) {
      assertEvidence(patch.source?.docId ?? existing.source.docId, patch.claims ?? existing.claims);
      await ctx.db.patch(existing._id, patch);
    } else {
      assertEvidence(patch.source?.docId ?? "", patch.claims ?? []);
      await ctx.db.insert("briefs", { projectId, ...emptyKnowledge(), ...patch });
    }
    await invalidateProduction(ctx, projectId);
    await ctx.db.patch(projectId, { updatedAt: now, qc: [] });
    return null;
  };

export const updateProjectArgs = v.object({
    projectId: v.id("projects"),
    now: v.number(),
    patch: v.object({
      title: v.optional(v.string()),
      brief: v.optional(v.object(briefFields)),
      hooks: v.optional(v.array(v.object({ type: hookType, text: v.string() }))),
      selectedHook: v.optional(v.number()),
      characterBible: v.optional(v.string()),
      timelapse: v.optional(v.object(timelapseFields)),
      caption: v.optional(v.object(captionFields)),
      qc: v.optional(v.array(v.string())),
    }),
  });
export const updateProjectReturns = v.null();
export const updateProject = async (ctx: MutationCtx, { projectId, patch, now }: Infer<typeof updateProjectArgs>) => {
    const project = await ctx.db.get(projectId);
    if (!project) throw new Error("Không tìm thấy dự án");
    assertNum(now, "Thời gian", 0, MAX_TIME);
    if (patch.title !== undefined) {
      assertText(patch.title, "Tiêu đề", 200);
      if (!patch.title.trim()) throw new Error("Tiêu đề không được rỗng");
    }
    if (patch.brief) validateBrief(patch.brief);
    if (patch.hooks) validateHooks(patch.hooks);
    if (patch.selectedHook !== undefined) {
      assertNum(patch.selectedHook, "Hook được chọn", -1, MAX_HOOKS);
    }
    if (patch.characterBible !== undefined) assertText(patch.characterBible, "Character bible");
    if (patch.timelapse) validateTimelapse(patch.timelapse);
    if (patch.caption) validateCaption(patch.caption);
    if (patch.qc) {
      if (patch.qc.length > MAX_QC) throw new Error("Danh sách QC quá dài");
      patch.qc.forEach((k) => assertText(k, "QC key", 80));
    }
    validateHookSelection(patch.selectedHook ?? project.selectedHook, patch.hooks ?? project.hooks);
    const productionChanged = ["brief", "hooks", "selectedHook", "characterBible", "timelapse"].some(k => k in patch);
    if (productionChanged) await invalidateProduction(ctx, projectId);
    const qc = productionChanged || patch.caption ? [] : Array.from(new Set(patch.qc ?? project.qc));
    await ctx.db.patch(projectId, { ...patch, qc, updatedAt: now });
    return null;
  };

export const updateSceneArgs = v.object({
    sceneId: v.id("scenes"),
    now: v.number(),
    patch: v.object({
      role: v.optional(v.string()),
      hero: v.optional(v.boolean()),
      shotSize: v.optional(sceneInputFields.shotSize),
      camera: v.optional(sceneInputFields.camera),
      action: v.optional(v.string()),
      subject: v.optional(v.string()),
      environment: v.optional(v.string()),
      prop: v.optional(v.string()),
      animal: v.optional(v.string()),
      screenLayout: v.optional(sceneInputFields.screenLayout),
      voiceover: v.optional(v.string()),
      label: v.optional(v.string()),
      promptOverride: v.optional(v.string()),
      status: v.optional(sceneInputFields.status),
      takes: v.optional(v.number()),
      note: v.optional(v.string()),
    }),
  });
export const updateSceneReturns = v.null();
export const updateScene = async (ctx: MutationCtx, { sceneId, patch, now }: Infer<typeof updateSceneArgs>) => {
    const scene = await ctx.db.get(sceneId);
    if (!scene) throw new Error("Không tìm thấy cảnh");
    assertNum(now, "Thời gian", 0, MAX_TIME);
    const merged = { ...scene, ...patch };
    validateScene(merged);
    const productionChanged = Object.keys(patch).some(k => k !== "status" && k !== "note");
    await ctx.db.patch(sceneId, { ...patch, ...(productionChanged ? { status: resetStatus() } : {}) });
    await ctx.db.patch(scene.projectId, { updatedAt: now, qc: [] });
    return null;
  };

export const replaceScenesArgs = v.object({
    projectId: v.id("projects"),
    scenes: v.array(v.object(sceneInputFields)),
    now: v.number(),
  });
export const replaceScenesReturns = v.null();
export const replaceScenes = async (ctx: MutationCtx, { projectId, scenes, now }: Infer<typeof replaceScenesArgs>) => {
    const project = await ctx.db.get(projectId);
    if (!project) throw new Error("Không tìm thấy dự án");
    assertNum(now, "Thời gian", 0, MAX_TIME);
    if (scenes.length > MAX_SCENES) throw new Error(`Tối đa ${MAX_SCENES} cảnh`);
    validateTimeline(scenes, project.durationSec);
    const existing = await ctx.db
      .query("scenes")
      .withIndex("by_project", (q) => q.eq("projectId", projectId))
      .take(50);
    for (const s of existing) await ctx.db.delete(s._id);
    for (const s of scenes) await ctx.db.insert("scenes", { projectId, ...s });
    await ctx.db.patch(projectId, { updatedAt: now, qc: [] });
    return null;
  };

export const deleteProjectArgs = v.object({ projectId: v.id("projects") });
export const deleteProjectReturns = v.null();
export const deleteProject = async (ctx: MutationCtx, { projectId }: Infer<typeof deleteProjectArgs>) => {
    const project = await ctx.db.get(projectId);
    if (!project) return null;
    const existing = await ctx.db
      .query("scenes")
      .withIndex("by_project", (q) => q.eq("projectId", projectId))
      .take(50);
    for (const s of existing) await ctx.db.delete(s._id);
    const briefs = await ctx.db
      .query("briefs")
      .withIndex("by_project", (q) => q.eq("projectId", projectId))
      .take(5);
    for (const b of briefs) await ctx.db.delete(b._id);
    await ctx.db.delete(projectId);
    return null;
  };
