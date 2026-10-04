from pathlib import Path
import re
root=Path(__file__).resolve().parent.parent
app=root/'apps/director-studio'
p=app/'shared/production.ts'
s=p.read_text(encoding='utf-8')
types=re.findall(r'^type (\w+)\s*=',s,re.M)
s=s[:s.rfind('export {')]+s[s.rfind('export {'):].replace('export { '+', '.join(types)+', ', 'export type { '+', '.join(types)+' };\nexport { ')
# Types interspersed among values need separate exports too.
export=s[s.rfind('export {'):]
names=[n.strip() for n in export[9:export.index('};')].split(',')]
s=s[:s.rfind('export {')]+'export { '+', '.join(n for n in names if n not in types)+' };\n'
if not all(re.search(r'export type \{[^}]*\b'+n+r'\b',s) for n in types):
    s+='export type { '+', '.join(types)+' };\n'
s='import { canVerify } from "./evidence";\n'+s
s=s.replace('const anchorsIn = (s: string) => Array.from(new Set((s.match(/\\[(\\d{1,3})\\]/g) ?? []).map((a) => a.replace(/[[\\]]/g, ""))));','const anchorsIn = (s: string) => Array.from(new Set((s.match(/\\[(\\d{1,3})\\]/g) ?? []).map((a) => a.replace(/[[\\]]/g, "").padStart(2, "0"))));')
s=s.replace('fm[m[1].toLowerCase()] = m[2].trim().replace(/^["\']|["\']$/g, "");','fm[m[1].toLowerCase()] = stripQuotes(m[2].trim().replace(/\\s+#.*$/, ""));')
s=s.replace('Array.from(new Set(fm.anchors.match(/\\d{1,3}/g) ?? []))','Array.from(new Set((fm.anchors.match(/\\d{1,3}/g) ?? []).map(a => a.padStart(2, "0"))))')
start=s.index('      if (status === "verified" && anchors.length === 0)')
end=s.index('      return { text: textPart, anchors, status };',start)
s=s[:start]+'''      if (status === "verified" && !canVerify(docId, { text: textPart, anchors, status })) {
        status = "unverified";
        warnings.push(`Claim "${textPart.slice(0, 50)}…": nguồn ghi VERIFIED nhưng chưa có bằng chứng đã đối chiếu → UNVERIFIED.`);
      }
'''+s[end:]
s=s.replace('const durationSec = Number(fm.duration) || Number(fmt.match(/(\\d{2,3})\\s*s\\b/)?.[1]) || 60;', '''const durationSec = Number(fm.duration ?? fmt.match(/(\\d{2,3})\\s*s\\b/)?.[1] ?? 60);
  if (!Number.isFinite(durationSec) || durationSec < 5 || durationSec > 600) throw new Error("Thời lượng brief phải từ 5 đến 600 giây");
  if (outline.length > 10) throw new Error("Brief có quá nhiều ý: tối đa 12 cảnh gồm hook và CTA");''')
s=s.replace('/^kết\\b/i','/^kết(?:\\s|:|\\+|$)/i')
s=s.replace('return plan.map(([role, start, end, hero], i) => blankScene(i, start, end, role, hero));','const scale = duration / plan[plan.length - 1][2];\n  return plan.map(([role, start, end, hero], i) => blankScene(i, Math.round(start * scale * 10) / 10, Math.round(end * scale * 10) / 10, role, hero));')
s=s.replace('const hookDur = 10;\n  const ctaDur = 5;', 'const hookDur = Math.min(10, duration / 6);\n  const ctaDur = Math.min(5, duration / 12);')
s=s.replace('Math.min(10, Math.max(6, (duration - 15) / (items.length + 1)))','Math.min(10, (duration - hookDur - ctaDur) / (items.length + 1))')
start=s.index('function assTime(sec: number)');end=s.index('function assEscape',start)
s=s[:start]+'''function assTime(sec: number) {
  const ticks = Math.max(0, Math.round(sec * 100));
  return `${Math.floor(ticks / 360000)}:${String(Math.floor(ticks / 6000) % 60).padStart(2, "0")}:${String(Math.floor(ticks / 100) % 60).padStart(2, "0")}.${String(ticks % 100).padStart(2, "0")}`;
}
'''+s[end:]
s=s.replace('Math.max(0.8, (text.length / total) * dur)','(text.length / total) * dur')
s=s.replace('brief.claims.map((c) => c.text).join(" ") + " " + brief.raw','brief.claims.filter(c => c.status === "verified").map((c) => c.text).join(" ")')
s+='''
// Keep frontmatter attached to its heading when importing one or several documents.
export function splitBriefDocuments(raw: string): string[] {
  const md = raw.replace(/\\r\\n?/g, "\\n").trim();
  const fronts = Array.from(md.matchAll(/^---\\n[\\s\\S]*?\\n---\\n(?=#\\s)/gm));
  const starts = Array.from(md.matchAll(/^#\\s+.+$/gm)).map(m => {
    const front = fronts.find(f => f.index! + f[0].length === m.index);
    return front?.index ?? m.index!;
  });
  if (!starts.length) return [md];
  return starts.map((start, i) => md.slice(start, starts[i + 1] ?? md.length).trim());
}
'''
p.write_text(s,encoding='utf-8')
p=app/'src/App.tsx';s=p.read_text(encoding='utf-8')
s='import { knowledgeLibrary } from "./knowledgeLibrary";\nimport { splitBriefDocuments } from "../shared/production";\nimport { canVerify, sourceRegistry } from "../shared/evidence";\n'+s
start=s.index('    const chunks = md.split(');end=s.index('    setItems((prev)',start)
s=s[:start]+'    const parsed = splitBriefDocuments(md).map(parseBrief);\n'+s[end:]
# Catch malformed briefs in upload/paste and allow users to correct them.
s=s.replace('    const parsed = splitBriefDocuments(md).map(parseBrief);','    let parsed: ParsedBrief[];\n    try { parsed = splitBriefDocuments(md).map(parseBrief); } catch (e) { setErr(e instanceof Error ? e.message : "Brief không hợp lệ"); return; }')
target='<h3>Thêm brief</h3>'
s=s.replace(target,'''<h3>Kho brief đã đấu nối</h3>
            <p className="text-small text-muted">6 brief v2 · 2 series. Tài liệu gốc và sources-index.json chưa được cung cấp; claim có nguồn chưa đối chiếu giữ UNVERIFIED.</p>
            <div className="row wrap">
              {["nn-co-ban", "ai-agent-doanh-nghiep"].map(name => <button className="button" key={name} onClick={() => knowledgeLibrary.filter(b => b.series === name).forEach(b => addText(b.raw))}>{name} · 3 brief</button>)}
            </div>
            {knowledgeLibrary.map(b => <button className="button library-item" key={b.path} onClick={() => addText(b.raw)}>{b.title}</button>)}
            <h3>Thêm brief của bạn</h3>''')
s=s.replace('                    <option key={k} value={k}>\n                      {CLAIM_STATUS[k].label}', '                    <option key={k} value={k} disabled={k === "verified" && !canVerify(brief.source.docId, c)}>\n                      {CLAIM_STATUS[k].label}')
s=s.replace('          <h3>Claim ledger ({claims.length})</h3>','          <h3>Claim ledger ({claims.length})</h3>')
s=s.replace('Mỗi claim = một dữ kiện được phép nói trong video.', 'Mỗi claim = một nhận định cần đối chiếu trước khi dùng trong video.')
s=s.replace('trong sources-index.json;', 'và bằng chứng đã được người duyệt đối chiếu;')
s=s.replace('          {!claims.length ?', '          <p className="text-small lint-warn">Nguồn chưa có: {sourceRegistry.filter(s => !s.available).map(s => s.file).join(" · ")} · sources-index.json.</p>\n          {!claims.length ?')
s=s.replace('{f.status === "covered" ? "có nguồn"', '{f.status === "covered" ? "khớp ledger"')
s=s.replace('    brief.claims.forEach((c) => lines.push(', '    brief.claims.filter(c => c.status !== "unverified").forEach((c) => lines.push(')
s=s.replace('beat.mp3), prompt từng cảnh, caption và QC. Dưới 20000 ký tự — dán thẳng vào auto-build được.', 'beat.mp3), prompt từng cảnh, caption và QC. Pack là bản tiền kỳ; cần asset thật để dựng video.')
s=s.replace('<p className="text-small text-muted">{handoff.length.toLocaleString("vi-VN")} ký tự</p>', '<p className="text-small text-muted">{handoff.length.toLocaleString("vi-VN")} ký tự{handoff.length > 20000 ? " — vượt giới hạn 20.000; chia pack trước khi gửi hệ thống có giới hạn này." : ""}</p>')
s=s.replace('<Labeled label="Giúp AI cụ thể?">','<Labeled label="Giúp ai cụ thể?">')
s=s.replace('<Timeline scenesLike={project.format === "timelapse" ? undefined : standardScenes(project.durationSec)} duration={project.durationSec} />','<Timeline scenesLike={project.format === "timelapse" ? undefined : undefined} duration={project.durationSec} />')
# Use the actual board in BriefStep, including imported 90s briefs.
s=s.replace('function BriefStep({ project, brief, canWrite, patchProject }: StepCtx)', 'function BriefStep({ project, scenes, brief, canWrite, patchProject }: StepCtx)')
s=s.replace('scenesLike={project.format === "timelapse" ? undefined : undefined}','scenesLike={scenes}')
p.write_text(s,encoding='utf-8')
p=app/'src/styles.css';s=p.read_text(encoding='utf-8');s+='''
.runtime-banner { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 10px 20px; background: #17283b; color: #deedff; font-size: 13px; }
.library-item { display: block; width: 100%; text-align: left; margin: 8px 0; }
@media(max-width: 700px) { .runtime-banner { flex-wrap: wrap; } }
''';p.write_text(s,encoding='utf-8')
print('Connected bundled library; fixed frontmatter split, source status, duration and ASS timing.')
