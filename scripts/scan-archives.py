"""Read archive contents without extracting or executing supplied code; report paths only."""
import json, re, subprocess, zipfile
from pathlib import Path
patterns = [re.compile(p) for p in [r'\bsk-(?:proj-|ant-)?[A-Za-z0-9_-]{30,}\b', r'\bgh[pousr]_[A-Za-z0-9]{30,}\b', r'\bgithub_pat_[A-Za-z0-9_]{30,}\b', r'\bapx_live_[A-Za-z0-9_-]{20,}\b', r'\bAIza[A-Za-z0-9_-]{30,}\b', r'\beyJ[A-Za-z0-9_-]{30,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\b']]
records, suspects = [], []
def scan(archive, member, data):
    if b'\x00' in data: return
    text = data.decode('utf-8', errors='replace')
    records.append({'archive': archive, 'path': member, 'bytes': len(data)})
    if any(p.search(text) for p in patterns): suspects.append({'archive': archive, 'path': member})
for path in sorted(Path('.').glob('*.zip')):
    with zipfile.ZipFile(path) as z:
        for member in z.infolist():
            if not member.is_dir(): scan(path.name, member.filename, z.read(member))
for path in sorted(Path('.').glob('*.rar')):
    names = subprocess.check_output(['tar.exe', '-tf', str(path)], text=True).splitlines()
    for name in names:
        if Path(name).suffix:
            data = subprocess.check_output(['tar.exe', '-xOf', str(path), name])
            scan(path.name, name, data)
result = {'archive_text_files_scanned': len(records), 'suspicious_paths': suspects, 'files': records, 'scope': 'Known key/token patterns, no guarantee of all possible secret formats. No archive code executed.'}
Path('.publish').mkdir(exist_ok=True)
Path('.publish/archive-scan.json').write_text(json.dumps(result, indent=2), encoding='utf-8')
print(json.dumps({k:v for k,v in result.items() if k != 'files'}))
raise SystemExit(bool(suspects))
