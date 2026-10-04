import { execFileSync } from 'node:child_process';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
const git = process.platform === 'win32' ? 'C:/Program Files/Git/cmd/git.exe' : 'git';
const paths = execFileSync(git, ['ls-files', '--cached', '--others', '--exclude-standard', '-z'], { encoding: 'utf8' }).split('\0').filter(Boolean);
const files = []; const suspicious = [];
for (const path of [...new Set(paths)].sort()) {
  const bytes = await readFile(path);
  const binary = /\.(zip|rar|png|jpg|jpeg|webp|mp4|wav)$/i.test(path) || bytes.includes(0);
  if (!binary) {
    const text = bytes.toString('utf8');
    for (const pattern of [/\bsk-(?:proj-|ant-)?[A-Za-z0-9_-]{30,}\b/g, /\bgh[pousr]_[A-Za-z0-9]{30,}\b/g, /\bgithub_pat_[A-Za-z0-9_]{30,}\b/g, /\bapx_live_[A-Za-z0-9_-]{20,}\b/g, /\bAIza[A-Za-z0-9_-]{30,}\b/g, /\beyJ[A-Za-z0-9_-]{30,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\b/g]) if (pattern.test(text)) suspicious.push(path);
  }
  const blobSha = createHash('sha1').update(`blob ${bytes.length}\0`).update(bytes).digest('hex');
  files.push({ path, bytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex'), blobSha, encoding: binary ? 'base64' : 'utf-8' });
}
await mkdir('.publish', { recursive: true });
await writeFile('.publish/manifest.json', JSON.stringify(files, null, 2));
console.log(JSON.stringify({ files: files.length, bytes: files.reduce((n, f) => n + f.bytes, 0), binary: files.filter(f => f.encoding === 'base64').length, suspicious: [...new Set(suspicious)], largest: [...files].sort((a, b) => b.bytes - a.bytes).slice(0, 8).map(f => ({ path: f.path, bytes: f.bytes })) }));
if (suspicious.length) process.exitCode = 1;
