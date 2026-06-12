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
