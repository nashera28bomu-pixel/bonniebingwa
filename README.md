# Bonnie Bingwa — The Data Hub 💚

A full ordering platform for Bonnie Bingwa's Safaricom data, SMS, and minutes bundles.
Customers browse bundles, pay via M-Pesa STK Push, and the "Purchase Once a Day"
category is automatically enforced per recipient. Includes a private admin dashboard.

---

## 📁 Project Structure

```
bonnie-bingwa/
├── backend/          → Node.js/Express API + MongoDB + Daraja STK Push
├── frontend/          → Customer-facing site (vanilla HTML/CSS/JS)
└── admin/             → Admin dashboard (separate static site)
```

---

## 🧠 Core Business Rule (read this first)

**"Purchase Once a Day" is a CATEGORY-WIDE lock, not a per-package lock.**

If a recipient's number buys ANY package from the Data Deals (Purchase Once a Day)
category — say the KSH 19 deal — they CANNOT buy any other package from that same
category (KSH 20, KSH 48, KSH 99, etc.) until midnight (Africa/Nairobi time).

The lock is tied to the **recipient's** phone number (the number that receives the
bundle), not the payer's number. This matters for "Buy for Friends & Family" — if
Person A pays for Person B's bundle, the lock applies to Person B, not Person A.

Tunukiwa, SMS, and Minutes categories have NO such restriction — unlimited purchases.

This logic lives in `backend/services/purchaseEligibility.js`.

---

## 🚀 Local Setup

### 1. Backend

```bash
cd backend
cp .env.example .env
# Edit .env with your real MongoDB URI, Daraja keys, SMTP credentials
npm install
npm run seed        # populates all packages from the poster
npm run dev          # starts on http://localhost:5000
```

### 2. Frontend (customer site)

Just open `frontend/index.html` in a browser, or serve it:

```bash
cd frontend
npx serve .          # or any static server
```

Make sure `frontend/js/config.js` points `API_BASE` at your backend.

### 3. Admin Panel

First, create the admin account (this sends a one-time setup link by email —
**you, the developer, never see the password the admin chooses**):

```bash
cd backend
node scripts/createAdminAccount.js owner@example.com
```

The owner clicks the link in their email, sets their password on
`admin/setup-password.html`, then logs in at `admin/login.html`.

---

## 🔌 Going Live with Real M-Pesa (Daraja)

The backend ships with `DEMO_MODE=true` by default. In demo mode, clicking
"Purchase Now" simulates an STK push and auto-confirms payment after ~4 seconds —
no real Safaricom call is made. This lets you demo the full flow before you have
Daraja credentials or a deployed public URL.

**To go live:**

1. Register an app at [developer.safaricom.co.ke](https://developer.safaricom.co.ke)
   and get your sandbox (then production) Consumer Key, Consumer Secret, and Passkey.
2. Deploy the backend to Render (or similar) so you have a public HTTPS URL —
   Safaricom's callback cannot reach `localhost`.
3. In your `.env` (or Render's environment variables), set:
   - `DEMO_MODE=false`
   - `DARAJA_CONSUMER_KEY`, `DARAJA_CONSUMER_SECRET`, `DARAJA_PASSKEY`
   - `DARAJA_SHORTCODE=3688354` (Bonnie Bingwa's till)
   - `DARAJA_CALLBACK_URL=https://your-app.onrender.com/api/payments/mpesa/callback`
4. Redeploy. No code changes needed — the real Daraja integration is already
   fully wired in `backend/services/darajaService.js` and
   `backend/routes/paymentsRoutes.js`.
5. Test with a small real transaction before announcing it live.

---

## 🔑 Admin Password Security

The flow is designed so the developer never sees or sets the admin's password:

1. Developer runs `node scripts/createAdminAccount.js <email>` — this only
   registers the email and triggers a one-time setup link sent via email.
2. The admin clicks the link and sets their OWN password directly in the browser.
   It's hashed with bcrypt before it ever touches the database.
3. If the admin forgets their password, they use "Forgot password?" on the
   login page to get a fresh one-time link — again, fully self-service.

---

## 🛠 What's Already Built

- ✅ Branded loading screen → hero → categories flow
- ✅ Rotating hero carousel for trending bundles
- ✅ All 4 categories rendered from live data (Data/Tunukiwa/SMS/Minutes)
- ✅ Purchase modal: enter number → STK push → polling → thank-you message
- ✅ Once-per-day category lock with friendly "come back later" messaging
- ✅ Buy for Friends & Family (recipient-locked, payer pays)
- ✅ Contact Us: email, call, WhatsApp help, admin-editable WhatsApp group links
- ✅ Contact form → emails the admin
- ✅ Saturday Flash Sale hype section with live countdown + reminder button
- ✅ Admin dashboard: sales summary (today/week/month/all-time), top packages,
  transactions table (searchable), customers table, package CRUD,
  contact/flash-sale/WhatsApp-group settings, password management
- ✅ Secure one-time-link admin password setup (developer never sees it)
- ✅ Rate limiting on purchase + login endpoints

## 🔜 Still To Do Before Full Production Launch

- [ ] Get real Daraja production credentials (currently sandbox-ready)
- [ ] Deploy backend to Render with MongoDB Atlas connection
- [ ] Point `frontend/js/config.js` and `admin/js/dashboard.js` API_BASE at
  the deployed backend URL
- [ ] Run `createAdminAccount.js` with the real owner's email
- [ ] Test end-to-end with a real small M-Pesa payment
- [ ] Consider adding SMS/WhatsApp delivery confirmation to the customer
  once their bundle is actually activated on Safaricom's side (currently
  the site confirms payment, but actual bundle delivery depends on how
  Bonnie Bingwa fulfills orders on the backend — clarify this with the owner)
