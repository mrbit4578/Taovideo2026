from pathlib import Path
import hashlib, json, re, subprocess

root = Path(__file__).resolve().parent.parent
docs = root / 'docs' / 'cinema-studio'
manifest = json.loads((docs/'source-manifest.json').read_text(encoding='utf-8'))
for row in manifest['files']:
    if '!/' not in row['path']:
        data=(root/row['path']).read_bytes()
        assert hashlib.sha256(data).hexdigest()==row['sha256'], row['path']
    else:
        archive,member=row['path'].split('!/',1)
        extracted=root/'_audit'/('mang-noron-rar' if archive=='mang noron.rar' else Path(archive).stem)/member
        assert hashlib.sha256(extracted.read_bytes()).hexdigest()==row['sha256'], row['path']
pilot=json.loads((docs/'pilot-manifest.json').read_text(encoding='utf-8'))
assert len(pilot['shots'])==12
assert len({s['id'] for s in pilot['shots']})==12
assert sum(s['durationFrames'] for s in pilot['shots'])==pilot['targetRuntimeFrames']==2160
assert all(s['durationFrames']>0 and isinstance(s['durationFrames'],int) for s in pilot['shots'])
assert pilot['budget']['paidDispatchAllowed'] is False
assert not pilot['assets'] and not pilot['takes']
broken=[]
for file in docs.glob('*.md'):
    for target in re.findall(r'\]\(([^)]+)\)',file.read_text(encoding='utf-8')):
        if target.startswith(('https://','http://','#')):continue
        target=target.split('#')[0]
        if not (file.parent/target).exists():broken.append((file.name,target))
assert not broken,broken
buildFiles=[]
for file in sorted((root/'_audit'/'validation'/'build-dist').rglob('*')):
    if not file.is_file():continue
    relative=file.relative_to(root/'_audit'/'validation'/'build-dist')
    baseline=root/'_audit'/'TikTok_Video_Maker'/'dist'/relative
    assert file.read_bytes()==baseline.read_bytes(),str(relative)
    buildFiles.append({'path':relative.as_posix(),'sha256':hashlib.sha256(file.read_bytes()).hexdigest(),'matches_archive_byte_for_byte':True})
assert len(buildFiles)==3
ffmpeg=subprocess.run(['ffmpeg','-hide_banner','-v','error','-f','lavfi','-i','sine=frequency=440:duration=1:sample_rate=48000','-f','lavfi','-i','sine=frequency=220:duration=1:sample_rate=48000','-filter_complex','[1:a]volume=0.15[beat];[0:a]asplit=2[nkey][narr];[beat][nkey]sidechaincompress=threshold=0.02:ratio=8:attack=200:release=800:makeup=1[ducked];[narr][ducked]amix=inputs=2:duration=first:normalize=0,alimiter=limit=0.95:level=0:latency=1[aout]','-map','[aout]','-f','null','-'],capture_output=True,text=True)
assert ffmpeg.returncode==0,ffmpeg.stderr
probes=json.loads((root/'_audit'/'validation'/'source-probes.json').read_text(encoding='utf-8'))
assert len(probes['results'])==6 and all(p['result']=='confirmed' for p in probes['results'])
director=json.loads((root/'_audit'/'validation'/'director-probes.json').read_text(encoding='utf-8'))
assert len(director['checks'])==4 and all(p['result']=='confirmed' for p in director['checks'])
report={'date':'2026-10-03','source_records':len(manifest['files']),
 'originals_and_extracted_sources_unchanged':True,'pilot_plan_frames':2160,'pilot_runtime_seconds':90,
 'local_markdown_links_valid':True,'source_probes_confirmed':6,'director_function_probes_confirmed':4,
 'build':{'command':'npm.cmd run build -- --outDir ../validation/build-dist','result':'passed TypeScript check and Vite build','artifacts':buildFiles,'dependency_install_note':'npm install --ignore-scripts in isolated copy; original bun.lock retained; byte-identical output confirmed'},
 'ffmpeg_smoke':{'result':'passed','scope':'1s synthetic sine signals, null output; syntax/runtime only'},
 'not_verified':['live Type session/backend/publication','generation providers','film audiovisual quality','actual provider cost','current social-platform policies','missing neural-network source documents and source index'],
 'new_director_integration':json.loads((root/'apps/director-studio/integration-test-results.json').read_text(encoding='utf-8'))}
(root/'_audit'/'validation'/'deliverable-checks.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps(report,ensure_ascii=False,indent=2))
