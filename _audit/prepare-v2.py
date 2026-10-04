from pathlib import Path
import hashlib, json, shutil, difflib

root = Path(__file__).resolve().parent.parent
src = root/'_audit/tiktok-director-skillpack-v2'
app = root/'apps/director-studio'
assert not app.exists(), 'Do not overwrite an existing integration'
app.mkdir(parents=True)
baseline = root/'_audit/TikTok_Video_Maker'
for name in ('convex',):
    shutil.copytree(baseline/name, app/name)
(app/'src').mkdir()
for name in ('typeAuth.tsx','type.d.ts'):
    shutil.copy2(baseline/'src'/name,app/'src'/name)
for name in ('package.json','tsconfig.json','vite.config.ts','index.html'):
    shutil.copy2(baseline/name,app/name)
for name in ('convex/app.ts','convex/schema.ts','src/App.tsx','src/styles.css'):
    shutil.copy2(src/'director-studio-app-v2'/name,app/name)
shutil.copytree(src/'knowledge-v2',app/'knowledge')
shutil.copytree(src/'knowledge',app/'knowledge-legacy')
shutil.copytree(src/'tiktok-director-skill',app/'reference/director-skill')
shutil.copy2(src/'AUDIT-KAIZEN.md',app/'reference/AUDIT-KAIZEN-source.md')
rows=[]
for p in sorted(src.rglob('*')):
    if not p.is_file(): continue
    data=p.read_bytes()
    older=root/'_audit/tiktok-director-skillpack'/p.relative_to(src)
    # v1's authored app directory uses a different name.
    rel=p.relative_to(src).as_posix().replace('director-studio-app-v2/','director-studio-app/')
    older=root/'_audit/tiktok-director-skillpack'/rel
    changed=not older.exists() or data!=older.read_bytes()
    rows.append({'path':p.relative_to(src).as_posix(),'bytes':len(data),'sha256':hashlib.sha256(data).hexdigest(),'changed_from_v1':changed})
    if changed and older.exists() and p.suffix in ('.md','.tsx','.ts','.css'):
        target=root/'_audit/validation/v2-diffs'/p.relative_to(src)
        target=target.with_suffix(target.suffix+'.diff')
        target.parent.mkdir(parents=True,exist_ok=True)
        target.write_text(''.join(difflib.unified_diff(older.read_text(encoding='utf-8-sig').splitlines(True),data.decode('utf-8-sig').splitlines(True),fromfile=str(older),tofile=str(p))),encoding='utf-8')
rar=[]
for p in sorted((root/'_audit/mang-noron-rar/mang noron').rglob('*')):
    if p.is_file():
        data=p.read_bytes(); original=root/'mang noron'/p.relative_to(root/'_audit/mang-noron-rar/mang noron')
        rar.append({'path':str(p.relative_to(root/'_audit/mang-noron-rar')),'bytes':len(data),'sha256':hashlib.sha256(data).hexdigest(),'identical_to_existing':original.exists() and data==original.read_bytes()})
result={'zip_members':rows,'rar_members':rar,'archives':{n:hashlib.sha256((root/n).read_bytes()).hexdigest() for n in ('mang noron.rar','tiktok-director-skillpack-v2.zip')}}
(root/'_audit/validation/v2-source-review.json').write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf-8')
pkg=json.loads((app/'package.json').read_text())
pkg['name']='cinema-director-studio';pkg['version']='0.2.0'
pkg['scripts'].update({'preview':'vite preview --host 127.0.0.1','test':'node scripts/integration-tests.mjs'})
(app/'package.json').write_text(json.dumps(pkg,indent=2)+'\n')
ts=json.loads((app/'tsconfig.json').read_text());ts['include']=['src','shared','convex']
(app/'tsconfig.json').write_text(json.dumps(ts,indent=2)+'\n')
print(json.dumps({'zip_files':len(rows),'rar_files':len(rar),'rar_identical':sum(r['identical_to_existing'] for r in rar),'changed_files':[r['path'] for r in rows if r['changed_from_v1']]},ensure_ascii=False,indent=2))
