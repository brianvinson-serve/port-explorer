// js/app.js
import { loadPorts, getActivities, getActivitiesForPort, PORTS } from './data.js';
import {
  createFilterState, toggleTransport, toggleTier, clearFilters,
  applyFilters, renderCards
} from './filters.js';
import { renderTripPanel, formatItinerary } from './trip-panel.js';

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
  state.selections.push(id);
  renderGrid();
  renderPanel();
}

function removeActivity(id) {
  state.selections = state.selections.filter(s => s !== id);
  renderGrid();
  renderPanel();
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
  await loadPorts();
  renderTabs();
  renderFilterStrip();
  renderGrid();
  renderPanel();
}

init();
