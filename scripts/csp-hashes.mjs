import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { inlineScriptHashes, withScriptHashes } from '../src/lib/csp.ts';

const htmlFiles = readdirSync('dist', { recursive: true }).filter((f) => f.endsWith('.html'));
const hashes = [...new Set(htmlFiles.flatMap((f) => inlineScriptHashes(readFileSync(`dist/${f}`, 'utf8'))))].sort();
const headers = readFileSync('dist/_headers', 'utf8');
const out = withScriptHashes(headers, hashes);
if (hashes.length && out === headers) throw new Error('csp-hashes: script-src não encontrado em dist/_headers');
writeFileSync('dist/_headers', out);
console.log(`csp-hashes: ${hashes.length} hash(es) em dist/_headers`);
