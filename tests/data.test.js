// tests/data.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PORTS, loadPorts, getActivities, getActivityById, getActivitiesForPort } from '../js/data.js';

const FIXTURE = {
  activities: [
    { id: 'salerno-a', port: 'Salerno', name: 'A', tier: '$', transport: 'walkable', estimatedCost: 10 },
    { id: 'split-b', port: 'Split', name: 'B', tier: '$$', transport: 'transport', estimatedCost: 40 }
  ]
};

function mockFetch(status, body) {
  return async () => ({ ok: status === 200, status, json: async () => body });
}

test('PORTS lists the five ports in itinerary order with subtitles', () => {
  assert.deepEqual(PORTS.map(p => p.name), ['Salerno', 'Messina', 'Kotor', 'Dubrovnik', 'Split']);
  assert.equal(PORTS[0].subtitle, 'Amalfi Coast');
  assert.equal(PORTS[2].subtitle, 'Montenegro');
});

test('loadPorts fetches and stores activities', async () => {
  const result = await loadPorts(mockFetch(200, FIXTURE));
  assert.equal(result.length, 2);
  assert.equal(getActivities().length, 2);
});

test('loadPorts throws on non-200', async () => {
  await assert.rejects(() => loadPorts(mockFetch(404, {})), /404/);
});

test('getActivityById finds by id, returns undefined for unknown', async () => {
  await loadPorts(mockFetch(200, FIXTURE));
  assert.equal(getActivityById('split-b').name, 'B');
  assert.equal(getActivityById('nope'), undefined);
});

test('getActivitiesForPort filters by port name', async () => {
  await loadPorts(mockFetch(200, FIXTURE));
  assert.deepEqual(getActivitiesForPort('Salerno').map(a => a.id), ['salerno-a']);
});
