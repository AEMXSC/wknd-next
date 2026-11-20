// Run with: npm test (node --test; Node strips the TypeScript types natively).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isStudioOrigin, patchesFor, readDraft } from '../src/lib/studio-drafts.ts';

test('origin: only SC Studio frames, on any branch', () => {
  assert.ok(isStudioOrigin('https://main--sc-studio--aemxsc.preview.da.live'));
  assert.ok(isStudioOrigin('https://feat-live-form--sc-studio--aemxsc.aem.page'));
  assert.ok(!isStudioOrigin('https://main--sc-studio--evil.preview.da.live'));
  assert.ok(!isStudioOrigin('https://main--sc-studio--aemxsc.preview.da.live.evil.com'));
  assert.ok(!isStudioOrigin('http://main--sc-studio--aemxsc.preview.da.live'));
});

test('readDraft: needs the type, this site, a path and data', () => {
  const ok = {
    type: 'structured-content', org: 'aemxsc', site: 'wknd-adventures', path: '/wknd-next/alerts/x', data: { title: 'T' },
  };
  assert.deepEqual(readDraft(ok, 'aemxsc', 'wknd-adventures')?.path, '/wknd-next/alerts/x');
  assert.equal(readDraft({ ...ok, site: 'other' }, 'aemxsc', 'wknd-adventures'), null);
  assert.equal(readDraft({ ...ok, type: 'structured-content-ready' }, 'aemxsc', 'wknd-adventures'), null);
  assert.equal(readDraft({ ...ok, data: undefined }, 'aemxsc', 'wknd-adventures'), null);
  assert.equal(readDraft(null, 'aemxsc', 'wknd-adventures'), null);
});

test('patches: fields map to the markers the components use; long text is escaped', () => {
  const patches = patchesFor({ title: 'Fire ban', details: 'a <b>\n\nb', order: 3 });
  assert.deepEqual(patches, [
    { prop: 'termsReference', kind: 'text', value: 'Fire ban' },
    { prop: 'title', kind: 'text', value: 'Fire ban' },
    { prop: 'termDetails', kind: 'html', value: '<p>a &lt;b&gt;</p><p>b</p>' },
  ]);
});

test('patches: images take https strings or the picker { src }, nothing else', () => {
  assert.equal(patchesFor({ image: 'https://x/a.jpg' })[0].value, 'https://x/a.jpg');
  assert.equal(patchesFor({ image: { src: 'https://x/b.jpg', altText: 'b' } })[0].value, 'https://x/b.jpg');
  assert.deepEqual(patchesFor({ image: 'javascript:alert(1)' }), []);
  assert.deepEqual(patchesFor({ image: '' }), []);
});
