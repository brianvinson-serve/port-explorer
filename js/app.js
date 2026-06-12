// js/app.js
import { loadPorts, getActivities, getActivitiesForPort, PORTS } from './data.js';
import {
  createFilterState, toggleTransport, toggleTier, clearFilters,
  applyFilters, renderCards
} from './filters.js';
import { renderTripPanel, formatItinerary } from './trip-panel.js';
import { fetchSelections, saveSelections, ApiError } from './github-api.js';

const TIERS = ['$', '$$', '$$$', '$$$$'];

const state = {
  activePort: 'Salerno',
  filters: createFilterState(),
  selections: [],
  sha: null,
  token: localStorage.getItem('port-explorer-pat')
};

function renderFilterStrip() {
  const el = document.getElementById('filter-strip');
  el.innerHTML = `
    <button class="filter-btn ${state.filters.transport === 'walkable' ? 'active' : ''}" data-transport="walkable">Walkable</button>
    <button class="filter-btn ${state.filters.transport === 'transport' ? 'active' : ''}" data-transport="transport">Requires Transport</button>
    <span class="divider"></span>
    ${TIERS.map(t => `<button class="filter-btn ${state.filters.tiers.has(t) ? 'active' : ''}" data-tier="${t}">${t}</button>`).join('')}`;
  el.querySelectorAll('[data-transport]').forEach(btn =>
    btn.addEventListener('click', () => {
      toggleTransport(state.filters, btn.dataset.transport);
      renderFilterStrip();
      renderGrid();
    })
  );
  el.querySelectorAll('[data-tier]').forEach(btn =>
    btn.addEventListener('click', () => {
      toggleTier(state.filters, btn.dataset.tier);
      renderFilterStrip();
      renderGrid();
    })
  );
}

function renderGrid() {
  const grid = document.getElementById('card-grid');
  const visible = applyFilters(getActivitiesForPort(state.activePort), state.filters);
  if (visible.length === 0) {
    grid.innerHTML = `<div class="grid-empty">No activities match these filters.
      <a id="clear-filters">Clear filters</a></div>`;
    document.getElementById('clear-filters').addEventListener('click', () => {
      clearFilters(state.filters);
      renderFilterStrip();
      renderGrid();
    });
    return;
  }
  renderCards(grid, visible, state.selections, { onAdd: addActivity });
}

function renderTabs() {
  const el = document.getElementById('port-tabs');
  el.innerHTML = PORTS.map(p => `
    <button class="port-tab ${p.name === state.activePort ? 'active' : ''}" data-port="${p.name}">
      ${p.name}
      <span class="subtitle">${p.subtitle}</span>
    </button>`).join('');
  el.querySelectorAll('.port-tab').forEach(btn =>
    btn.addEventListener('click', () => switchPort(btn.dataset.port))
  );
}

function switchPort(port) {
  if (port === state.activePort) return;
  state.activePort = port;
  renderTabs();
  const grid = document.getElementById('card-grid');
  grid.classList.add('exiting');
  setTimeout(() => {
    grid.classList.remove('exiting');
    renderGrid();
    grid.classList.add('entering');
    setTimeout(() => grid.classList.remove('entering'), 320);
  }, 180);
}

function renderPanel() {
  renderTripPanel(
    document.getElementById('trip-panel'),
    state.selections,
    getActivities(),
    { onRemove: removeActivity, onExport: openExportModal }
  );
}

function addActivity(id) {
  if (state.selections.includes(id)) return;
  const previous = [...state.selections];
  state.selections = [...state.selections, id];
  renderGrid();
  renderPanel();
  persist(previous);
}

function removeActivity(id) {
  const previous = [...state.selections];
  state.selections = state.selections.filter(s => s !== id);
  renderGrid();
  renderPanel();
  persist(previous);
}

function showToast(message, onClick) {
  const root = document.getElementById('toast-root');
  const el = document.createElement('div');
  el.className = 'toast';
  el.textContent = message;
  if (onClick) {
    el.addEventListener('click', () => {
      el.remove();
      onClick();
    });
  }
  root.appendChild(el);
  setTimeout(() => el.remove(), 6000);
}

function showPatModal() {
  return new Promise(resolve => {
    const root = document.getElementById('modal-root');
    root.innerHTML = `
      <div class="overlay">
        <div class="modal pat-modal">
          <div class="wordmark">port-explorer</div>
          <p>Your GitHub token lets us save your trip selections.</p>
          <label for="pat-input">GitHub personal access token</label>
          <input id="pat-input" type="password" autocomplete="off" spellcheck="false">
          <button id="pat-save" class="export-btn">Save and Continue</button>
        </div>
      </div>`;
    const input = root.querySelector('#pat-input');
    const save = () => {
      const value = input.value.trim();
      if (!value) return;
      localStorage.setItem('port-explorer-pat', value);
      state.token = value;
      root.innerHTML = '';
      resolve(value);
    };
    root.querySelector('#pat-save').addEventListener('click', save);
    input.addEventListener('keydown', e => { if (e.key === 'Enter') save(); });
    input.focus();
  });
}

function reprompt() {
  showToast('GitHub token invalid or expired. Tap here to re-enter.', async () => {
    await showPatModal();
  });
}

async function persist(previousSelections) {
  try {
    if (!state.sha) {
      // initial load failed earlier; recover the file sha before writing
      const remote = await fetchSelections(state.token);
      state.sha = remote.sha;
    }
    state.sha = await saveSelections(state.token, state.selections, state.sha);
  } catch (err) {
    // roll back symmetrically: failed add re-removes, failed remove re-adds
    state.selections = previousSelections;
    renderGrid();
    renderPanel();
    if (err instanceof ApiError && err.kind === 'auth') {
      reprompt();
    } else if (err instanceof ApiError && err.kind === 'rate-limit') {
      showToast('Could not save. GitHub rate limit hit. Try again in a moment.');
    } else {
      showToast('Could not save. Check your connection and try again.');
    }
  }
}

function openExportModal() {
  const text = formatItinerary(state.selections, getActivities());
  const root = document.getElementById('modal-root');
  root.innerHTML = `
    <div class="overlay">
      <div class="modal export-modal">
        <button class="close-x" aria-label="Close">&times;</button>
        <h2>Your Trip Summary</h2>
        <textarea readonly rows="16"></textarea>
        <button id="copy-btn" class="export-btn">Copy to Clipboard</button>
      </div>
    </div>`;
  const ta = root.querySelector('textarea');
  ta.value = text;
  root.querySelector('.close-x').addEventListener('click', () => { root.innerHTML = ''; });
  root.querySelector('#copy-btn').addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(text);
      showToast('Itinerary copied.');
    } catch {
      ta.focus();
      ta.select();
      showToast('Press Cmd+C to copy.');
    }
  });
}

async function init() {
  if (!state.token) await showPatModal();
  await loadPorts();
  try {
    const remote = await fetchSelections(state.token);
    state.selections = remote.selections;
    state.sha = remote.sha;
  } catch (err) {
    if (err instanceof ApiError && err.kind === 'auth') {
      await showPatModal();
      try {
        const remote = await fetchSelections(state.token);
        state.selections = remote.selections;
        state.sha = remote.sha;
      } catch {
        showToast('Could not load saved selections. Starting empty.');
      }
    } else {
      showToast('Could not load saved selections. Starting empty.');
    }
  }
  renderTabs();
  renderFilterStrip();
  renderGrid();
  renderPanel();
}

init();
