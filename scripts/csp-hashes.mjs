import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { inlineScriptHashes, inlineStyleHashes, withScriptHashes, withStyleHashes } from '../src/lib/csp.ts';

const html = readdirSync('dist', { recursive: true }).filter((f) => f.endsWith('.html')).map((f) => readFileSync(`dist/${f}`, 'utf8'));
const all = (of) => [...new Set(html.flatMap(of))].sort();
const scripts = all(inlineScriptHashes);
const styles = all(inlineStyleHashes);
const headers = readFileSync('dist/_headers', 'utf8');
const withScripts = withScriptHashes(headers, scripts);
if (scripts.length && withScripts === headers) throw new Error('csp-hashes: script-src não encontrado em dist/_headers');
const out = withStyleHashes(withScripts, styles);
if (styles.length && out === withScripts) throw new Error('csp-hashes: style-src não encontrado em dist/_headers');
writeFileSync('dist/_headers', out);
console.log(`csp-hashes: ${scripts.length} hash(es) de script e ${styles.length} de style em dist/_headers`);
