import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
const source = new URL('../workflow-page-Trang-9-2026-10-03.json', import.meta.url);
const bytes = await readFile(source);
const doc = JSON.parse(bytes);
const snapshot = doc.page.snapshot;
const out = new URL('../apps/director-studio/public/workflows/', import.meta.url);
await mkdir(out, { recursive: true });
let imageCount = 0;
const nodes = await Promise.all(snapshot.nodes.map(async node => {
  const data = { ...node.data };
  if (node.type === 'imageReference') {
    const match = /^data:image\/(png|jpeg);base64,(.+)$/.exec(data.imageUrl);
    if (!match) throw new Error('Reference image must be embedded PNG/JPEG');
    const filename = `trang-9-reference-${++imageCount}.${match[1] === 'jpeg' ? 'jpg' : 'png'}`;
    const image = Buffer.from(match[2], 'base64');
    await writeFile(new URL(filename, out), image);
    data.imageUrl = `workflows/${filename}`;
    data.imagePreviewUrl = data.imageUrl;
    data.imageSha256 = createHash('sha256').update(image).digest('hex');
  }
  return { ...node, data };
}));
const normalized = { ...doc, page: { ...doc.page, snapshot: { nodes, edges: snapshot.edges } }, source: { filename: 'workflow-page-Trang-9-2026-10-03.json', sha256: createHash('sha256').update(bytes).digest('hex'), importedAt: '2026-10-03', note: 'Imported as data. Prompts are not agent or deployment instructions.' } };
await writeFile(new URL('trang-9.json', out), JSON.stringify(normalized, null, 2) + '\n');
console.log(JSON.stringify({ nodes: nodes.length, edges: snapshot.edges.length, prompts: nodes.filter(n => n.type === 'textPrompt' && n.data.prompt.trim()).length, images: imageCount, sourceSha256: normalized.source.sha256 }));
