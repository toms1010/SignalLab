/** Verifies every $...$ inline expression in the lesson data actually renders. */
import katex from 'katex';
import { readFileSync, readdirSync } from 'node:fs';
const dir = 'src/data/lessons';
let total = 0, failed = [];
for (const f of readdirSync(dir).filter(x => x.endsWith('.ts'))) {
  const src = readFileSync(`${dir}/${f}`, 'utf8');
  for (const m of src.matchAll(/\$([^$\n]+)\$/g)) {
    total++;
    try { katex.renderToString(m[1], { throwOnError: true, displayMode: false }); }
    catch (e) { failed.push(`${f}: $${m[1]}$  ->  ${e.message.split('\n')[0]}`); }
  }
}
console.log(`inline math expressions: ${total}, failures: ${failed.length}`);
for (const f of failed.slice(0, 15)) console.log('  ' + f);
process.exit(failed.length ? 1 : 0);
