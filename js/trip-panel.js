// js/trip-panel.js
import { PORTS } from './data.js';

export function groupByPort(selectedIds, activities) {
  const selected = selectedIds
    .map(id => activities.find(a => a.id === id))
    .filter(Boolean);
  return PORTS
    .map(p => ({
      port: p.name,
      subtitle: p.subtitle,
      items: selected.filter(a => a.port === p.name)
    }))
    .filter(g => g.items.length > 0);
}

export function computeTotal(selectedIds, activities) {
  return selectedIds.reduce((sum, id) => {
    const a = activities.find(x => x.id === id);
    return a ? sum + a.estimatedCost : sum;
  }, 0);
}

export function formatItinerary(selectedIds, activities, date = new Date()) {
  const groups = groupByPort(selectedIds, activities);
  const lines = [
    'PORT-EXPLORER: Your Trip Summary',
    `Generated: ${date.toISOString().slice(0, 10)}`,
    ''
  ];
  for (const g of groups) {
    lines.push(`${g.port.toUpperCase()} (${g.subtitle})`);
    for (const a of g.items) {
      const transport = a.transport === 'walkable' ? 'walkable' : 'transport required';
      lines.push(`  - ${a.name} (~$${a.estimatedCost}, ${transport}, ${a.duration})`);
    }
    lines.push('');
  }
  lines.push(`ESTIMATED TOTAL: ~$${computeTotal(selectedIds, activities)}`);
  return lines.join('\n');
}

// --- DOM rendering (browser only, not unit tested) ---

export function renderTripPanel(container, selectedIds, activities, { onRemove, onExport }) {
  const groups = groupByPort(selectedIds, activities);
  const total = computeTotal(selectedIds, activities);
  const hasItems = selectedIds.length > 0;

  let body;
  if (!hasItems) {
    body = `<p class="trip-empty">Add activities to build your trip.</p>`;
  } else {
    body = groups.map(g => `
      <div class="trip-group">
        <span class="port-stamp">${g.port} &middot; ${g.subtitle}</span>
        ${g.items.map(a => `
          <div class="trip-item" data-id="${a.id}">
            <span class="name">${a.name}</span>
            <span class="cost">~$${a.estimatedCost}</span>
            <button class="remove-btn" aria-label="Remove ${a.name}">&times;</button>
          </div>`).join('')}
      </div>`).join('');
  }

  container.innerHTML = `
    <h2>Your Trip</h2>
    ${body}
    <div class="trip-total">
      <span>Estimated total (pp)</span>
      <span class="cost">~$${total}</span>
    </div>
    <button class="export-btn" ${hasItems ? '' : 'disabled title="Add activities to your trip first"'}>
      Export Itinerary
    </button>`;

  container.querySelectorAll('.remove-btn').forEach(btn =>
    btn.addEventListener('click', () =>
      onRemove(btn.closest('.trip-item').dataset.id))
  );
  container.querySelector('.export-btn').addEventListener('click', () => {
    if (hasItems) onExport();
  });
}
