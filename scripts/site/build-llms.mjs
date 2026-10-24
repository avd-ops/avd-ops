// Copies the canonical generated root llms.txt into the directory published by Pages.
import { copyFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../../', import.meta.url));
copyFileSync(resolve(root, 'llms.txt'), resolve(root, 'site/llms.txt'));
