import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import StudioShell from "./StudioShell";
import "./styles.css";
import "./cinema.css";
import { TYPE_MODE } from "./studioClient";
import { createTypeAppClient, TypeAppProvider } from "./typeAuth";
import { STORAGE_KEY } from "../shared/localStore";

function exportBackup() {
  const raw = localStorage.getItem(STORAGE_KEY) ?? '{"version":1,"tables":{"projects":[],"scenes":[],"briefs":[]}}';
  const url = URL.createObjectURL(new Blob([raw], { type: "application/json" }));
  const a = document.createElement("a"); a.href = url; a.download = "director-studio-backup.json"; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
const content = <><div className="runtime-banner">
  <span>{TYPE_MODE ? "Workspace Type" : "Dự án & video lưu trong trình duyệt này"} · Free API trước · Không tự chuyển trả phí</span>
  {!TYPE_MODE && <button className="button button-small" onClick={exportBackup}>Sao lưu dự án JSON</button>}
</div><StudioShell /></>;
const element = document.getElementById("root");
if (!element) throw new Error("Thiếu root");
const client = TYPE_MODE ? createTypeAppClient("") : null;
createRoot(element).render(<StrictMode>{client ? <TypeAppProvider client={client}>{content}</TypeAppProvider> : content}</StrictMode>);
