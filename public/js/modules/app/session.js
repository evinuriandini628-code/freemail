/**
 * Session module (translated UI)
 */

import { cacheGet, cacheSet, setCurrentUserKey } from '../../storage.js';

let sessionData = null;
let isGuestMode = false;

export function getSession() { return sessionData; }

export function setSession(data) {
  sessionData = data;
  if (data) {
    isGuestMode = data.role === 'guest';
    window.__GUEST_MODE__ = isGuestMode;
  }
}

export function isGuest() { return isGuestMode; }
export function isAdmin() { return sessionData?.strictAdmin || sessionData?.role === 'admin'; }
export function isStrictAdmin() { return sessionData?.strictAdmin === true; }

export function applySessionUI(session) {
  try {
    const badge = document.getElementById('role-badge');
    if (badge) {
      badge.className = 'role-badge';
      if (session.strictAdmin) {
        badge.classList.add('role-super');
        badge.textContent = 'Super Admin';
      } else if (session.role === 'admin') {
        badge.classList.add('role-admin');
        badge.textContent = `Admin: ${session.username || ''}`;
      } else if (session.role === 'user') {
        badge.classList.add('role-user');
        badge.textContent = `User: ${session.username || ''}`;
      } else if (session.role === 'guest') {
        badge.classList.add('role-user');
        badge.textContent = 'Mode Demo';
      }
    }

    const adminLink = document.getElementById('admin');
    const allMailboxesLink = document.getElementById('all-mailboxes');

    if (session && (session.strictAdmin || session.role === 'guest')) {
      if (adminLink) adminLink.style.display = 'inline-flex';
      if (allMailboxesLink) allMailboxesLink.style.display = 'inline-flex';
    } else {
      if (adminLink) adminLink.style.display = 'none';
      if (allMailboxesLink) allMailboxesLink.style.display = 'none';
    }
  } catch(_) {}
}

export function initSessionFromCache() {
  try {
    const cachedS = cacheGet('session', 24 * 60 * 60 * 1000);
    if (cachedS) {
      setCurrentUserKey(`${cachedS.role || ''}:${cachedS.username || ''}`);
      applySessionUI(cachedS);
      setSession(cachedS);
    }
  } catch(_) {}
}

export async function validateSession() {
  try {
    const r = await fetch('/api/session');
    if (!r.ok) return null;
    const s = await r.json();
    cacheSet('session', s);
    setCurrentUserKey(`${s.role || ''}:${s.username || ''}`);
    setSession(s);
    applySessionUI(s);
    return s;
  } catch(_) {
    return null;
  }
}

export function showGuestBanner() {
  const bar = document.createElement('div');
  bar.className = 'demo-banner';
  bar.innerHTML = 'Mode demo aktif (data simulasi).';
  document.body.prepend(bar);
}

export function initGuestMode() {
  window.__GUEST_MODE__ = true;
  window.__MOCK_STATE__ = { domains: ['example.com'], mailboxes: [], emailsByMailbox: new Map() };
  showGuestBanner();
}

export default {
  getSession,
  setSession,
  isGuest,
  isAdmin,
  isStrictAdmin,
  applySessionUI,
  initSessionFromCache,
  validateSession,
  showGuestBanner,
  initGuestMode
};
