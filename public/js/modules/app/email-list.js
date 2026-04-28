/** Email list module - Indonesian UI with original exports restored */

import { formatTs, formatTsMobile, extractCode, escapeHtml } from './ui-helpers.js';
import { getCurrentMailbox } from './mailbox-state.js';

const PAGE_SIZE = 8;
let currentPage = 1;
let lastLoadedEmails = [];
let isSentView = false;
const emailCache = new Map();
const viewLoaded = new Set();

function getViewKey() {
  return `${getCurrentMailbox()}:${isSentView ? 'sent' : 'inbox'}`;
}

export function renderPager(elements) {
  try {
    const total = Array.isArray(lastLoadedEmails) ? lastLoadedEmails.length : 0;
    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
    if (!elements.pager) return;
    elements.pager.style.display = total > PAGE_SIZE ? 'flex' : 'none';
    if (elements.pageInfo) elements.pageInfo.textContent = `${currentPage} / ${totalPages}`;
    if (elements.prevPage) elements.prevPage.disabled = currentPage <= 1;
    if (elements.nextPage) elements.nextPage.disabled = currentPage >= totalPages;
  } catch(_) {}
}

export function sliceByPage(items, elements) {
  lastLoadedEmails = Array.isArray(items) ? items : [];
  const total = lastLoadedEmails.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  if (currentPage > totalPages) currentPage = totalPages;
  const start = (currentPage - 1) * PAGE_SIZE;
  renderPager(elements);
  return lastLoadedEmails.slice(start, start + PAGE_SIZE);
}

export function prevPage(refresh) {
  if (currentPage > 1) {
    currentPage -= 1;
    refresh();
  }
}

export function nextPage(refresh) {
  const totalPages = Math.max(1, Math.ceil(lastLoadedEmails.length / PAGE_SIZE));
  if (currentPage < totalPages) {
    currentPage += 1;
    refresh();
  }
}

export function resetPager(elements) {
  currentPage = 1;
  lastLoadedEmails = [];
  renderPager(elements);
}

export function setView(sent) {
  isSentView = !!sent;
}

export function isSentViewActive() {
  return isSentView;
}

export function statusClass(status) {
  const map = {
    queued: 'status-queued',
    delivered: 'status-delivered',
    failed: 'status-failed',
    processing: 'status-processing'
  };
  return map[status] || '';
}

export function renderEmailItem(email, isMobile = false) {
  const e = email || {};
  const rawContent = isSentView ? (e.text_content || e.html_content || '') : (e.preview || e.content || e.html_content || '');
  let preview = rawContent ? rawContent.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim() : '';
  const code = (e.verification_code || '').toString().trim() || extractCode(rawContent || '');
  if (code) preview = `Kode: ${code} | ${preview}`;
  preview = preview.slice(0, 90);

  const subjectText = escapeHtml(e.subject || '(Tanpa subjek)');
  const previewText = escapeHtml(preview || 'Tidak ada pratinjau');
  const senderText = escapeHtml(e.sender || '-');
  const timeDisplay = isMobile ? formatTsMobile(e.received_at || e.created_at) : formatTs(e.received_at || e.created_at);

  return `
    <div class="email-item clickable" onclick="${isSentView ? `showSentEmail(${e.id})` : `showEmail(${e.id})`}">
      <div class="email-meta">
        <span class="meta-from"><span class="meta-label">Dari</span><span class="meta-from-text">${senderText}</span></span>
        <span class="email-time">${timeDisplay}</span>
      </div>
      <div class="email-content">
        <div class="email-main">
          <div class="email-line"><span class="label-chip">Subjek</span><span class="value-text subject">${subjectText}</span></div>
          <div class="email-line"><span class="label-chip">Isi</span><span class="email-preview value-text">${previewText}</span></div>
        </div>
        <div class="email-actions">
          ${isSentView ? `
            <span class="status-badge ${statusClass(e.status)}">${e.status || 'unknown'}</span>
            <button class="btn btn-danger btn-sm" onclick="deleteSent(${e.id});event.stopPropagation()" title="Hapus"><span class="btn-icon">Hapus</span></button>
          ` : `
            <button class="btn btn-secondary btn-sm" data-code="${code || ''}" onclick="copyFromList(event, ${e.id});event.stopPropagation()" title="Salin"><span class="btn-icon">Salin</span></button>
            <button class="btn btn-danger btn-sm" onclick="deleteEmail(${e.id});event.stopPropagation()" title="Hapus"><span class="btn-icon">Hapus</span></button>
          `}
        </div>
      </div>
    </div>`;
}

export function getEmailFromCache(id) {
  return emailCache.get(id);
}

export function setEmailCache(id, email) {
  emailCache.set(id, email);
}

export function clearEmailCache() {
  emailCache.clear();
}

export function markViewLoaded() {
  viewLoaded.add(getViewKey());
}

export function isFirstLoad() {
  return !viewLoaded.has(getViewKey());
}

export function clearViewLoaded() {
  viewLoaded.clear();
}

export default {
  renderPager,
  sliceByPage,
  prevPage,
  nextPage,
  resetPager,
  setView,
  isSentViewActive,
  statusClass,
  renderEmailItem,
  getEmailFromCache,
  setEmailCache,
  clearEmailCache,
  markViewLoaded,
  isFirstLoad,
  clearViewLoaded
};
