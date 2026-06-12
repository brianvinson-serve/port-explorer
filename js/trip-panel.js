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
