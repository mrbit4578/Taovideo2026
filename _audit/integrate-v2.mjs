import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
const app=path.resolve('apps/director-studio');
const require=createRequire(path.join(app,'package.json'));
const ts=require('typescript');
const source=fs.readFileSync(path.join(app,'convex/app.ts'),'utf8');
const ast=ts.createSourceFile('app.ts',source,ts.ScriptTarget.Latest,true);
fs.mkdirSync(path.join(app,'shared'),{recursive:true});
const start=source.indexOf('export const status');
let service=source.slice(0,start).replace('import { v }','import { v, type Infer }').replace('import { mutation, query } from "./typeFunctions";','import type { QueryCtx, MutationCtx } from "../convex/_generated/server";').replace('from "./schema"','from "../convex/schema"');
let backend='// Domain handlers are shared by the local workspace and the authenticated Type backend.\nimport { mutation, query } from "./typeFunctions";\nimport * as service from "../shared/studioService";\n';
for(const node of ast.statements){
  if(!ts.isVariableStatement(node)||!node.modifiers?.some(m=>m.kind===ts.SyntaxKind.ExportKeyword))continue;
  const decl=node.declarationList.declarations[0];
  if(!decl.initializer||!ts.isCallExpression(decl.initializer))continue;
  const name=decl.name.getText(ast), kind=decl.initializer.expression.getText(ast);
  const obj=decl.initializer.arguments[0];
  const prop=n=>obj.properties.find(p=>p.name?.getText(ast)===n).initializer;
  const args=prop('args').getText(ast), returns=prop('returns').getText(ast);
  const handler=prop('handler');
  const context=kind==='query'?'QueryCtx':'MutationCtx';
  const params=handler.parameters.map((p,i)=>`${p.name.getText(ast)}: ${i===0?context:`Infer<typeof ${name}Args>`}`).join(', ');
  service+=`\nexport const ${name}Args = v.object(${args});\nexport const ${name}Returns = ${returns};\nexport const ${name} = async (${params}) => ${handler.body.getText(ast)};\n`;
  backend+=`\nexport const ${name} = ${kind}({ args: service.${name}Args.fields, returns: service.${name}Returns, handler: service.${name} });\n`;
}
fs.writeFileSync(path.join(app,'shared/studioService.ts'),service);
fs.writeFileSync(path.join(app,'convex/app.ts'),backend);
// Keep pure production/parser code separate and import the exact implementation in tests.
let ui=fs.readFileSync(path.join(app,'src/App.tsx'),'utf8');
const pureStart=ui.indexOf('// ───────────────────────── Types');
const pureEnd=ui.indexOf('// ───────────────────────── Small UI helpers');
const pure=ui.slice(pureStart,pureEnd);
const pureAst=ts.createSourceFile('production.ts',pure,ts.ScriptTarget.Latest,true);
const names=[];
for(const n of pureAst.statements){
  if(ts.isFunctionDeclaration(n)||ts.isTypeAliasDeclaration(n))names.push(n.name.text);
  if(ts.isVariableStatement(n))for(const d of n.declarationList.declarations)names.push(d.name.getText(pureAst));
}
fs.writeFileSync(path.join(app,'shared/production.ts'),'import type { Doc, Id } from "../convex/_generated/dataModel";\n'+pure+'\nexport { '+names.join(', ')+' };\n');
ui=ui.slice(0,pureStart)+'import { '+names.join(', ')+' } from "../shared/production";\n\n'+ui.slice(pureEnd);
ui=ui.replace('from "convex/react"','from "./studioClient"').replace('from "./typeAuth"','from "./studioClient"');
fs.writeFileSync(path.join(app,'src/App.tsx'),ui);
console.log('Extracted shared domain handlers and production parser; original archive untouched.');
