// js/data.js
export const PORTS = [
  { name: 'Salerno', subtitle: 'Amalfi Coast' },
  { name: 'Messina', subtitle: 'Sicily' },
  { name: 'Kotor', subtitle: 'Montenegro' },
  { name: 'Dubrovnik', subtitle: 'Croatia' },
  { name: 'Split', subtitle: 'Croatia' }
];

let activities = [];

export async function loadPorts(fetchFn = fetch) {
  const res = await fetchFn('data/ports.json');
  if (!res.ok) throw new Error(`Failed to load ports.json: ${res.status}`);
  const data = await res.json();
  activities = data.activities;
  return activities;
}

export function getActivities() {
  return activities;
}

export function getActivityById(id) {
  return activities.find(a => a.id === id);
}

export function getActivitiesForPort(portName) {
  return activities.filter(a => a.port === portName);
}
