from pathlib import Path
root=Path(__file__).resolve().parent.parent
app=root/'apps/director-studio'
p=app/'src/App.tsx';s=p.read_text(encoding='utf-8')
s=s.replace('nhóm khán giả khác nhau trong cùng series','nhóm khán giả trong danh sách nhập')
s=s.replace('<Labeled label="Giúp ai cụ thể?">','<Labeled label="Người xem cụ thể">')
s=s.replace('<h3>Timeline chuẩn {project.durationSec}s</h3>','<h3>Timeline kế hoạch {project.durationSec}s</h3>')
start=s.index('          <table className="mini-table">',s.index('<h3>Timeline kế hoạch'))
end=s.index('          </table>',start)+len('          </table>')
s=s[:start]+'''          <table className="mini-table"><tbody>{scenes.map(scene => <tr key={scene._id}>
            <td>{scene.startSec}–{scene.endSec}s</td><td>{scene.role}</td>
          </tr>)}</tbody></table>'''+s[end:]
# Preserve imported beats when regenerating a source-backed board.
s=s.replace('const next = isTl ? timelapseScenes(project.timelapse) : standardScenes(project.durationSec);','const next = isTl ? timelapseScenes(project.timelapse) : brief?.raw ? scenesFromBrief(parseBrief(brief.raw), project.durationSec, project.brief.cta).scenes : standardScenes(project.durationSec);')
p.write_text(s,encoding='utf-8')
p=app/'shared/production.ts';s=p.read_text(encoding='utf-8')
s=s.replace('function buildFfmpegScript(p: Project, scenes: Scene[]) {','function buildFfmpegScript(p: Project, scenes: Scene[]) {\n  const transition = 10 / 24;\n  const slotDuration = (s: Scene) => (Math.round(s.endSec * 24) - Math.round(s.startSec * 24)) / 24;')
s=s.replace('(s.endSec - s.startSec + (p.format === "timelapse" && s.order < scenes.length - 1 ? 0.4 : 0)).toFixed(2)','(slotDuration(s) + (p.format === "timelapse" && s.order < scenes.length - 1 ? transition : 0)).toFixed(6)')
s=s.replace('const d = (endCard.endSec - endCard.startSec).toFixed(2);','const d = slotDuration(endCard).toFixed(6);')
s=s.replace('cross-dissolve 0.4s (~10 frame)','cross-dissolve 10 frame (24fps), đã bù overlap vào clip nguồn')
s=s.replace('const T = 0.4;','const T = transition;')
s=s.replace('const d = s.endSec - s.startSec + (i < all.length - 1 ? T : 0);','const d = slotDuration(s) + (i < all.length - 1 ? T : 0);')
s=s.replace('(acc - T).toFixed(2)','(acc - T).toFixed(6)')
s=s.replace('const slot = s.endSec - s.startSec;','const slot = slotDuration(s).toFixed(6);')
s=s.replace('const ms = Math.round(s.startSec * 1000);','const ms = Math.round(Math.round(s.startSec * 24) / 24 * 1000);')
s=s.replace('alimiter=limit=0.95:level=0','alimiter=limit=0.95:level=0:latency=1')
p.write_text(s,encoding='utf-8')
print('Finalized actual timeline display and frame-based overlap compensation.')
