// Extract adminToken from /admin/:adminToken
const adminToken = location.pathname.split('/').filter(Boolean)[1];

let dashboardData = null;
let socket = null;

async function loadDashboard() {
  try {
    const data = await api(`/api/admin/${adminToken}/dashboard`);
    dashboardData = data;
    renderDashboard(data);

    document.getElementById('loadingState').style.display = 'none';
    document.getElementById('dashboardContent').style.display = 'block';

    connectSocket(data.session.id);
  } catch (err) {
    document.getElementById('loadingState').style.display = 'none';
    document.getElementById('notFoundState').style.display = 'block';
  }
}

function connectSocket(sessionId) {
  socket = io();
  socket.emit('watchSession', sessionId);

  socket.on('newJoin', (payload) => {
    // Bump live counters without a full reload
    dashboardData.stats.totalContacts = payload.contactCount;
    document.getElementById('statTotal').textContent = payload.contactCount;
    document.getElementById('statLive').textContent =
      Number(document.getElementById('statLive').textContent) + 1;

    updateProgress(payload.contactCount, payload.targetCount);
    prependLiveFeedItem(payload);

    // Refresh full contact list + country breakdown in the background
    refreshContactsAndCountries();
  });
}

async function refreshContactsAndCountries() {
  try {
    const data = await api(`/api/admin/${adminToken}/dashboard`);
    dashboardData = data;
    renderContactsList(data.contacts);
    renderCountryBreakdown(data.stats.countryBreakdown);
    document.getElementById('statDupes').textContent = data.stats.duplicateCount;
    document.getElementById('statCountries').textContent = Object.keys(data.stats.countryBreakdown).length;
  } catch (err) {
    // Silent fail on background refresh — live feed already gave the user the update
  }
}

function prependLiveFeedItem(payload) {
  const feed = document.getElementById('liveFeed');
  const empty = document.getElementById('liveFeedEmpty');
  if (empty) empty.remove();

  const item = document.createElement('div');
  item.style.cssText = 'padding:12px 16px;border-bottom:1px solid var(--line);display:flex;justify-content:space-between;align-items:center;animation:fadeIn 0.4s ease;';
  item.innerHTML = `
    <span style="font-size:13.5px;">${payload.flag || '🏳️'} ${escapeHtml(payload.name)}</span>
    <span class="mono" style="font-size:11px;color:var(--muted);">just now</span>`;
  feed.prepend(item);

  // Cap visible live items to keep it light
  const items = feed.querySelectorAll('div');
  if (items.length > 12) items[items.length - 1].remove();
}

function updateProgress(count, target) {
  document.getElementById('statTotal').textContent = count;
  if (target > 0) {
    const pct = Math.min(100, Math.round((count / target) * 100));
    document.getElementById('progressLabel').textContent = `${count} / ${target} joined`;
    document.getElementById('progressPercent').textContent = `${pct}%`;
    document.getElementById('progressFill').style.width = `${pct}%`;
    document.getElementById('progressWrap').style.display = 'block';
  } else {
    document.getElementById('progressLabel').textContent = `${count} joined — no target set`;
    document.getElementById('progressFill').style.width = '0%';
  }
}

function renderDashboard(data) {
  const { session, stats, contacts } = data;

  document.getElementById('sessionTitle').textContent = session.title;
  document.getElementById('sessionDesc').textContent = session.description || 'No description set.';
  document.title = `${session.title} — Dashboard`;

  updateProgress(stats.totalContacts, stats.targetCount);

  document.getElementById('statTotal').textContent = stats.totalContacts;
  document.getElementById('statDupes').textContent = stats.duplicateCount;
  document.getElementById('statCountries').textContent = Object.keys(stats.countryBreakdown).length;
  document.getElementById('statLive').textContent = 0;

  renderCountryBreakdown(stats.countryBreakdown);
  renderContactsList(contacts);

  // Settings form
  document.getElementById('joinLinkField').value = `${location.origin}${session.joinLink}`;
  document.getElementById('whatsappLinkInput').value = session.whatsappGroupLink || '';
  document.getElementById('targetCountInput').value = session.targetCount || '';
  document.getElementById('emojiPrefixInput').value = session.emojiPrefix || '';

  document.getElementById('exportBtn').href = `/api/admin/${adminToken}/export`;
}

function renderCountryBreakdown(breakdown) {
  const el = document.getElementById('countryBreakdown');
  const entries = Object.entries(breakdown).sort((a, b) => b[1] - a[1]);

  if (entries.length === 0) {
    el.innerHTML = '<p class="muted" style="font-size:13px;">No contacts yet.</p>';
    return;
  }

  const max = entries[0][1];
  el.innerHTML = entries.map(([country, count]) => `
    <div style="margin-bottom:12px;">
      <div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:5px;">
        <span>${escapeHtml(country)}</span>
        <span class="mono muted">${count}</span>
      </div>
      <div class="progress-track" style="height:5px;">
        <div class="progress-fill" style="width:${(count / max) * 100}%;"></div>
      </div>
    </div>`).join('');
}

function renderContactsList(contacts) {
  const el = document.getElementById('contactsList');

  if (contacts.length === 0) {
    el.innerHTML = '<div class="empty-state" style="padding:30px;"><p style="font-size:13px;">No contacts yet. Share your join link to get started.</p></div>';
    return;
  }

  el.innerHTML = contacts.map((c) => `
    <div style="padding:12px 16px;border-bottom:1px solid var(--line);display:flex;justify-content:space-between;align-items:center;gap:10px;">
      <div style="min-width:0;">
        <div style="font-size:13.5px;font-weight:500;">${escapeHtml(c.name)}</div>
        <div class="mono muted" style="font-size:11.5px;">${escapeHtml(c.phone)}${c.email ? ' · ' + escapeHtml(c.email) : ''}</div>
      </div>
      <button class="btn btn-ghost" style="padding:6px 10px;font-size:11.5px;flex-shrink:0;" onclick="deleteContact('${c.id}')">Remove</button>
    </div>`).join('');
}

async function deleteContact(contactId) {
  try {
    await api(`/api/admin/${adminToken}/contacts/${contactId}`, { method: 'DELETE' });
    showToast('Contact removed');
    refreshContactsAndCountries();
    dashboardData.stats.totalContacts -= 1;
    document.getElementById('statTotal').textContent = dashboardData.stats.totalContacts;
  } catch (err) {
    showToast(err.message, true);
  }
}

// ============ Settings save ============

document.getElementById('saveSettingsBtn').addEventListener('click', async () => {
  const btn = document.getElementById('saveSettingsBtn');
  btn.disabled = true;
  btn.textContent = 'Saving…';

  try {
    await api(`/api/admin/${adminToken}/settings`, {
      method: 'PATCH',
      body: JSON.stringify({
        whatsappGroupLink: document.getElementById('whatsappLinkInput').value.trim(),
        targetCount: Number(document.getElementById('targetCountInput').value) || 0,
        emojiPrefix: document.getElementById('emojiPrefixInput').value.trim(),
      }),
    });
    showToast('Settings saved');
    updateProgress(dashboardData.stats.totalContacts, Number(document.getElementById('targetCountInput').value) || 0);
  } catch (err) {
    showToast(err.message, true);
  } finally {
    btn.disabled = false;
    btn.textContent = 'Save settings';
  }
});

// ============ Dedupe ============

document.getElementById('dedupeBtn').addEventListener('click', async () => {
  if (!confirm('Remove duplicate phone numbers? This keeps the first entry and deletes the rest. This cannot be undone.')) return;

  const btn = document.getElementById('dedupeBtn');
  btn.disabled = true;
  btn.textContent = 'Removing…';

  try {
    const result = await api(`/api/admin/${adminToken}/duplicates`, { method: 'DELETE' });
    showToast(`Removed ${result.removed} duplicate${result.removed === 1 ? '' : 's'}`);
    loadDashboard();
  } catch (err) {
    showToast(err.message, true);
  } finally {
    btn.disabled = false;
    btn.textContent = 'Remove duplicate numbers';
  }
});

// ============ Copy join link ============

document.getElementById('copyJoinLink').addEventListener('click', () => {
  const field = document.getElementById('joinLinkField');
  field.select();
  navigator.clipboard.writeText(field.value).then(() => showToast('Join link copied'));
});

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

loadDashboard();
