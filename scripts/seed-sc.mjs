#!/usr/bin/env node
/**
 * Seed the WKND Next structured content into DA (default aemxsc/wknd-adventures).
 * Adapted from AEMXSC/frescopa26 tools/structured-content/seed.mjs.
 *
 *   1. Save each JSON Schema in docs/sc-setup/schemas to /.da/forms/schemas/<name>.html
 *   2. PUT each record in docs/sc-setup/records/<folder>/*.json to /wknd-next/<folder>/
 *   3. POST each record to preview + publish it (this also reindexes the record)
 *   4. With --build-index only: build the preview and live query indexes. Needed
 *      ONCE per site; after that, publishing a record reindexes it.
 *
 * Auth: an Adobe IMS token from DA_TOKEN or ~/.aem/da-token.json
 *   (refresh with: npx github:adobe-rnd/da-auth-helper token)
 *
 * Usage: node scripts/seed-sc.mjs [--dry-run] [--no-publish] [--build-index]
 * Env:   AEM_ORG, AEM_SITE, AEM_SC_ROOT (default /wknd-next)
 */
import { readFile, readdir } from 'node:fs/promises';
import { homedir } from 'node:os';
import { join, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const ORG = process.env.AEM_ORG || 'aemxsc';
const SITE = process.env.AEM_SITE || 'wknd-adventures';
const SC_ROOT = (process.env.AEM_SC_ROOT || '/wknd-next').replace(/\/+$/, '');
const SC_API = 'https://sc-api.adobeaem.workers.dev';
const DA_ADMIN = 'https://admin.da.live';

const SETUP = join(dirname(fileURLToPath(import.meta.url)), '../docs/sc-setup');
const DRY_RUN = process.argv.includes('--dry-run');
const PUBLISH = !process.argv.includes('--no-publish');
const BUILD_INDEX = process.argv.includes('--build-index');

let failures = 0;

async function loadToken() {
  if (process.env.DA_TOKEN) return process.env.DA_TOKEN;
  try {
    const cached = JSON.parse(await readFile(join(homedir(), '.aem/da-token.json'), 'utf8'));
    const token = cached.access_token || cached.token;
    if (token) return token;
  } catch { /* fall through */ }
  throw new Error('No IMS token. Set DA_TOKEN or run: npx github:adobe-rnd/da-auth-helper token');
}

const escapeHtml = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

async function call(label, url, opts) {
  if (DRY_RUN) {
    console.log(`[dry-run] ${opts.method} ${url}  (${label})`);
    return null;
  }
  const resp = await fetch(url, { ...opts, signal: AbortSignal.timeout(30000) });
  const detail = resp.ok ? '' : ` ${resp.headers.get('x-error') || (await resp.text()).slice(0, 200)}`;
  console.log(`${resp.ok ? 'ok  ' : 'FAIL'} ${resp.status} ${label}${detail}`);
  if (resp.status === 401) throw new Error('401 Unauthorized: the IMS token expired. Refresh it and rerun.');
  if (!resp.ok) failures += 1;
  return resp;
}

function daSourceForm(html) {
  const body = new FormData();
  body.append('data', new Blob([html], { type: 'text/html' }));
  return body;
}

async function saveSchemas(auth) {
  const dir = join(SETUP, 'schemas');
  const files = (await readdir(dir)).filter((f) => f.endsWith('.schema.json'));
  for (const file of files) {
    const name = basename(file, '.schema.json');
    const json = await readFile(join(dir, file), 'utf8');
    JSON.parse(json); // fail fast on a malformed schema
    const html = `<body><header></header><main><div><pre><code>${escapeHtml(json.trim())}</code></pre></div></main><footer></footer></body>`;
    await call(`schema ${name}`, `${DA_ADMIN}/source/${ORG}/${SITE}/.da/forms/schemas/${name}.html`, {
      method: 'POST', headers: auth, body: daSourceForm(html),
    });
  }
  return files.map((f) => basename(f, '.schema.json'));
}

async function seedRecords(auth, schemas) {
  const root = join(SETUP, 'records');
  const folders = (await readdir(root, { withFileTypes: true })).filter((d) => d.isDirectory()).map((d) => d.name);
  for (const folder of folders) {
    const files = (await readdir(join(root, folder))).filter((f) => f.endsWith('.json'));
    for (const file of files) {
      const doc = JSON.parse(await readFile(join(root, folder, file), 'utf8'));
      if (!schemas.includes(doc?.metadata?.schemaName)) {
        throw new Error(`${folder}/${file}: unknown metadata.schemaName "${doc?.metadata?.schemaName}"`);
      }
      const url = `${SC_API}/source/${ORG}/${SITE}${SC_ROOT}/${folder}/${file}`;
      await call(`put ${folder}/${file}`, url, {
        method: 'PUT', headers: { ...auth, 'Content-Type': 'application/json' }, body: JSON.stringify(doc),
      });
      if (PUBLISH) await call(`publish ${folder}/${file}`, url, { method: 'POST', headers: auth });
    }
  }
}

async function buildIndexes(auth) {
  for (const tier of ['preview', 'live']) {
    await call(`build ${tier} query.json`, `${SC_API}/${tier}/${ORG}/${SITE}/query.json`, { method: 'POST', headers: auth });
  }
}

async function main() {
  const auth = { Authorization: `Bearer ${DRY_RUN ? 'dry-run' : await loadToken()}` };
  const schemas = await saveSchemas(auth);
  await seedRecords(auth, schemas);
  if (BUILD_INDEX) await buildIndexes(auth);
  console.log(`\nRecord editor: https://da.live/app/aemsites/sc-editor/form#/${ORG}/${SITE}${SC_ROOT}/alerts/leave-no-trace`);
  if (failures) {
    console.error(`${failures} request(s) failed.`);
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
