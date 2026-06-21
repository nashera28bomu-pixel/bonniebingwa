let superKey = sessionStorage.getItem('cymorvcf_superkey') || '';

if (superKey) {
  unlockPanel();
}

document.getElementById('unlockBtn').addEventListener('click', async () => {
  const key = document.getElementById('superKeyInput').value.trim();
  if (!key) {
    showToast('Enter your superadmin key', true);
    return;
  }
  superKey = key;
  await unlockPanel();
});

async function unlockPanel() {
  const btn = document.getElementById('unlockBtn');
  if (btn) { btn.disabled = true; btn.textContent = 'Checking…'; }

  try {
    const sessions = await api('/api/super/sessions', {
      headers: { 'x-superadmin-key': superKey },
    });

    sessionStorage.setItem('cymorvcf_superkey', superKey);
    document.getElementById('keyGate').style.display = 'none';
    document.getElementById('superContent').style.display = 'block';

    renderSessions(sessions);
    document.getElementById('exportAllBtn').href = `/api/super/export-all?key=${encodeURIComponent(superKey)}`;
  } catch (err) {
    showToast(err.message || 'Invalid key', true);
    sessionStorage.removeItem('cymorvcf_superkey');
    if (btn) { btn.disabled = false; btn.textContent = 'Unlock'; }
  }
}

function renderSessions(sessions) {
  document.getElementById('statSessions').textContent = sessions.length;
  document.getElementById('statContacts').textContent = sessions.reduce((sum, s) => sum + s.contactCount, 0);
  document.getElementById('statActive').textContent = sessions.filter((s) => s.isActive).length;

  const table = document.getElementById('sessionsTable');

  if (sessions.length === 0) {
    table.innerHTML = '<div class="empty-state" style="padding:40px;"><h3>No sessions yet</h3><p>Sessions created on the platform will show up here.</p></div>';
    return;
  }

  table.innerHTML = sessions.map((s) => `
    <div style="padding:16px 18px;border-bottom:1px solid var(--line);display:flex;justify-content:space-between;align-items:center;gap:14px;flex-wrap:wrap;">
      <div style="min-width:0;flex:1;">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;">
          <span style="font-size:14.5px;font-weight:600;">${escapeHtml(s.title)}</span>
          ${s.isActive
            ? '<span class="badge badge-live" style="padding:2px 8px;font-size:9.5px;">active</span>'
            : '<span class="badge" style="background:var(--line);color:var(--muted);padding:2px 8px;font-size:9.5px;">closed</span>'}
        </div>
        <div class="mono muted" style="font-size:11.5px;">${s.contactCount} contacts · owner ${escapeHtml(s.ownerPhone)} · ${timeAgo(s.createdAt)}</div>
      </div>
      <div style="display:flex;gap:8px;flex-shrink:0;">
        <a href="/admin/${s.adminToken}" class="btn btn-ghost" style="padding:8px 12px;font-size:12px;">Open dashboard</a>
        <a href="/api/super/export/${s._id}?key=${encodeURIComponent(superKey)}" class="btn btn-primary" style="padding:8px 12px;font-size:12px;">Export</a>
      </div>
    </div>`).join('');
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
