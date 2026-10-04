import { keyframePrompt, motionPrompt, type Project, type Scene, type Brief } from './production';
import { parseWorkflow, type WorkflowNode, type WorkflowEdge } from './workflow';
export function projectToWorkflow(project: Project, scenes: Scene[], brief: Brief | null) {
  const nodes: WorkflowNode[] = [], edges: WorkflowEdge[] = [];
  const mergeId = `merge-${project._id}`;
  for (const s of [...scenes].sort((a, b) => a.order - b.order)) {
    const promptId = `prompt-${s._id}`, videoId = `video-${s._id}`;
    nodes.push({ id: promptId, type: 'textPrompt', position: { x: 0, y: s.order * 220 }, data: { prompt: `KEYFRAME / STAGING:\n${keyframePrompt(project, s, brief)}\n\nMOTION:\n${motionPrompt(s)}`, negativePrompt: 'identity drift, malformed hands, floating objects, text, watermark' } });
    nodes.push({ id: videoId, type: 'videoGenerate', position: { x: 450, y: s.order * 220 }, data: { customName: `${s.order + 1} · ${s.role}`, provider: 'google', model: 'veo-3.1-lite-generate-preview', duration: s.endSec - s.startSec, aspectRatio: '9:16', fps: 24, resolution: '720p', preserveIdentity: true } });
    edges.push({ id: `text-${s._id}`, source: promptId, target: videoId, targetHandle: 'text' }, { id: `merge-${s._id}`, source: videoId, target: mergeId, targetHandle: 'video' });
  }
  nodes.push({ id: mergeId, type: 'videoMerge', position: { x: 900, y: 0 }, data: {} });
  const context = `Character bible: ${project.characterBible}\nContinuity: ${brief?.continuity || ''}\nClaim ledger (only use approved entries, never add facts):\n${brief?.claims.filter(c => c.status !== 'unverified').map(c => `[${c.status}] ${c.text} ${c.anchors.join(' ')}`).join('\n') || 'No externally verified facts provided.'}`;
  return parseWorkflow({ version: 1, page: { id: `project-${project._id}`, name: project.title, context, snapshot: { nodes, edges } } });
}
