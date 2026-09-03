#!/usr/bin/env node
/**
 * Build the `antsheet` workspace package so its `dist/` is available
 * before `next build` runs.
 *
 * Why this script exists (instead of `pnpm --filter antsheet build`):
 *  - On the Cloudflare Pages build environment, `pnpm --filter` from
 *    `apps/web` does not resolve the `antsheet` workspace project and
 *    aborts with "No projects matched the filters".
 *  - Relative paths like `../../antsheet` are also fragile because the
 *    effective cwd of an npm-script can differ from the package
 *    directory (depending on how the runner spawns the shell).
 *
 * This script resolves `antsheet` relative to its own location
 * (`apps/web/scripts/build-antsheet.mjs` -> `apps/web` -> repo -> `antsheet`)
 * so it works regardless of the current working directory, on any OS.
 */
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// apps/web/scripts -> apps/web -> repo -> antsheet
const antsheetDir = path.resolve(__dirname, '..', '..', '..', 'antsheet');

if (!existsSync(path.join(antsheetDir, 'package.json'))) {
  console.error(
    `[build-antsheet] Cannot find antsheet at: ${antsheetDir}\n` +
      `Expected to find package.json there. Aborting.`
  );
  process.exit(1);
}

console.log(`[build-antsheet] Building antsheet in: ${antsheetDir}`);

const result = spawnSync('pnpm', ['run', 'build'], {
  cwd: antsheetDir,
  stdio: 'inherit',
  shell: process.platform === 'win32',
});

if (result.error) {
  console.error(`[build-antsheet] Failed to spawn pnpm:`, result.error);
  process.exit(1);
}

process.exit(result.status ?? 1);
