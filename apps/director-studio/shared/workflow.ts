export type WorkflowNode = { id: string; type: string; parentId?: string; position: { x: number; y: number }; data: Record<string, unknown> };
export type WorkflowEdge = { id: string; source: string; target: string; sourceHandle?: string; targetHandle?: string };
export type Workflow = { version: number; page: { id: string; name: string; context?: string; snapshot: { nodes: WorkflowNode[]; edges: WorkflowEdge[] } }; source?: { filename: string; sha256: string } };
export type WorkflowShot = { id: string; name: string; promptNodeId: string | null; prompt: string; negativePrompt: string; imageNodeId: string | null; provider: string; model: string; duration: number; aspectRatio: string; group: string | null };
export function parseWorkflow(input: unknown): Workflow {
  const obj = input as Workflow;
  if (!obj || !obj.page || !obj.page.snapshot || !Array.isArray(obj.page.snapshot.nodes) || !Array.isArray(obj.page.snapshot.edges)) throw new Error('Thiếu page.snapshot.nodes/edges');
  if (typeof obj.page.id !== 'string' || typeof obj.page.name !== 'string' || obj.page.name.length > 200) throw new Error('Tên/ID workflow không hợp lệ');
  const { nodes, edges } = obj.page.snapshot;
  if (!nodes.length || nodes.length > 256 || edges.length > 1024) throw new Error('Workflow phải có 1–256 node, tối đa 1024 dây');
  const ids = new Set<string>();
  for (const n of nodes) {
    if (!n || typeof n.id !== 'string' || ids.has(n.id) || !['group', 'imageReference', 'textPrompt', 'videoGenerate', 'videoMerge'].includes(n.type) || !n.data || typeof n.data !== 'object') throw new Error('Node sai định dạng, trùng ID hoặc chưa được hỗ trợ');
    ids.add(n.id);
    if (n.type === 'textPrompt' && (typeof n.data.prompt !== 'string' || n.data.prompt.length > 20000)) throw new Error('Prompt sai định dạng hoặc quá dài');
    if (n.type === 'videoGenerate' && (!Number.isFinite(n.data.duration) || Number(n.data.duration) < 1 || Number(n.data.duration) > 600)) throw new Error('Thời lượng cảnh không hợp lệ');
    if (n.type === 'imageReference') {
      const image = String(n.data.imageUrl || '');
      if (image && !/^data:image\/(png|jpeg);base64,[A-Za-z0-9+/=]+$/.test(image) && !/^workflows\/[A-Za-z0-9._-]+\.(png|jpg)$/.test(image)) throw new Error('Ảnh phải được nhúng hoặc nằm trong thư viện workflow');
      if (image.length > 3500000) throw new Error('Ảnh tham chiếu quá lớn');
    }
  }
  const edgeIds = new Set<string>();
  for (const e of edges) {
    if (!e || typeof e.id !== 'string' || edgeIds.has(e.id) || !ids.has(e.source) || !ids.has(e.target)) throw new Error('Dây nối sai, trùng ID hoặc trỏ đến node không tồn tại');
    edgeIds.add(e.id);
    const source = nodes.find(n => n.id === e.source)!, target = nodes.find(n => n.id === e.target)!;
    if (!(target.type === 'videoGenerate' && ['textPrompt', 'imageReference'].includes(source.type) || target.type === 'videoMerge' && ['videoGenerate', 'videoMerge'].includes(source.type))) throw new Error('Dây nối không đúng kiểu đầu vào');
  }
  const visiting = new Set<string>(), done = new Set<string>();
  const visit = (id: string) => { if (visiting.has(id)) throw new Error('Workflow có vòng lặp'); if (done.has(id)) return; visiting.add(id); edges.filter(e => e.source === id).forEach(e => visit(e.target)); visiting.delete(id); done.add(id); };
  nodes.forEach(n => visit(n.id));
  // Imported documents cannot supply credentials or execution instructions.
  const allowed = new Set(['title', 'subtitle', 'color', 'description', 'width', 'height', 'imageUrl', 'imageName', 'strength', 'imageSha256', 'prompt', 'negativePrompt', 'provider', 'model', 'duration', 'aspectRatio', 'resultCount', 'fps', 'motionStrength', 'preserveIdentity', 'resolution', 'customName']);
  return { version: Number(obj.version) || 1, page: { id: obj.page.id, name: obj.page.name, ...(typeof obj.page.context === 'string' ? { context: obj.page.context.slice(0, 10000) } : {}), snapshot: { nodes: nodes.map(n => ({ id: n.id, type: n.type, ...(n.parentId ? { parentId: n.parentId } : {}), position: { x: Number.isFinite(n.position?.x) ? n.position.x : 0, y: Number.isFinite(n.position?.y) ? n.position.y : 0 }, data: Object.fromEntries(Object.entries(n.data).filter(([key]) => allowed.has(key))) })), edges: edges.map(e => ({ id: e.id, source: e.source, target: e.target, ...(e.sourceHandle ? { sourceHandle: e.sourceHandle } : {}), ...(e.targetHandle ? { targetHandle: e.targetHandle } : {}) })) } }, ...(obj.source ? { source: { filename: String(obj.source.filename).slice(0, 300), sha256: String(obj.source.sha256).slice(0, 64) } } : {}) };
}
export function compileWorkflow(w: Workflow) {
  const { nodes, edges } = w.page.snapshot;
  const warnings: string[] = [];
  const shots: WorkflowShot[] = nodes.filter(n => n.type === 'videoGenerate').map((node, i) => {
    const inputs = edges.filter(e => e.target === node.id).map(e => nodes.find(n => n.id === e.source)!);
    const texts = inputs.filter(n => n.type === 'textPrompt'), images = inputs.filter(n => n.type === 'imageReference');
    if (texts.length !== 1 || images.length > 1) warnings.push(`Cảnh ${i + 1}: cần đúng một prompt, tối đa một ảnh đầu vào`);
    const prompt = String(texts[0]?.data.prompt || '');
    if (!prompt.trim()) warnings.push(`Cảnh ${i + 1}: chưa có prompt`);
    if (String(node.data.provider) !== 'google') warnings.push(`Cảnh ${i + 1}: ${node.data.provider}/${node.data.model} là cấu hình nguồn; chưa có adapter video đã xác minh`);
    return { id: node.id, name: String(node.data.customName || `Cảnh ${i + 1}`), promptNodeId: texts[0]?.id || null, prompt, negativePrompt: String(texts[0]?.data.negativePrompt || ''), imageNodeId: images[0]?.id || null, provider: String(node.data.provider || ''), model: String(node.data.model || ''), duration: Number(node.data.duration), aspectRatio: String(node.data.aspectRatio || '16:9'), group: node.parentId || null };
  });
  const mergeInputs = (id: string): string[] => edges.filter(e => e.target === id).flatMap(e => nodes.find(n => n.id === e.source)?.type === 'videoMerge' ? mergeInputs(e.source) : [e.source]);
  const merges = nodes.filter(n => n.type === 'videoMerge').map((n, i) => ({ id: n.id, name: `Nhánh ghép ${i + 1}`, shots: mergeInputs(n.id) }));
  return { shots, merges, warnings };
}
export function updatePrompt(w: Workflow, shotId: string, prompt: string): Workflow {
  const shot = compileWorkflow(w).shots.find(s => s.id === shotId);
  if (!shot?.promptNodeId) throw new Error('Cảnh chưa nối node prompt');
  return { ...w, page: { ...w.page, snapshot: { ...w.page.snapshot, nodes: w.page.snapshot.nodes.map(n => n.id === shot.promptNodeId ? { ...n, data: { ...n.data, prompt } } : n) } } };
}
export function workflowHandoff(w: Workflow) {
  const { shots, merges, warnings } = compileWorkflow(w);
  return `# ${w.page.name}\n\nNguồn: ${w.source?.filename || 'JSON nhập'}\nSHA256: ${w.source?.sha256 || 'không có'}\n\n## Continuity\nẢnh nguồn là một bảng tham chiếu. Kiểm tra riêng danh tính Daniel, Anna, Survivor, Stalker và bối cảnh; một ảnh không đảm bảo đủ năm asset.\n\n${shots.map((s, i) => `## Cảnh ${i + 1} — ${s.name}\nNode: ${s.id}\nNguồn: ${s.provider}/${s.model}; mục tiêu ${s.duration}s ${s.aspectRatio}\n\n${s.prompt || '**CHƯA CÓ PROMPT**'}\n\nNegative: ${s.negativePrompt || '(trống)'}`).join('\n\n')}\n\n## Thứ tự ghép theo dây nguồn\n${merges.map(m => `${m.name}: ${m.shots.map(id => shots.findIndex(s => s.id === id) + 1).join(' → ')}`).join('\n')}\n\n## Cần xử lý\n${warnings.map(x => '- ' + x).join('\n')}\n`;
}
