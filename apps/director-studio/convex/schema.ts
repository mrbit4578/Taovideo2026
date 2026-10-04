import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { typePlatformTables } from "./typeSchema";

export const hookType = v.union(
  v.literal("ket_qua"),
  v.literal("sai_lam"),
  v.literal("doi_lap"),
  v.literal("cau_hoi"),
  v.literal("demo"),
  v.literal("cau_chuyen"),
);
export const formatType = v.union(v.literal("standard"), v.literal("timelapse"));
export const shotSize = v.union(v.literal("toan"), v.literal("trung"), v.literal("can"));
export const cameraMove = v.union(
  v.literal("push_in"),
  v.literal("pull_out"),
  v.literal("pan"),
  v.literal("tilt"),
  v.literal("static"),
);
export const screenLayout = v.union(
  v.literal("none"),
  v.literal("ots"),
  v.literal("front"),
  v.literal("pip"),
);
export const claimStatus = v.union(v.literal("verified"), v.literal("unverified"), v.literal("editorial"));
export const riskLevel = v.union(v.literal("low"), v.literal("medium"), v.literal("high"));

export const briefFields = {
  audience: v.string(),
  pain: v.string(),
  angle: v.string(),
  evidence: v.string(),
  cta: v.string(),
};
export const timelapseFields = {
  boiCanh: v.string(),
  vatNeo: v.string(),
  kienTruc: v.string(),
  chu: v.string(),
};
export const captionFields = {
  hook: v.string(),
  body: v.string(),
  cta: v.string(),
  hashtags: v.string(),
};
export const sceneStatusFields = {
  keyframe: v.boolean(),
  take: v.boolean(),
  approved: v.boolean(),
  assembled: v.boolean(),
};

export const sceneInputFields = {
  order: v.number(),
  startSec: v.number(),
  endSec: v.number(),
  role: v.string(),
  hero: v.boolean(),
  shotSize,
  camera: cameraMove,
  action: v.string(),
  subject: v.string(),
  environment: v.string(),
  prop: v.string(),
  animal: v.string(),
  screenLayout,
  voiceover: v.string(),
  label: v.string(),
  promptOverride: v.string(),
  status: v.object(sceneStatusFields),
  takes: v.number(),
  note: v.string(),
};

export const projectFields = {
  title: v.string(),
  format: formatType,
  durationSec: v.number(),
  brief: v.object(briefFields),
  hooks: v.array(v.object({ type: hookType, text: v.string() })),
  selectedHook: v.number(),
  characterBible: v.string(),
  timelapse: v.object(timelapseFields),
  caption: v.object(captionFields),
  qc: v.array(v.string()),
  createdAt: v.number(),
  updatedAt: v.number(),
};

// Knowledge layer: one source brief per project (series, claim ledger, risk gate, beats).
export const knowledgeFields = {
  series: v.string(),
  briefNo: v.string(),
  source: v.object({ docId: v.string(), section: v.string(), anchors: v.array(v.string()) }),
  claims: v.array(v.object({ text: v.string(), anchors: v.array(v.string()), status: claimStatus })),
  risk: v.object({ accuracy: riskLevel, notes: v.string() }),
  outline: v.array(v.object({ order: v.number(), text: v.string() })),
  continuity: v.string(),
  raw: v.string(),
};

export default defineSchema({
  ...typePlatformTables,
  projects: defineTable(projectFields).index("by_updated", ["updatedAt"]),
  scenes: defineTable({
    projectId: v.id("projects"),
    ...sceneInputFields,
  }).index("by_project", ["projectId", "order"]),
  briefs: defineTable({
    projectId: v.id("projects"),
    ...knowledgeFields,
  })
    .index("by_project", ["projectId"])
    .index("by_series", ["series"]),
});
