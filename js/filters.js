// js/filters.js
export function createFilterState() {
  return { transport: null, tiers: new Set() };
}

export function toggleTransport(state, value) {
  state.transport = state.transport === value ? null : value;
}

export function toggleTier(state, tier) {
  if (state.tiers.has(tier)) state.tiers.delete(tier);
  else state.tiers.add(tier);
}

export function clearFilters(state) {
  state.transport = null;
  state.tiers.clear();
}

export function applyFilters(activities, state) {
  return activities.filter(a => {
    if (state.transport && a.transport !== state.transport) return false;
    if (state.tiers.size > 0 && !state.tiers.has(a.tier)) return false;
    return true;
  });
}

// --- DOM rendering (browser only, not unit tested) ---

function bookingHtml(a) {
  if (a.viatorUrl) {
    return `<a href="${a.viatorUrl}" target="_blank" rel="noopener">Book on Viator</a>`;
  }
  return `<span class="badge direct">Book Direct</span> ${a.bookingNote}`;
}

function cardHtml(a, isSelected) {
  const transportLabel = a.transport === 'walkable' ? 'Walkable' : 'Requires Transport';
  return `
    <button class="close-x" aria-label="Close">&times;</button>
    <div class="card-badges">
      <span class="badge tier">${a.tier}</span>
      <span class="badge transport">${transportLabel}</span>
    </div>
    <h3>${a.name}</h3>
    <p class="desc">${a.description}</p>
    <div class="detail">
      <p>${a.detail}</p>
      <p class="booking">${bookingHtml(a)}</p>
      <p class="duration">Duration: ${a.duration}</p>
      <div class="tags">${a.tags.map(t => `<span class="chip">${t}</span>`).join('')}</div>
    </div>
    <div class="card-footer">
      <span class="cost">~$${a.estimatedCost} pp</span>
      <button class="add-btn" ${isSelected ? 'disabled' : ''}>${isSelected ? 'Added' : 'Add to Trip'}</button>
    </div>`;
}

export function renderCards(container, activities, selectedIds, { onAdd }) {
  container.innerHTML = '';
  activities.forEach((a, i) => {
    const card = document.createElement('article');
    card.className = 'card';
    card.style.setProperty('--i', i);
    card.dataset.id = a.id;
    card.innerHTML = cardHtml(a, selectedIds.includes(a.id));
    card.querySelector('.add-btn').addEventListener('click', e => {
      e.stopPropagation();
      onAdd(a.id);
    });
    card.querySelector('.close-x').addEventListener('click', e => {
      e.stopPropagation();
      collapseCard(card);
    });
    card.addEventListener('click', e => {
      if (e.target.closest('a')) return; // let booking links work
      if (!card.classList.contains('expanded')) expandCard(container, card);
    });
    container.appendChild(card);
  });
}

function expandCard(container, card) {
  container.querySelectorAll('.card.expanded')
    .forEach(c => c.classList.remove('expanded'));
  card.classList.add('expanded');
  // if the unfolded card overflows the viewport, bring it into view
  requestAnimationFrame(() => {
    card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  });
}

function collapseCard(card) {
  card.classList.remove('expanded');
}

// click outside an expanded card dismisses it (single module-level listener)
if (typeof document !== 'undefined') {
  document.addEventListener('click', e => {
    const expanded = document.querySelector('.card.expanded');
    if (expanded && !expanded.contains(e.target)) collapseCard(expanded);
  });
}
