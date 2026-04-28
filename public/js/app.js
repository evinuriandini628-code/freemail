/**
 * MatMailer main app
 * Fokus: inbox email sementara, UI Indonesia, tanpa fitur kirim email.
 */

import { mockApi, MOCK_STATE } from './modules/app/mock-api.js';
import { showConfirm } from './modules/app/confirm-dialog.js';
import { startAutoRefresh, stopAutoRefresh, initVisibilityTracking } from './modules/app/auto-refresh.js';
import { getCurrentMailbox, loadCurrentMailbox, clearCurrentMailbox, setCurrentMailboxInfo, getCurrentMailboxInfo } from './modules/app/mailbox-state.js';
import { sliceByPage, prevPage, nextPage, resetPager, setView, isSentViewActive, renderEmailItem, markViewLoaded, isFirstLoad } from './modules/app/email-list.js';
import { renderMailboxList, renderMbPager, getCurrentPage, getPageSize, prevMbPage, nextMbPage, resetMbPage, setSearchTerm, getSearchTerm, setLoading, isLoadingMailboxes, setLastCount, getLastCount } from './modules/app/mailbox-list.js';
import { initSessionFromCache, validateSession, isAdmin, initGuestMode } from './modules/app/session.js';
import { loadDomains, getStoredLength, saveLength, updateRangeProgress, populateDomains } from './modules/app/domains.js';
import { showEmailDetail, deleteEmailById, copyFromEmailList, prefetchEmails } from './modules/app/email-viewer.js';
import { generateMailbox, generateNameMailbox, createCustomMailbox, updateEmailDisplay, selectMailboxAddress, toggleMailboxPin, deleteMailboxAddress, copyMailboxAddress, clearAllEmails } from './modules/app/mailbox-actions.js';
import { toggleFavorite, injectDialogStyles } from './mailbox-settings.js';
import IconHelper from './modules/icons.js';

window.__GUEST_MODE__ = false;
window.__MOCK_STATE__ = MOCK_STATE;

try { injectDialogStyles(); } catch (_) {}

async function api(path, options) {
  if (window.__GUEST_MODE__) return mockApi(path, options);
  const res = await fetch(path, options);
  if (res.status === 401) {
    if (location.pathname !== '/html/login.html') location.replace('/html/login.html');
    throw new Error('Sesi berakhir');
  }
  return res;
}

const app = document.getElementById('app');
if (!app) throw new Error('App root tidak ditemukan');

const templateResp = await fetch('/html/app.html', { cache: 'no-cache' }).catch(() => null);
if (!templateResp || !templateResp.ok) throw new Error('Template app tidak bisa dimuat');
app.innerHTML = await templateResp.text();

const $ = (id) => document.getElementById(id);
const els = {
  email: $('email'),
  gen: $('gen'),
  genName: $('gen-name'),
  copy: $('copy'),
  clear: $('clear'),
  list: $('list'),
  listCard: $('list-card'),
  tabInbox: $('tab-inbox'),
  tabSent: $('tab-sent'),
  boxTitle: $('box-title'),
  boxIcon: $('box-icon'),
  refresh: $('refresh'),
  logout: $('logout'),
  modal: $('email-modal'),
  modalClose: $('modal-close'),
  modalSubject: $('modal-subject'),
  modalContent: $('modal-content'),
  mbList: $('mb-list'),
  mbSearch: $('mb-search'),
  mbLoading: $('mb-loading'),
  toast: $('toast'),
  mbPager: $('mb-pager'),
  mbPrev: $('mb-prev'),
  mbNext: $('mb-next'),
  mbPageInfo: $('mb-page-info'),
  listLoading: $('list-status'),
  confirmModal: $('confirm-modal'),
  confirmClose: $('confirm-close'),
  confirmMessage: $('confirm-message'),
  confirmCancel: $('confirm-cancel'),
  confirmOk: $('confirm-ok'),
  emailActions: $('email-actions'),
  toggleCustom: $('toggle-custom'),
  customOverlay: $('custom-overlay'),
  customLocalOverlay: $('custom-local-overlay'),
  createCustomOverlay: $('create-custom-overlay'),
  pager: $('list-pager'),
  prevPage: $('prev-page'),
  nextPage: $('next-page'),
  pageInfo: $('page-info'),
  forwardSetting: $('forward-setting'),
  toggleFavorite: $('toggle-favorite'),
  favoriteIcon: $('favorite-icon'),
  favoriteText: $('favorite-text')
};

const lenRange = $('len-range');
const lenVal = $('len-val');
const domainSelect = $('domain-select');
const showToast = window.showToast || ((msg, type = 'info') => console.log(`[${type}] ${msg}`));

initSessionFromCache();

const REFRESH_INTERVAL = 15;
let countdown = REFRESH_INTERVAL;

function showHeaderLoading(text = 'Memuat...') {
  if (!els.listLoading) return;
  els.listLoading.innerHTML = `<span class="spinner"></span>${text}`;
  els.listLoading.style.display = 'flex';
}

function hideHeaderLoading() {
  if (els.listLoading) els.listLoading.style.display = 'none';
}

function showCountdown() {
  if (!els.listLoading) return;
  els.listLoading.innerHTML = `<span class="countdown-icon">↻</span>Refresh dalam ${countdown} detik`;
  els.listLoading.style.display = 'flex';
}

function renderEmptyInbox() {
  if (!els.list) return;
  els.list.innerHTML = `
    <div class="empty-state">
      <svg class="empty-icon" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <use href="/icons/sprites.svg#icon-inbox"/>
      </svg>
      <span class="empty-text">Belum ada email masuk</span>
    </div>`;
  if (els.pager) els.pager.style.display = 'none';
}

async function refresh() {
  const mailbox = getCurrentMailbox();
  if (!mailbox || !els.list) return;

  try {
    showHeaderLoading(isFirstLoad() ? 'Memuat email...' : 'Memperbarui inbox...');
    if (isFirstLoad()) els.list.innerHTML = '';

    const url = !isSentViewActive()
      ? `/api/emails?mailbox=${encodeURIComponent(mailbox)}`
      : `/api/sent?from=${encodeURIComponent(mailbox)}`;

    const ctrl = new AbortController();
    const timeout = setTimeout(() => ctrl.abort(), 8000);
    let emails = [];

    try {
      const r = await api(url, { signal: ctrl.signal });
      if (!r.ok) throw new Error(await r.text());
      emails = await r.json();
    } finally {
      clearTimeout(timeout);
    }

    if (!Array.isArray(emails) || !emails.length) {
      renderEmptyInbox();
      return;
    }

    const isMobile = window.matchMedia?.('(max-width: 900px)').matches;
    els.list.innerHTML = sliceByPage(emails, els).map((e) => renderEmailItem(e, isMobile)).join('');
    if (!isSentViewActive()) prefetchEmails(emails, api);
    markViewLoaded();
  } catch (error) {
    console.error('Gagal memuat email:', error);
    renderEmptyInbox();
  } finally {
    hideHeaderLoading();
    if (getCurrentMailbox()) {
      countdown = REFRESH_INTERVAL;
      showCountdown();
    }
  }
}

function autoRefreshCallback() {
  if (!getCurrentMailbox()) return;
  countdown -= 1;
  showCountdown();
  if (countdown <= 0) {
    refresh().finally(() => {
      countdown = REFRESH_INTERVAL;
      showCountdown();
    });
  }
}

async function loadMailboxes(opts = {}) {
  if (isLoadingMailboxes() && !opts.forceFresh) return;
  setLoading(true);
  if (els.mbLoading) els.mbLoading.style.display = 'flex';

  try {
    let url = `/api/mailboxes?page=${getCurrentPage()}&size=${getPageSize()}`;
    const search = getSearchTerm();
    if (search) url += `&q=${encodeURIComponent(search)}`;

    const r = await api(url);
    if (!r.ok) throw new Error(await r.text());
    const data = await r.json();
    const list = Array.isArray(data) ? data : (data.list || []);
    const total = data.total || list.length;

    setLastCount(total);
    renderMailboxList(list, els.mbList);
    renderMbPager(els, total);

    const quota = $('quota');
    if (quota) quota.textContent = String(total);
  } catch (error) {
    console.error('Gagal memuat mailbox:', error);
    if (els.mbList) els.mbList.innerHTML = '<div class="empty-state"><span class="empty-text">Belum ada mailbox</span></div>';
  } finally {
    setLoading(false);
    if (els.mbLoading) els.mbLoading.style.display = 'none';
  }
}

function updateMailboxInfoUI(info) {
  if (!info) return;
  if (els.favoriteIcon) els.favoriteIcon.innerHTML = IconHelper.star(18, 18, info.is_favorite);
  if (els.favoriteText) els.favoriteText.textContent = info.is_favorite ? 'Sudah Favorit' : 'Favorit';
}

window.selectMailbox = (addr) => selectMailboxAddress(addr, els, api, refresh, autoRefreshCallback, updateMailboxInfoUI);
window.togglePin = (e, addr) => toggleMailboxPin(e, addr, api, showToast, loadMailboxes);
window.deleteMailbox = (e, addr) => deleteMailboxAddress(e, addr, els, api, showToast, showConfirm, loadMailboxes);
window.showEmail = (id) => showEmailDetail(id, els, api, showToast);
window.deleteEmail = (id) => deleteEmailById(id, api, showToast, showConfirm, refresh);
window.copyFromList = (e, id) => copyFromEmailList(e, id, api, showToast);
window.refreshEmails = refresh;

if (els.gen) els.gen.onclick = () => generateMailbox(els, lenRange, domainSelect, api, showToast, refresh, loadMailboxes, autoRefreshCallback, updateMailboxInfoUI);
if (els.genName) els.genName.onclick = () => generateNameMailbox(els, lenRange, domainSelect, api, showToast, refresh, loadMailboxes, autoRefreshCallback, updateMailboxInfoUI);
if (els.copy) els.copy.onclick = () => copyMailboxAddress(showToast);
if (els.clear) els.clear.onclick = () => clearAllEmails(api, showToast, showConfirm, refresh);
if (els.refresh) els.refresh.onclick = refresh;
if (els.logout) els.logout.addEventListener('click', async () => {
  try { await fetch('/api/logout', { method: 'POST' }); } catch (_) {}
  location.replace('/html/login.html');
});

if (els.modalClose) els.modalClose.onclick = () => els.modal?.classList.remove('show');
els.modal?.addEventListener('click', (e) => { if (e.target === els.modal) els.modal.classList.remove('show'); });

if (els.tabInbox) els.tabInbox.onclick = () => {
  setView(false);
  els.tabInbox.classList.add('active');
  els.tabSent?.classList.remove('active');
  if (els.boxTitle) els.boxTitle.textContent = 'Kotak Masuk';
  resetPager(els);
  refresh();
};

if (els.tabSent) els.tabSent.onclick = () => {
  setView(true);
  els.tabSent.classList.add('active');
  els.tabInbox?.classList.remove('active');
  if (els.boxTitle) els.boxTitle.textContent = 'Terkirim';
  resetPager(els);
  refresh();
};

if (els.prevPage) els.prevPage.onclick = () => prevPage(refresh);
if (els.nextPage) els.nextPage.onclick = () => nextPage(refresh);
if (els.mbPrev) els.mbPrev.onclick = () => prevMbPage(loadMailboxes);
if (els.mbNext) els.mbNext.onclick = () => nextMbPage(loadMailboxes, getLastCount());

if (els.mbSearch) {
  let timer = null;
  els.mbSearch.oninput = () => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      setSearchTerm(els.mbSearch.value);
      resetMbPage();
      loadMailboxes();
    }, 300);
  };
}

if (lenRange && lenVal) {
  const storedLength = getStoredLength();
  lenRange.value = String(storedLength);
  lenVal.textContent = String(storedLength);
  updateRangeProgress(lenRange);
  lenRange.oninput = () => {
    lenVal.textContent = lenRange.value;
    saveLength(Number(lenRange.value));
    updateRangeProgress(lenRange);
  };
}

if (els.toggleCustom) {
  els.toggleCustom.onclick = () => {
    if (!els.customOverlay) return;
    const visible = els.customOverlay.style.display !== 'none';
    els.customOverlay.style.display = visible ? 'none' : 'flex';
    if (!visible) setTimeout(() => els.customLocalOverlay?.focus(), 50);
  };
}

if (els.createCustomOverlay) els.createCustomOverlay.onclick = () => createCustomMailbox(els, domainSelect, api, showToast, loadMailboxes);

if (els.forwardSetting) els.forwardSetting.onclick = () => showToast('Fitur forwarding belum diaktifkan.', 'info');

if (els.toggleFavorite) {
  els.toggleFavorite.onclick = async () => {
    const info = getCurrentMailboxInfo();
    if (!info?.id) {
      showToast('Pilih mailbox dulu.', 'warn');
      return;
    }

    try {
      const result = await toggleFavorite(info.id);
      if (result.success) {
        const newInfo = { ...info, is_favorite: result.is_favorite };
        setCurrentMailboxInfo(newInfo);
        updateMailboxInfoUI(newInfo);
      }
    } catch (error) {
      showToast('Gagal mengubah favorit.', 'error');
    }
  };
}

(async () => {
  const session = await validateSession();
  if (!session) {
    clearCurrentMailbox();
    stopAutoRefresh();
    location.replace('/html/login.html');
    return;
  }

  if (session.role === 'guest') {
    initGuestMode();
    if (domainSelect) {
      domainSelect.innerHTML = '<option value="0">example.com</option>';
      domainSelect.disabled = true;
    }
    populateDomains(['example.com'], domainSelect);
  } else {
    await loadDomains(domainSelect, api);
  }

  try {
    const qr = await api('/api/user/quota');
    const quota = await qr.json();
    const el = $('quota');
    if (el && quota) el.textContent = isAdmin() ? String(quota.total || 0) : `${quota.used || 0} / ${quota.limit || 0}`;
  } catch (_) {}

  await loadMailboxes();

  const urlParams = new URLSearchParams(window.location.search);
  const urlMailbox = urlParams.get('mailbox');
  if (urlMailbox) {
    await window.selectMailbox(urlMailbox);
    window.history.replaceState({}, '', window.location.pathname);
  } else {
    const last = loadCurrentMailbox();
    if (last) await window.selectMailbox(last);
  }

  initVisibilityTracking();
})();
