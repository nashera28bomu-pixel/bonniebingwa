// Extract the slug from /join/:slug
const slug = location.pathname.split('/').filter(Boolean)[1];

let currentSession = null;

async function loadSession() {
  try {
    const session = await api(`/api/sessions/join/${slug}`);
    currentSession = session;

    document.getElementById('sessionTitle').textContent = session.title;
    document.getElementById('sessionDesc').textContent = session.description || 'No description provided.';
    document.getElementById('sessionCount').textContent = session.contactCount;
    document.getElementById('sessionCountLabel').textContent = session.targetCount > 0
      ? `of ${session.targetCount}`
      : 'joined';

    document.getElementById('loadingState').style.display = 'none';
    document.getElementById('sessionContent').style.display = 'block';
  } catch (err) {
    document.getElementById('loadingState').style.display = 'none';
    document.getElementById('notFoundState').style.display = 'block';
  }
}

loadSession();

// ============ Form submission ============

const joinForm = document.getElementById('joinForm');
const phoneField = document.getElementById('phone').closest('.field');

joinForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const name = document.getElementById('name').value.trim();
  const phone = document.getElementById('phone').value.trim();
  const email = document.getElementById('email').value.trim();

  // Basic client-side phone sanity check (server does the real validation)
  const digitsOnly = phone.replace(/[\s\-()]/g, '');
  if (!/^(\+?\d{9,15})$/.test(digitsOnly)) {
    phoneField.classList.add('invalid');
    phoneField.querySelector('input').focus();
    return;
  }
  phoneField.classList.remove('invalid');

  const btn = document.getElementById('joinBtn');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span> Verifying…';

  // Update step indicator
  document.getElementById('stepIndicator1').style.color = 'var(--muted)';
  document.getElementById('stepIndicator2').style.color = 'var(--signal)';

  try {
    const result = await api(`/api/join/${slug}`, {
      method: 'POST',
      body: JSON.stringify({ name, phone, email }),
    });

    document.getElementById('stepIndicator2').style.color = 'var(--muted)';
    document.getElementById('stepIndicator3').style.color = 'var(--signal)';

    joinForm.style.display = 'none';
    document.getElementById('successState').style.display = 'block';
    document.getElementById('successMessage').textContent = result.alreadyJoined
      ? "You'd already joined — redirecting you back to the WhatsApp group."
      : "Redirecting you to the WhatsApp group to wait for the file…";

    const waLink = result.whatsappGroupLink;
    const redirectBtn = document.getElementById('whatsappRedirectBtn');

    if (waLink) {
      redirectBtn.href = waLink;
      setTimeout(() => { window.location.href = waLink; }, 1800);
    } else {
      redirectBtn.style.display = 'none';
      document.getElementById('successMessage').textContent = "You're on the list. The organizer hasn't set a waiting group yet — check back with them directly.";
    }
  } catch (err) {
    showToast(err.message, true);
    btn.disabled = false;
    btn.textContent = 'Verify and join';
    document.getElementById('stepIndicator2').style.color = 'var(--muted)';
    document.getElementById('stepIndicator1').style.color = 'var(--signal)';
  }
});
