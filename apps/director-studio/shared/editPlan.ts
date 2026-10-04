export type EditableTake = { id: string; shotId: string; approved: boolean; duration: number; createdAt: number; inEdit?: boolean; editOrder?: number; inPoint?: number; outPoint?: number };
export function buildEditPlan<T extends EditableTake>(shotIds: string[], shots: { id: string; duration: number }[], takes: T[]) {
  const sequence: (T & { inPoint: number; outPoint: number })[] = [];
  const coverage = shotIds.map(id => {
    const target = shots.find(s => s.id === id)?.duration || 0;
    let remaining = target;
    const selected = takes.filter(t => t.shotId === id && t.approved && t.inEdit).sort((a, b) => (a.editOrder ?? a.createdAt) - (b.editOrder ?? b.createdAt) || a.createdAt - b.createdAt);
    for (const t of selected) {
      const start = Math.max(0, t.inPoint || 0), end = Math.min(t.duration, t.outPoint ?? t.duration);
      if (![start, end, t.duration].every(Number.isFinite) || end <= start || remaining <= 0) continue;
      const duration = Math.min(end - start, remaining);
      sequence.push({ ...t, inPoint: start, outPoint: start + duration }); remaining -= duration;
    }
    return { id, target, duration: target - remaining, complete: target > 0 && remaining < 1 / 24 };
  });
  return { sequence, coverage, ready: coverage.length > 0 && coverage.every(c => c.complete) };
}
