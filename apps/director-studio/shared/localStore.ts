import * as service from "./studioService";
import type { QueryCtx, MutationCtx } from "../convex/_generated/server";

type Table = "projects" | "scenes" | "briefs";
type Row = Record<string, unknown> & { _id: string; _creationTime: number };
export type Snapshot = { version: 1; tables: Record<Table, Row[]> };
export const STORAGE_KEY = "cinema-director-studio:v2";
export const emptySnapshot = (): Snapshot => ({ version: 1, tables: { projects: [], scenes: [], briefs: [] } });
export function parseSnapshot(raw: string | null): Snapshot {
  if (!raw) return emptySnapshot();
  const s = JSON.parse(raw);
  if (s.version !== 1 || !s.tables || !["projects", "scenes", "briefs"].every(t =>
    Array.isArray(s.tables[t]) && s.tables[t].every((r: Row) => typeof r._id === "string" && Number.isFinite(r._creationTime)))) {
    throw new Error("Dữ liệu local không đúng định dạng. Hãy xuất bản sao để kiểm tra; dữ liệu chưa bị ghi đè.");
  }
  return s;
}

// A local database adapter only. It never supplies a Convex identity or auth token.
export function localDatabase(snapshot: Snapshot) {
  const find = (id: string) => Object.values(snapshot.tables).flat().find(r => r._id === id);
  return {
    get: async (id: string) => find(id) ?? null,
    insert: async (table: Table, value: Record<string, unknown>) => {
      const id = `${table}:${crypto.randomUUID()}`;
      snapshot.tables[table].push({ ...value, _id: id, _creationTime: Date.now() });
      return id;
    },
    patch: async (id: string, patch: Record<string, unknown>) => {
      const row = find(id);
      if (!row) throw new Error("Không tìm thấy dữ liệu local");
      Object.assign(row, Object.fromEntries(Object.entries(patch).filter(([, v]) => v !== undefined)));
    },
    delete: async (id: string) => {
      for (const table of Object.keys(snapshot.tables) as Table[]) snapshot.tables[table] = snapshot.tables[table].filter(r => r._id !== id);
    },
    query: (table: Table) => {
      let rows = [...snapshot.tables[table]];
      const cursor = {
        withIndex: (name: string, cb?: (q: { eq: (key: string, value: unknown) => unknown }) => unknown) => {
          const q = { eq: (key: string, value: unknown) => { rows = rows.filter(r => r[key] === value); return q; } };
          cb?.(q);
          if (name === "by_updated") rows.sort((a, b) => Number(a.updatedAt) - Number(b.updatedAt));
          if (name === "by_project") rows.sort((a, b) => Number(a.order ?? 0) - Number(b.order ?? 0));
          return cursor;
        },
        order: (direction: string) => { if (direction === "desc") rows.reverse(); return cursor; },
        take: async (limit: number) => rows.slice(0, limit),
        unique: async () => { if (rows.length > 1) throw new Error("Trùng brief của dự án"); return rows[0] ?? null; },
      };
      return cursor;
    },
  };
}
const readNames = ["status", "listProjects", "getProject", "getBrief", "listBriefs"] as const;
const writeNames = ["createProject", "createProjectFromBrief", "upsertBrief", "updateProject", "updateScene", "replaceScenes", "deleteProject"] as const;
export async function executeLocal(snapshot: Snapshot, name: string, args: unknown, write: boolean) {
  const allowed: readonly string[] = write ? writeNames : readNames;
  if (!allowed.includes(name)) throw new Error("Chức năng local không hỗ trợ");
  const handler = service[name as (typeof writeNames)[number]] as unknown as (ctx: QueryCtx | MutationCtx, args: unknown) => Promise<unknown>;
  return handler({ db: localDatabase(snapshot) } as unknown as MutationCtx, args);
}
