// Converte la build a file singolo in una pagina per Artifact:
// rimuove lo scheletro <html>/<head>/<body> (lo aggiunge la piattaforma)
// e carica React dalla CDN prima del codice dell'app.
import { readFileSync, writeFileSync } from 'node:fs';

const src = readFileSync('dist-artifact/index.html', 'utf8');
const head = src.match(/<head>([\s\S]*?)<\/head>/i)?.[1] ?? '';
const body = src.match(/<body>([\s\S]*?)<\/body>/i)?.[1] ?? '';

const pick = (re) => (head.match(re) ?? []).join('\n');
const title = pick(/<title>[\s\S]*?<\/title>/i);
const metas = pick(/<meta name="(?:claude:viewport-fit-sides|description|theme-color)"[^>]*>/gi);
const links = pick(/<link[^>]+(?:fonts\.googleapis|fonts\.gstatic)[^>]*>/gi);
const styles = pick(/<style[^>]*>[\s\S]*?<\/style>/gi);
const scripts = pick(/<script type="module"[^>]*>[\s\S]*?<\/script>/gi);

const react = [
  '<script src="https://cdnjs.cloudflare.com/ajax/libs/react/18.3.1/umd/react.production.min.js"></script>',
  '<script src="https://cdnjs.cloudflare.com/ajax/libs/react-dom/18.3.1/umd/react-dom.production.min.js"></script>',
].join('\n');

const bodyClean = body.replace(/<script[\s\S]*?<\/script>/gi, '').trim();
const out = [title, metas, links, styles, bodyClean, react, scripts].filter(Boolean).join('\n');
writeFileSync('dist-artifact/sirena-118.html', out);
console.log(`dist-artifact/sirena-118.html: ${(out.length / 1024).toFixed(1)} KB`);
