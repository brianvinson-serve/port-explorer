// tests/ports-data.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const data = JSON.parse(
  readFileSync(new URL('../data/ports.json', import.meta.url), 'utf8')
);
const activities = data.activities;

const PORT_NAMES = ['Salerno', 'Messina', 'Kotor', 'Dubrovnik', 'Split'];
const TIERS = ['$', '$$', '$$$', '$$$$'];
const TIER_RANGES = {
  '$':    [1, 24],
  '$$':   [25, 74],
  '$$$':  [75, 149],
  '$$$$': [150, 5000]
};

test('ports.json has a top-level activities array', () => {
  assert.ok(Array.isArray(activities));
});

test('every activity matches the schema', () => {
  for (const a of activities) {
    assert.match(a.id, /^[a-z0-9]+(-[a-z0-9]+)*$/, `bad id: ${a.id}`);
    assert.ok(PORT_NAMES.includes(a.port), `${a.id}: bad port ${a.port}`);
    assert.ok(TIERS.includes(a.tier), `${a.id}: bad tier`);
    assert.ok(['walkable', 'transport'].includes(a.transport), `${a.id}: bad transport`);
    assert.equal(typeof a.estimatedCost, 'number', `${a.id}: cost not a number`);
    const [min, max] = TIER_RANGES[a.tier];
    assert.ok(a.estimatedCost >= min && a.estimatedCost <= max,
      `${a.id}: cost $${a.estimatedCost} outside tier ${a.tier} range`);
    assert.ok(typeof a.duration === 'string' && a.duration.length > 0, `${a.id}: missing duration`);
    assert.ok(typeof a.description === 'string' && a.description.length >= 30, `${a.id}: description too short`);
    assert.ok(typeof a.detail === 'string' && a.detail.length >= 100, `${a.id}: detail too short`);
    assert.equal(typeof a.bookingNote, 'string', `${a.id}: missing bookingNote`);
    assert.ok(Array.isArray(a.tags) && a.tags.length > 0, `${a.id}: missing tags`);
    assert.ok(a.viatorUrl === null || /^https:\/\//.test(a.viatorUrl), `${a.id}: bad viatorUrl`);
    assert.ok(a.id.startsWith(a.port.toLowerCase() + '-'), `${a.id}: id not prefixed with port`);
  }
});

test('activity ids are unique', () => {
  const ids = activities.map(a => a.id);
  assert.equal(new Set(ids).size, ids.length);
});

for (const port of PORT_NAMES) {
  test(`${port}: has 6-8 activities`, () => {
    const n = activities.filter(a => a.port === port).length;
    assert.ok(n >= 6 && n <= 8, `${port} has ${n} activities`);
  });

  test(`${port}: at least 2 walkable options`, () => {
    const n = activities.filter(a => a.port === port && a.transport === 'walkable').length;
    assert.ok(n >= 2, `${port} has ${n} walkable`);
  });

  test(`${port}: at least 1 transport-required option`, () => {
    const n = activities.filter(a => a.port === port && a.transport === 'transport').length;
    assert.ok(n >= 1, `${port} has ${n} transport`);
  });

  test(`${port}: covers all four cost tiers`, () => {
    const tiers = new Set(activities.filter(a => a.port === port).map(a => a.tier));
    for (const t of TIERS) assert.ok(tiers.has(t), `${port} missing tier ${t}`);
  });
}

test('at least one world-class beach club or spa across all ports', () => {
  assert.ok(
    activities.some(a => a.tags.includes('beach-club') || a.tags.includes('spa')),
    'no activity tagged beach-club or spa'
  );
});
