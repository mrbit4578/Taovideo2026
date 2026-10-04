import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

// Anchor to this file, not Vercel's invocation directory or npm's --prefix handling.
const appDirectory = fileURLToPath(new URL('../apps/director-studio/', import.meta.url));
try {
  const manifest = JSON.parse(readFileSync(new URL('../apps/director-studio/package.json', import.meta.url), 'utf8'));
  const lock = JSON.parse(readFileSync(new URL('../apps/director-studio/package-lock.json', import.meta.url), 'utf8'));
  if (!lock.lockfileVersion || manifest.name !== lock.name) throw new Error('Missing or incorrect app lockfile');
  console.log(`[studio install] ${manifest.name}; lockfile v${lock.lockfileVersion}; Node ${process.version}`);
  console.log(`[studio install] Working directory: ${appDirectory}`);
} catch (error) {
  console.error(`[studio install] ${error.message}. Deploy with Vercel Root Directory set to the repository root (.).`);
  process.exit(1);
}

// Build tools are needed even when the platform sets NODE_ENV=production.
// The command is fixed; no user input or credentials enter the shell string.
const result = spawnSync('npm ci --include=dev --no-audit --no-fund', {
  cwd: appDirectory, shell: true, stdio: 'inherit',
});
if (result.error) console.error(`[studio install] Could not start npm: ${result.error.message}`);
process.exit(result.status ?? 1);
