const files = import.meta.glob("../knowledge/video-briefs/*.md", { query: "?raw", import: "default", eager: true }) as Record<string, string>;
export const knowledgeLibrary = Object.entries(files).sort(([a], [b]) => a.localeCompare(b)).map(([path, raw]) => ({
  path, raw, title: raw.match(/^# (.+)$/m)?.[1] ?? path,
  series: raw.match(/^series:\s*(.+)$/m)?.[1].trim() ?? "",
}));
