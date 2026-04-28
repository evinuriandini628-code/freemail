/** Email list module (translated) */

import { formatTs, formatTsMobile, extractCode, escapeHtml } from './ui-helpers.js';
import { getCurrentMailbox } from './mailbox-state.js';

const PAGE_SIZE = 8;
let currentPage = 1;
let lastLoadedEmails = [];
let isSentView = false;
const emailCache = new Map();
const viewLoaded = new Set();

function getViewKey() { return `${getCurrentMailbox()}:${isSentView ? 'sent' : 'inbox'}`; }

export function renderPager(elements) {
  try {
    const total = Array.isArray(lastLoadedEmails) ? lastLoadedEmails.length : 0;
    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
    if (!elements.pager) return;
    elements.pager.style.display = total > PAGE_SIZE ? 'flex' : 'none';
    if (elements.pageInfo) elements.pageInfo.textContent = `${currentPage} / ${totalPages}`;
  } catch(_) {}
}

export function sliceByPage(items, elements) {
  lastLoadedEmails = Array.isArray(items) ? items : [];
  const start = (currentPage - 1) * PAGE_SIZE;
  renderPager(elements);
  return lastLoadedEmails.slice(start, start + PAGE_SIZE);
}

export function renderEmailItem(email, isMobile = false) {
  const e = email;
  let rawContent = isSentView ? (e.text_content || e.html_content || '') : (e.preview || e.content || e.html_content || '');
  let preview = '';

  if (rawContent) {
    preview = rawContent.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    const codeMatch = (e.verification_code || '').toString().trim() || extractCode(rawContent);
    if (codeMatch) preview = `Kode: ${codeMatch} | ${preview}`;
    preview = preview.slice(0, 40);
  }

  const subjectText = escapeHtml(e.subject || '(Tanpa subjek)');
  const previewText = escapeHtml(preview);
  const senderText = escapeHtml(e.sender || '-');
  const timeDisplay = isMobile ? formatTsMobile(e.received_at || e.created_at) : formatTs(e.received_at || e.created_at);

  return `
    <div class="email-item" onclick="showEmail(${e.id})">
      <div class="email-meta">
        <span><b>Dari:</b> ${senderText}</span>
        <span class="email-time">${timeDisplay}</span>
      </div>
      <div class="email-content">
        <div><b>Subjek:</b> ${subjectText}</div>
        <div>${previewText || '(Tidak ada isi)'}</div>
      </div>
    </div>`;
}

export default { renderPager, sliceByPage, renderEmailItem };
