// tests/filters.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createFilterState, toggleTransport, toggleTier, clearFilters, applyFilters } from '../js/filters.js';

const ACTS = [
  { id: 'a', transport: 'walkable', tier: '$' },
  { id: 'b', transport: 'walkable', tier: '$$' },
  { id: 'c', transport: 'transport', tier: '$$' },
  { id: 'd', transport: 'transport', tier: '$$$$' }
];

test('no filters returns everything', () => {
  const s = createFilterState();
  assert.equal(applyFilters(ACTS, s).length, 4);
});

test('transport filter narrows to matching transport', () => {
  const s = createFilterState();
  toggleTransport(s, 'walkable');
  assert.deepEqual(applyFilters(ACTS, s).map(a => a.id), ['a', 'b']);
});

test('toggling the same transport value off restores everything', () => {
  const s = createFilterState();
  toggleTransport(s, 'walkable');
  toggleTransport(s, 'walkable');
  assert.equal(applyFilters(ACTS, s).length, 4);
});

test('selecting the other transport value switches, not stacks', () => {
  const s = createFilterState();
  toggleTransport(s, 'walkable');
  toggleTransport(s, 'transport');
  assert.deepEqual(applyFilters(ACTS, s).map(a => a.id), ['c', 'd']);
});

test('tier filters OR together within tiers', () => {
  const s = createFilterState();
  toggleTier(s, '$');
  toggleTier(s, '$$$$');
  assert.deepEqual(applyFilters(ACTS, s).map(a => a.id), ['a', 'd']);
});

test('transport AND tier combine (spec: walkable AND $$)', () => {
  const s = createFilterState();
  toggleTransport(s, 'walkable');
  toggleTier(s, '$$');
  assert.deepEqual(applyFilters(ACTS, s).map(a => a.id), ['b']);
});

test('clearFilters resets to everything', () => {
  const s = createFilterState();
  toggleTransport(s, 'transport');
  toggleTier(s, '$$');
  clearFilters(s);
  assert.equal(applyFilters(ACTS, s).length, 4);
});
