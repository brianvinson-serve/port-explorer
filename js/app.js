// js/app.js
import { loadPorts, getActivitiesForPort, PORTS } from './data.js';
import {
  createFilterState, toggleTransport, toggleTier, clearFilters,
  applyFilters, renderCards
} from './filters.js';

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

function addActivity(id) {
  // persistence lands in Task 18; local-only for now
  if (!state.selections.includes(id)) state.selections.push(id);
  renderGrid();
}

async function init() {
  await loadPorts();
  renderTabs();
  renderFilterStrip();
  renderGrid();
}

init();
