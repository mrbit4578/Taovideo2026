import { useState } from 'react';
import App from './App';
import WorkflowStudio from './WorkflowStudio';
import ProviderPanel from './ProviderPanel';
export default function StudioShell() {
  const [tab, setTab] = useState<'director' | 'workflow' | 'api'>('workflow');
  const [, refresh] = useState(0);
  return <><header className="cinema-nav"><a className="cinema-brand" href="#" onClick={e => { e.preventDefault(); setTab('workflow'); }}><span>◈</span> DIRECTOR STUDIO <small>CINEMA LAB</small></a><nav aria-label="Không gian sản xuất"><button className={tab === 'director' ? 'active' : ''} onClick={() => setTab('director')}>Tiền kỳ</button><button className={tab === 'workflow' ? 'active' : ''} onClick={() => setTab('workflow')}>Workflow điện ảnh</button><button className={tab === 'api' ? 'active' : ''} onClick={() => setTab('api')}>API & chi phí</button></nav></header><div hidden={tab !== 'director'}><App /></div><div hidden={tab !== 'workflow'}><WorkflowStudio openApi={() => setTab('api')} /></div><div hidden={tab !== 'api'}><ProviderPanel onChange={() => refresh(x => x + 1)} /></div></>;
}
