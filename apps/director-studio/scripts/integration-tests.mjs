import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { build } from 'esbuild';
import { pathToFileURL } from 'node:url';
import os from 'node:os';
const temp=fs.mkdtempSync(path.join(os.tmpdir(),'director-integration-'));
const modules={};
for(const name of ['production','localStore']) {
  const outfile=path.join(temp,name+'.mjs');
  await build({entryPoints:['shared/'+name+'.ts'],bundle:true,platform:'node',format:'esm',outfile});
  modules[name]=await import(pathToFileURL(outfile));
}
const p=modules.production, local=modules.localStore;
const checks=[];
async function check(name,fn){await fn();checks.push({name,passed:true});console.log('PASS '+name);}
let snapshot=local.emptySnapshot();
const read=(name,args={})=>local.executeLocal(snapshot,name,args,false);
const write=async(name,args)=>{
  const draft=structuredClone(snapshot);
  const result=await local.executeLocal(draft,name,args,true);
  snapshot=draft;return result;
};
const newFiles=fs.readdirSync('knowledge/video-briefs').sort();
const raws=newFiles.map(name=>fs.readFileSync('knowledge/video-briefs/'+name,'utf8'));
const briefs=raws.map(p.parseBrief);
const ids=[];
await check('All 12 brief variants parse, v2 frontmatter stays with each heading',()=>{
  assert.equal(p.splitBriefDocuments(raws.join('\n\n')).length,6);
  for(const raw of raws){assert.equal(p.splitBriefDocuments(raw).length,1);assert.ok(p.parseBrief(raw).series);}
  for(const file of fs.readdirSync('knowledge-legacy/video-briefs')) assert.ok(p.parseBrief(fs.readFileSync('knowledge-legacy/video-briefs/'+file,'utf8')).claims.length);
  assert.deepEqual(briefs.map(b=>b.durationSec),[60,60,60,60,60,90]);
  assert.ok(briefs.every(b=>b.claims.every(c=>c.status!=='verified')));
  assert.ok(briefs[0].warnings.some(w=>w.includes('UNVERIFIED')));
});
await check('Six briefs create six real local projects and correctly ordered continuous timelines',async()=>{
  for(const b of briefs){
    const {scenes,outline}=p.scenesFromBrief(b,b.durationSec,b.cta);
    assert.equal(scenes[0].startSec,0);assert.equal(scenes.at(-1).endSec,b.durationSec);
    scenes.forEach((s,i)=>{assert.ok(s.endSec>s.startSec);if(i)assert.equal(s.startSec,scenes[i-1].endSec);});
    assert.equal(scenes.filter(s=>s.role==='Tóm tắt một câu').length,1);
    const id=await write('createProjectFromBrief',{
      title:b.title,durationSec:b.durationSec,now:Date.now(),
      brief:{audience:b.audience,pain:b.hook,angle:b.angle,evidence:'Chưa xác minh nguồn',cta:b.cta},
      hooks:[{type:b.hookType,text:b.hook}],selectedHook:0,characterBible:'Fictional Vietnamese presenter in a navy sweater.',scenes,
      knowledge:{series:b.series,briefNo:b.briefNo,source:b.source,claims:b.claims,risk:{accuracy:b.riskAccuracy,notes:b.riskNotes},outline,continuity:b.continuity,raw:b.raw}
    });ids.push(id);
  }
  assert.equal((await read('listProjects')).length,6);
  const b=await read('listBriefs');
  assert.equal(b.filter(x=>x.series==='nn-co-ban').length,3);
  assert.equal(b.filter(x=>x.series==='ai-agent-doanh-nghiep').length,3);
});
await check('Imported VERIFIED cannot be forged through a backend mutation',async()=>{
  const b=await read('getBrief',{projectId:ids[0]});const before=JSON.stringify(snapshot);
  await assert.rejects(()=>write('upsertBrief',{projectId:ids[0],now:Date.now(),patch:{claims:[{...b.claims[0],status:'verified'}]}}),/bằng chứng/);
  assert.equal(JSON.stringify(snapshot),before);
});
await check('Shot edits and claim edits invalidate earlier approvals and QC',async()=>{
  const {scenes}=await read('getProject',{projectId:ids[0]});
  await write('updateScene',{sceneId:scenes[0]._id,now:Date.now(),patch:{status:{keyframe:true,take:true,approved:true,assembled:true}}});
  await write('updateProject',{projectId:ids[0],now:Date.now(),patch:{qc:['0-0','0-0']}});
  assert.deepEqual((await read('getProject',{projectId:ids[0]})).project.qc,['0-0']);
  await write('updateScene',{sceneId:scenes[0]._id,now:Date.now(),patch:{subject:'Presenter holds a real printed photograph.'}});
  let data=await read('getProject',{projectId:ids[0]});
  assert.equal(data.scenes[0].status.approved,false);assert.deepEqual(data.project.qc,[]);
  await write('updateScene',{sceneId:scenes[1]._id,now:Date.now(),patch:{status:{keyframe:true,take:true,approved:true,assembled:true}}});
  await write('upsertBrief',{projectId:ids[0],now:Date.now(),patch:{continuity:'Revised staging'}});
  data=await read('getProject',{projectId:ids[0]});assert.ok(data.scenes.every(s=>!s.status.approved));
});
await check('Invalid scene order, empty board and invalid hook selection are rejected atomically',async()=>{
  const {project,scenes}=await read('getProject',{projectId:ids[0]});
  const inputs=scenes.map(({_id,_creationTime,projectId,...s})=>s);
  await assert.rejects(()=>write('replaceScenes',{projectId:project._id,scenes:[],now:Date.now()}),/1–12/);
  await assert.rejects(()=>write('replaceScenes',{projectId:project._id,scenes:inputs.map(s=>({...s,order:0})),now:Date.now()}),/Timeline/);
  await assert.rejects(()=>write('updateProject',{projectId:project._id,patch:{selectedHook:20},now:Date.now()}),/không tồn tại/);
  assert.equal((await read('getProject',{projectId:project._id})).scenes.length,scenes.length);
});
await check('ASS rounds through second/minute rollover and short cues retain positive duration',()=>{
  assert.equal(p.assTime(1.999),'0:00:02.00');assert.equal(p.assTime(59.999),'0:01:00.00');
  const cues=p.subCues({startSec:0,endSec:1,voiceover:'Một câu dài để kiểm tra. Hai. Ba.'});
  assert.ok(cues.every(c=>c.end>c.start));assert.equal(cues.at(-1).end,1);
});
await check('90s standard plan, short inputs and excessive outlines are bounded',()=>{
  assert.equal(p.standardScenes(90).at(-1).endSec,90);
  assert.throws(()=>p.parseBrief(raws[0].replace('duration: 60','duration: 0')),/5 đến 600/);
  const b={...briefs[0],durationSec:5};const {scenes}=p.scenesFromBrief(b,5,b.cta);
  assert.ok(scenes.every(s=>s.endSec>s.startSec));
});
await check('Raw brief text cannot launder a numeric claim into approved script facts',async()=>{
  const {project,scenes}=await read('getProject',{projectId:ids[0]});const brief=await read('getBrief',{projectId:ids[0]});
  const lint=p.lintProject(project,[{...scenes[0],voiceover:'Hiệu quả tăng 99%.'}],{...brief,raw:brief.raw+'99%'});
  assert.ok(lint.some(l=>l.text.includes('99%')));
});
await check('Export pack keeps claim provenance; override retains character and physics constraints',async()=>{
  const {project,scenes}=await read('getProject',{projectId:ids[0]});const brief=await read('getBrief',{projectId:ids[0]});
  const pack=p.buildHandoff(project,scenes,brief);assert.ok(pack.includes('nn-knowledge-map-v1'));assert.ok(pack.includes('UNVERIFIED'));
  const prompt=p.keyframePrompt(project,{...scenes[0],promptOverride:'Presenter in a cafe'},brief);
  assert.ok(prompt.includes(project.characterBible));assert.ok(prompt.includes('Hands, eyes and objects physically consistent'));
  const script=p.buildFfmpegScript(project,[{...scenes[0],voiceover:'Một câu.'},...scenes.slice(1)]);
  assert.ok(script.includes('apad=whole_dur=60'));assert.ok(script.includes('atrim=duration=10'));assert.ok(script.includes('level=0'));assert.ok(script.includes('-stream_loop -1'));
  const tl=p.timelapseScenes({boiCanh:'lot',vatNeo:'boulder',kienTruc:'house',chu:'Tiến độ'});
  const tlScript=p.buildFfmpegScript({...project,format:'timelapse',durationSec:60},tl);
  assert.ok(tlScript.includes('atrim=0:60.00'));assert.ok(tlScript.includes('offset=57.00'));
});
await check('Persisted snapshot reloads and deleting a project cascades only its scenes and brief',async()=>{
  snapshot=local.parseSnapshot(JSON.stringify(snapshot));
  await write('deleteProject',{projectId:ids[0]});
  assert.equal(await read('getProject',{projectId:ids[0]}),null);assert.equal(await read('getBrief',{projectId:ids[0]}),null);
  assert.equal((await read('listProjects')).length,5);assert.equal((await read('listBriefs')).length,5);
  assert.ok((await read('getProject',{projectId:ids[1]})).scenes.length);
});
fs.writeFileSync('integration-test-results.json',JSON.stringify({date:new Date().toISOString(),checks},null,2));
console.log(`${checks.length} integration groups passed.`);
// Remove only our freshly-created, verified temp directory.
assert.ok(temp.startsWith(path.join(os.tmpdir(),'director-integration-')));
fs.rmSync(temp,{recursive:true});
