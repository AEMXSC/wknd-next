// Run with: npm test (node --test; Node strips the TypeScript types natively).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  textToHtml, toAdventures, toAlerts, toHeroSet, toPersonas, type ScRecord,
} from '../src/lib/sc-map.ts';

const rec = (path: string, data: Record<string, unknown>): ScRecord => ({ path, metadata: {}, data });

test('hero: the record without a persona is master, the rest are keyed variations', () => {
  const set = toHeroSet([
    rec('/wknd-next/hero/maya-surfer', { persona: 'maya-surfer', title: 'Swell' }),
    rec('/wknd-next/hero/default', { title: 'Default', image: 'https://x/a.jpg' }),
  ]);
  assert.ok(set);
  assert.equal(set.master.title, 'Default');
  assert.equal(set.master.variation, 'master');
  assert.equal(set.master.image, 'https://x/a.jpg');
  assert.deepEqual(Object.keys(set.variations), ['maya-surfer']);
  assert.equal(set.variations['maya-surfer'].title, 'Swell');
});

test('hero: no records means no hero', () => {
  assert.equal(toHeroSet([]), null);
});

test('long text is escaped and split into paragraphs', () => {
  assert.equal(textToHtml('a <b>&\n\nsecond'), '<p>a &lt;b&gt;&amp;</p><p>second</p>');
  assert.equal(textToHtml(''), '');
});

test('adventures sort by order, keep the alert path, and drop non-https URLs', () => {
  const [first, second] = toAdventures([
    rec('/wknd-next/adventures/b', { headline: 'B', order: 2, ctaUrl: 'javascript:alert(1)' }),
    rec('/wknd-next/adventures/a', { headline: 'A', order: 1, layout: 'featured', alert: '/wknd-next/alerts/x' }),
  ]);
  assert.equal(first.headline, 'A');
  assert.equal(first.layout, 'featured');
  assert.equal(first.alertPath, '/wknd-next/alerts/x');
  assert.equal(second.layout, 'standard');
  assert.equal(second.ctaUrl, '');
});

test('personas and alerts take their slug from the record path', () => {
  const [p] = toPersonas([rec('/wknd-next/personas/maya-surfer', { name: 'Maya', label: 'Surfer' })]);
  assert.equal(p.slug, 'maya-surfer');
  assert.equal(p.label, 'Surfer');
  const [a] = toAlerts([rec('/wknd-next/alerts/leave-no-trace', { title: 'Fire ban', details: 'No fires' })]);
  assert.equal(a.slug, 'leave-no-trace');
  assert.equal(a.bodyHtml, '<p>No fires</p>');
});
