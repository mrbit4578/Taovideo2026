// These are references declared by the imported briefs, not verified evidence.
export const sourceRegistry = [
  { docId: "nn-knowledge-map-v1", file: "ban-do-kien-thuc-mang-no-ron-ai.md", available: false },
  { docId: "nn-llm-agent-v1", file: "ung-dung-mang-no-ron-llm-ai-agent.md", available: false },
];
type Claim = { text: string; anchors: string[]; status: "verified" | "unverified" | "editorial" };
// Add an entry only after a reviewer checks this exact claim against the source.
export const reviewedEvidence: { docId: string; anchor: string; claim: string; url: string; excerpt: string; reviewedBy: string }[] = [];
export function canVerify(docId: string, claim: Claim) {
  return claim.anchors.length > 0 && claim.anchors.every(anchor => reviewedEvidence.some(e =>
    e.docId === docId && e.anchor === anchor.padStart(2, "0") && e.claim === claim.text &&
    /^https?:\/\//.test(e.url) && !!e.excerpt.trim() && !!e.reviewedBy.trim()));
}
export function assertEvidence(docId: string, claims: Claim[]) {
  if (claims.some(c => c.status === "verified" && !canVerify(docId, c))) {
    throw new Error("Chưa có bằng chứng đã đối chiếu cho claim này. Giữ UNVERIFIED hoặc EDITORIAL.");
  }
}
