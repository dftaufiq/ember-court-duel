// Ember Court — the hand-in program (Node 22, standard library only).
// The game itself is plain static files under game/ (index.html plus its
// modules and stylesheet, no build step, no network request), and the four
// screenshots under screenshots/ are real renders of that code in a desktop
// browser. This program copies both folders to /output and writes
// /output/dossier.json with the vendored make.fun library, exactly as the
// gate scorer rebuilds it — so what the judge reads is what is handed in.
//
// Run it outside the grader with MAKEFUN_OUTPUT_DIR standing in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(out, { recursive: true });
cpSync(join(here, 'game'), join(out, 'game'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) {
  cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });
}

// The gate's own caps, from the kit: at most 4 screenshots of 256 KiB each,
// game/ at most 993 entries and 48 MiB, paths at most 1000 bytes. The
// dossier text is capped at 160 KiB by buildDossier itself.
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    game_max_files: 993,
    game_max_bytes: 50331648,
    game_path_max_bytes: 1000,
  }),
);
