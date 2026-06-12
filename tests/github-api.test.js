// tests/github-api.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ApiError, classifyError, fetchSelections, saveSelections } from '../js/github-api.js';

function jsonResponse(status, body) {
  return { ok: status >= 200 && status < 300, status, json: async () => body };
}

test('classifyError maps statuses per spec', () => {
  assert.equal(classifyError(401), 'auth');
  assert.equal(classifyError(403), 'auth');
  assert.equal(classifyError(429), 'rate-limit');
  assert.equal(classifyError(500), 'network');
  assert.equal(classifyError(409), 'network');
});

test('fetchSelections decodes base64 content and returns sha', async () => {
  const content = btoa(JSON.stringify({ selections: ['kotor-walls'] }));
  // GitHub wraps base64 with newlines; simulate that
  const wrapped = content.slice(0, 10) + '\n' + content.slice(10);
  const fetchFn = async (url, opts) => {
    assert.ok(url.includes('/repos/brianvinson-serve/port-explorer/contents/data/selections.json'));
    assert.equal(opts.headers.Authorization, 'Bearer tok123');
    return jsonResponse(200, { content: wrapped, sha: 'abc123' });
  };
  const result = await fetchSelections('tok123', fetchFn);
  assert.deepEqual(result.selections, ['kotor-walls']);
  assert.equal(result.sha, 'abc123');
});

test('fetchSelections throws ApiError with kind auth on 401', async () => {
  const fetchFn = async () => jsonResponse(401, {});
  await assert.rejects(() => fetchSelections('bad', fetchFn), err => {
    assert.ok(err instanceof ApiError);
    assert.equal(err.kind, 'auth');
    return true;
  });
});

test('saveSelections PUTs base64 content with sha, returns new sha', async () => {
  let captured;
  const fetchFn = async (url, opts) => {
    captured = { url, opts };
    return jsonResponse(200, { content: { sha: 'newsha' } });
  };
  const sha = await saveSelections('tok123', ['split-krka'], 'oldsha', fetchFn);
  assert.equal(sha, 'newsha');
  assert.equal(captured.opts.method, 'PUT');
  const body = JSON.parse(captured.opts.body);
  assert.equal(body.sha, 'oldsha');
  assert.deepEqual(JSON.parse(atob(body.content)), { selections: ['split-krka'] });
});

test('saveSelections recovers sha with a follow-up read when PUT omits content', async () => {
  let calls = 0;
  const content = btoa(JSON.stringify({ selections: [] }));
  const fetchFn = async (url, opts) => {
    calls++;
    if (opts && opts.method === 'PUT') return jsonResponse(200, { content: null });
    return jsonResponse(200, { content, sha: 'recovered' });
  };
  const sha = await saveSelections('tok', [], 'oldsha', fetchFn);
  assert.equal(sha, 'recovered');
  assert.equal(calls, 2);
});

test('saveSelections throws ApiError with kind rate-limit on 429', async () => {
  const fetchFn = async () => jsonResponse(429, {});
  await assert.rejects(() => saveSelections('tok', [], 'sha', fetchFn), err => {
    assert.equal(err.kind, 'rate-limit');
    return true;
  });
});
