// js/services/butterfly-notification.service.js — replaces Angular ButterflyNotificationService
// Event bus using EventTarget

const bus = new EventTarget();
let newTeamId = null;

export function triggerButterfly() {
  bus.dispatchEvent(new Event('trigger'));
}

export function onTrigger(fn) {
  bus.addEventListener('trigger', fn);
  return () => bus.removeEventListener('trigger', fn);
}

export function setNewTeamId(teamId) {
  newTeamId = teamId;
  bus.dispatchEvent(new CustomEvent('newTeamId', { detail: teamId }));
}

export function onNewTeamId(fn) {
  const handler = (e) => fn(e.detail);
  bus.addEventListener('newTeamId', handler);
  return () => bus.removeEventListener('newTeamId', handler);
}

export function clearNewTeamId() {
  newTeamId = null;
  bus.dispatchEvent(new CustomEvent('newTeamId', { detail: null }));
}

export function getNewTeamId() {
  return newTeamId;
}
