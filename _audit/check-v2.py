from pathlib import Path
import hashlib,json,subprocess
root=Path(__file__).resolve().parent.parent
app=root/'apps/director-studio'
source=json.loads((root/'_audit/validation/v2-source-review.json').read_text(encoding='utf-8'))
for name,sha in source['archives'].items():
    assert hashlib.sha256((root/name).read_bytes()).hexdigest()==sha,name
assert len(source['zip_members'])==27
assert len(source['rar_members'])==8 and all(r['identical_to_existing'] for r in source['rar_members'])
for row in source['zip_members']:
    p=root/'_audit/tiktok-director-skillpack-v2'/row['path']
    assert hashlib.sha256(p.read_bytes()).hexdigest()==row['sha256']
tests=json.loads((app/'integration-test-results.json').read_text())
assert len(tests['checks'])==10 and all(c['passed'] for c in tests['checks'])
artifacts=[]
for p in sorted((app/'dist').rglob('*')):
    if p.is_file():artifacts.append({'path':p.relative_to(app).as_posix(),'bytes':p.stat().st_size,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()})
assert len(artifacts)==3
shot=root/'_audit/validation/director-v2-preview.jpg'
assert shot.read_bytes().startswith(b'\xff\xd8\xff')
probe=subprocess.run(['ffprobe','-v','error','-select_streams','v:0','-show_entries','stream=nb_frames,duration,r_frame_rate','-of','json',str(root/'_audit/validation/v2-xfade-smoke.mp4')],capture_output=True,text=True,check=True)
media=json.loads(probe.stdout)['streams'][0]
assert media['nb_frames']=='48' and float(media['duration'])==2 and media['r_frame_rate']=='24/1'
frontend=(app/'src/main.tsx').read_text(encoding='utf-8')
assert '.convex.cloud' not in frontend and 'DEVELOPMENT_BACKEND_URL' not in frontend
result={'source_containers_unchanged':True,'source_members_preserved':35,'rar_all_eight_duplicate':True,
    'integrated_project':str(app),'build':{'command':'npm.cmd run build','result':'passed (observed exit 0)','artifacts':artifacts},
    'test_groups':tests['checks'],'browser':{'observed':'six projects, two series; brief 06 90s/eight scenes; VERIFIED disabled without evidence; reload persistence; console error list empty','screenshot':str(shot),'download_automation':'timeout; not confirmed'},
    'ffmpeg_xfade_smoke':media,'limitations':['no full film/media-provider job','no full production-pack render','Type deployment not configured','source documents/index missing','local backup restore UI not implemented']}
(root/'_audit/validation/v2-integration-checks.json').write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps({'source_files_preserved':35,'test_groups_passed':10,'built_artifacts':len(artifacts),'xfade_frames':media['nb_frames'],'browser_preview_saved':True},ensure_ascii=False))
