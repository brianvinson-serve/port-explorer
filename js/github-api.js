// js/github-api.js
const API_URL =
  'https://api.github.com/repos/brianvinson-serve/port-explorer/contents/data/selections.json';

export class ApiError extends Error {
  constructor(kind, status) {
    super(`GitHub API error: ${status} (${kind})`);
    this.kind = kind;     // 'auth' | 'rate-limit' | 'network'
    this.status = status;
  }
}

export function classifyError(status) {
  if (status === 401 || status === 403) return 'auth';
  if (status === 429) return 'rate-limit';
  return 'network';
}

function headers(token) {
  return {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json'
  };
}

export async function fetchSelections(token, fetchFn = fetch) {
  let res;
  try {
    res = await fetchFn(API_URL, { headers: headers(token) });
  } catch {
    throw new ApiError('network', 0);
  }
  if (!res.ok) throw new ApiError(classifyError(res.status), res.status);
  const body = await res.json();
  const decoded = JSON.parse(atob(body.content.replace(/\n/g, '')));
  return { selections: decoded.selections, sha: body.sha };
}

export async function saveSelections(token, selections, sha, fetchFn = fetch) {
  const content = btoa(JSON.stringify({ selections }, null, 2));
  let res;
  try {
    res = await fetchFn(API_URL, {
      method: 'PUT',
      headers: headers(token),
      body: JSON.stringify({
        message: 'update trip selections',
        content,
        sha
      })
    });
  } catch {
    throw new ApiError('network', 0);
  }
  if (!res.ok) throw new ApiError(classifyError(res.status), res.status);
  const body = await res.json();
  const newSha = body.content?.sha;
  if (newSha) return newSha;
  // GitHub can omit content in a PUT response; recover the sha with a follow-up read
  const refreshed = await fetchSelections(token, fetchFn);
  return refreshed.sha;
}
