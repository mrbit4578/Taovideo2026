from pathlib import Path
import csv, difflib, hashlib, json, zipfile, math, subprocess

root = Path(__file__).resolve().parent.parent
out = root / 'docs' / 'cinema-studio'
out.mkdir(parents=True, exist_ok=True)
rows = []
def add(label, data, category):
    text = data.decode('utf-8-sig', errors='replace') if category != 'archive' else None
    rows.append({'path':label,'bytes':len(data),'sha256':hashlib.sha256(data).hexdigest(),
      'category':category,'lines':len(text.splitlines()) if text is not None else None})
for file in sorted(root.iterdir()):
    if file.is_file() and file.suffix in ('.md','.zip','.rar'):
        add(file.name,file.read_bytes(),'archive' if file.suffix in ('.zip','.rar') else 'knowledge')
        if file.suffix=='.zip':
            with zipfile.ZipFile(file) as archive:
                for entry in archive.infolist():
                    if entry.is_dir(): continue
                    data=archive.read(entry)
                    category='knowledge' if entry.filename.endswith('.md') else 'source'
                    if entry.filename.startswith('dist/'): category='compiled-artifact'
                    elif '/_generated/' in entry.filename: category='generated-bindings'
                    elif entry.filename=='bun.lock': category='dependency-lock'
                    elif entry.filename.startswith('.type/'): category='platform-config'
                    add(file.name+'!/'+entry.filename,data,category)
        if file.suffix=='.rar':
            listing=subprocess.run(['tar.exe','-tf',str(file)],capture_output=True,text=True,check=True).stdout.splitlines()
            base=root/'_audit/mang-noron-rar'
            for name in listing:
                if name.endswith('/'): continue
                member=(base/name).resolve()
                assert member.is_relative_to(base.resolve()),name
                if member.is_dir(): continue
                add(file.name+'!/'+name,member.read_bytes(),'knowledge' if name.endswith('.md') else 'source')
for folder in sorted(root.iterdir()):
    if folder.is_dir() and folder.name not in ('_audit','docs','apps','.git','node_modules'):
        for file in sorted(folder.rglob('*')):
            if file.is_file():
                add(file.relative_to(root).as_posix(),file.read_bytes(),'knowledge' if file.suffix=='.md' else 'supplemental')
(out/'source-manifest.json').write_text(json.dumps({'date':'2026-10-03','timezone':'Asia/Saigon',
  'method':'All source files and archive members read as bytes; SHA-256 computed. Human/model semantic audit focuses on knowledge and app source; generated/minified/dependency files inventoried and inspected as build artifacts, not independent authored logic.',
  'files':rows},ensure_ascii=False,indent=2),encoding='utf-8')
with (out/'source-manifest.csv').open('w',encoding='utf-8-sig',newline='') as f:
    writer=csv.DictWriter(f,fieldnames=rows[0].keys());writer.writeheader();writer.writerows(rows)
with zipfile.ZipFile(root/'tiktok-viral-video-skill.zip') as archive:
    names={'SKILL.md':'tiktok-viral-video/SKILL.md'}
    for name in ('san-xuat-dien-anh.md','loi-doc-phu-de-mix.md','capcut-workflow.md','character-swap.md'):
        names[name]='tiktok-viral-video/references/'+name
    sections=[]
    for local,remote in names.items():
        old=archive.read(remote).decode('utf-8-sig').splitlines(True)
        new=(root/local).read_text(encoding='utf-8-sig').splitlines(True)
        sections.extend(difflib.unified_diff(old,new,fromfile='archive-v2/'+remote,tofile='root-v3/'+local))
    (out/'knowledge-version-diff.txt').write_text(''.join(sections),encoding='utf-8')
checks = {'duplicate_skill':(root/'SKILL.md').read_bytes()==(root/'SKILL (1).md').read_bytes(),
  'duplicate_shot_list':(root/'shot-list-30-keyframes.md').read_bytes()==(root/'shot-list-30-keyframes (1).md').read_bytes(),
  'gain_0_15_db':20*math.log10(.15),'canvas_ratio':720/1280,'swap_ratio':'4:7',
  'thirty_ten_second_clips_overlap_8_frames_at_24fps_seconds':300-29*8/24,
  'thirty_ten_second_clips_overlap_12_frames_at_24fps_seconds':300-29*12/24,
  'frames_at_24fps':{str(s):s*24 for s in (45,60,90,300)},
  'root_files':len([r for r in rows if '!/' not in r['path'] and '/' not in r['path']]),
  'nested_source_files':len([r for r in rows if '!/' not in r['path'] and '/' in r['path']]),
  'archive_members':len([r for r in rows if '!/' in r['path']])}
assert checks['duplicate_skill'] and checks['duplicate_shot_list']
(root/'_audit'/'validation').mkdir(parents=True,exist_ok=True)
(root/'_audit'/'validation'/'inventory-checks.json').write_text(json.dumps(checks,indent=2),encoding='utf-8')
print(json.dumps(checks,indent=2))
