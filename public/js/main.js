// ============ Shared helpers ============

function showToast(message, isWarn = false) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = message;
  toast.classList.toggle('warn', isWarn);
  toast.classList.add('show');
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => toast.classList.remove('show'), 3200);
}

function timeAgo(dateStr) {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

async function api(path, options = {}) {
  const res = await fetch(path, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'Something went wrong');
  }
  return data;
}

// ============ Homepage: create form ============

const createForm = document.getElementById('createForm');
if (createForm) {
  createForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('createBtn');
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span> Creating…';

    try {
      const payload = {
        title: document.getElementById('title').value.trim(),
        description: document.getElementById('description').value.trim(),
        whatsappGroupLink: document.getElementById('whatsappGroupLink').value.trim(),
        targetCount: Number(document.getElementById('targetCount').value) || 0,
        ownerPhone: document.getElementById('ownerPhone').value.trim(),
        ownerPin: document.getElementById('ownerPin').value.trim(),
      };

      const result = await api('/api/sessions', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      const joinUrl = `${location.origin}${result.joinLink}`;
      const adminUrl = `${location.origin}${result.adminLink}`;

      document.getElementById('joinLinkOut').textContent = joinUrl;
      document.getElementById('adminLinkOut').textContent = adminUrl;
      document.getElementById('goToAdminBtn').href = result.adminLink;
      document.getElementById('createResult').style.display = 'block';
      createForm.style.display = 'none';

      document.getElementById('createResult').scrollIntoView({ behavior: 'smooth', block: 'center' });
    } catch (err) {
      showToast(err.message, true);
      btn.disabled = false;
      btn.textContent = 'Create session';
    }
  });
}

// ============ Homepage: live manifest feed ============

const manifestGrid = document.getElementById('manifestGrid');
if (manifestGrid) {
  loadManifests();
}

async function loadManifests() {
  try {
    const sessions = await api('/api/sessions/public');

    if (sessions.length === 0) {
      manifestGrid.innerHTML = `
        <div class="empty-state" style="grid-column:1/-1;">
          <h3>No open sessions yet</h3>
          <p>Be the first to start a manifest — create one above.</p>
        </div>`;
      return;
    }

    manifestGrid.innerHTML = sessions.map(renderTicket).join('');
  } catch (err) {
    manifestGrid.innerHTML = `<div class="empty-state" style="grid-column:1/-1;"><h3>Couldn't load sessions</h3><p>${err.message}</p></div>`;
  }
}

function renderTicket(session) {
  const hasTarget = session.targetCount > 0;
  const progress = hasTarget ? Math.min(100, Math.round((session.contactCount / session.targetCount) * 100)) : null;

  return `
    <a href="/join/${session.joinSlug}" class="ticket" style="display:grid;">
      <div class="ticket-main">
        <span class="ticket-eyebrow">${timeAgo(session.createdAt)}</span>
        <div class="ticket-title">${escapeHtml(session.title)}</div>
        <div class="ticket-desc">${escapeHtml(session.description || 'No description provided.')}</div>
        <div class="ticket-meta">
          <span>${session.contactCount} joined</span>
          ${hasTarget ? `<span>${progress}% to target</span>` : ''}
        </div>
      </div>
      <div class="ticket-stub">
        <div class="stub-count">${session.contactCount}</div>
        <div class="stub-label">${hasTarget ? `of ${session.targetCount}` : 'joined'}</div>
      </div>
    </a>`;
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
