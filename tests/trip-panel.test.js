// tests/trip-panel.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { groupByPort, computeTotal, formatItinerary } from '../js/trip-panel.js';

const ACTS = [
  { id: 'salerno-walk', port: 'Salerno', name: 'Old Town Walk', estimatedCost: 5, transport: 'walkable', duration: '2-3 hrs' },
  { id: 'salerno-drive', port: 'Salerno', name: 'Amalfi Drive', estimatedCost: 220, transport: 'transport', duration: 'full day' },
  { id: 'dubrovnik-walls', port: 'Dubrovnik', name: 'City Walls', estimatedCost: 40, transport: 'walkable', duration: '1-2 hrs' }
];

test('groupByPort groups in itinerary order, omits empty ports', () => {
  const groups = groupByPort(['dubrovnik-walls', 'salerno-walk'], ACTS);
  assert.deepEqual(groups.map(g => g.port), ['Salerno', 'Dubrovnik']);
  assert.equal(groups[0].subtitle, 'Amalfi Coast');
  assert.deepEqual(groups[0].items.map(i => i.id), ['salerno-walk']);
});

test('computeTotal sums estimated costs, skips unknown ids', () => {
  assert.equal(computeTotal(['salerno-walk', 'dubrovnik-walls', 'ghost'], ACTS), 45);
});

test('computeTotal of nothing is 0', () => {
  assert.equal(computeTotal([], ACTS), 0);
});

test('formatItinerary matches the spec format', () => {
  const text = formatItinerary(
    ['salerno-walk', 'salerno-drive', 'dubrovnik-walls'],
    ACTS,
    new Date('2026-06-11T12:00:00Z')
  );
  const lines = text.split('\n');
  assert.equal(lines[0], 'PORT-EXPLORER: Your Trip Summary');
  assert.equal(lines[1], 'Generated: 2026-06-11');
  assert.ok(text.includes('SALERNO (Amalfi Coast)'));
  assert.ok(text.includes('  - Old Town Walk (~$5, walkable, 2-3 hrs)'));
  assert.ok(text.includes('  - Amalfi Drive (~$220, transport required, full day)'));
  assert.ok(text.includes('DUBROVNIK (Croatia)'));
  assert.ok(text.endsWith('ESTIMATED TOTAL: ~$265'));
});
