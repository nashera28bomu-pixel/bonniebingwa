# CymorVCF

Create a session, share one link, let people check themselves in, then export everyone into a single `.vcf` contact file whenever you're ready. Built for zero-budget, phone-first deployment on Render's free tier with MongoDB Atlas.

---

## What's inside

- **Homepage** — hero + "create your session" form + a live feed of open sessions
- **Join page** (`/join/:slug`) — public form people fill in to join a session, with clear step-by-step instructions and a redirect to a WhatsApp waiting group
- **Admin dashboard** (`/admin/:adminToken`) — live join feed (real-time via Socket.io), country breakdown, duplicate removal, emoji prefix, target progress bar, VCF export
- **Owner panel** (`/super`) — you, the platform owner, can see and download every session ever created, key-gated by a secret only you know

---

## 1. Prerequisites

- A free [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register) account (you already use this — same as your other Cymor projects)
- A free [Render](https://render.com) account
- A GitHub account (to connect Render to your repo, same workflow as your other bots)
- Node.js installed if you want to test locally first (optional — you can skip straight to Render if you're phone-only)

---

## 2. Get your MongoDB connection string

1. Log in to MongoDB Atlas → create a free cluster (or reuse an existing one)
2. Database Access → add a database user with a username/password
3. Network Access → add IP `0.0.0.0/0` (allow from anywhere — needed since Render's IP isn't fixed on free tier)
4. Click **Connect** → **Drivers** → copy the connection string, it looks like:
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
5. Add a database name before the `?`, e.g. `.../cymorvcf?retryWrites=true...`

---

## 3. Set your environment variables

Copy `.env.example` to `.env` and fill in:

```
MONGODB_URI=your-connection-string-here
SUPERADMIN_KEY=a-long-random-secret-only-you-know
```

Generate a strong `SUPERADMIN_KEY` with:
```bash
node -e "console.log(require('crypto').randomBytes(24).toString('base64url'))"
```

**Keep this key private — it's what protects your `/super` owner panel.** Anyone with this key can see and download every contact on the platform.

---

## 4. Run it locally (optional, skip if going straight to Render)

```bash
npm install
npm start
```

Visit `http://localhost:3000`. The server uses `nodemon`-style auto-restart if you run `npm run dev` instead.

---

## 5. Push to GitHub

```bash
git init
git add .
git commit -m "Initial CymorVCF build"
git branch -M main
git remote add origin https://github.com/your-username/cymorvcf.git
git push -u origin main
```

`.env` is already excluded via `.gitignore` — never commit it.

---

## 6. Deploy on Render

1. Render dashboard → **New** → **Web Service**
2. Connect your GitHub repo
3. Settings:
   - **Build command:** `npm install`
   - **Start command:** `npm start`
   - **Instance type:** Free
4. Add environment variables (same as your `.env`):
   - `MONGODB_URI`
   - `SUPERADMIN_KEY`
   - Render sets `PORT` automatically — you don't need to add it
5. Deploy. Render will give you a live URL like `https://cymorvcf.onrender.com`

That's it — same GitHub → Render commit-to-deploy flow you already use for your other bots.

---

## 7. How to use it once it's live

### As a session creator
1. Go to your homepage → fill in the **Create your VCF session** form
2. Set a title, optional description, your WhatsApp group link, and an optional target count
3. Set your phone number + a PIN (this just protects your dashboard — no full login system)
4. You'll get two links:
   - **Join link** — share this with people you want to add contacts (WhatsApp status, group, bio link, etc.)
   - **Admin link** — **save this immediately**, it's the only way back into your dashboard. It is not emailed or recoverable — if lost, that session's data is still safe in the database, but you'd need to ask the platform owner (you) to pull it from `/super`.

### As someone joining a session
1. Open the join link
2. Fill in name + phone (email optional)
3. Tap **Verify and join**
4. Get redirected to the WhatsApp group automatically — stay there until the organizer shares the file

### As the session admin
- Dashboard updates live as people join (no refresh needed)
- See country breakdown automatically, parsed from phone numbers — no external API used
- **Remove duplicate numbers** — keeps the first entry per phone number
- **Set an emoji prefix** — e.g. `🔥` — applied only to the exported file, doesn't touch stored data
- **Export VCF** any time, as many times as you want

### As you, the platform owner
1. Go to `/super`
2. Enter your `SUPERADMIN_KEY`
3. See every session on the platform, open any dashboard, or download any/all sessions' contacts at once

---

## Project structure

```
cymorvcf/
├── server.js              # Express + Socket.io entry point
├── config/
│   ├── db.js               # MongoDB connection
│   ├── phoneUtils.js       # Phone normalization + country lookup (no external API)
│   ├── vcfBuilder.js       # Builds the .vcf file from contacts
│   ├── idGenerator.js      # Join slugs + admin tokens
│   └── socket.js           # Socket.io room handling
├── models/
│   ├── Session.js
│   └── Contact.js
├── middleware/
│   └── auth.js             # Admin token + superadmin key checks
├── routes/
│   ├── sessions.js         # Create session, list public sessions
│   ├── join.js              # Public join endpoint
│   ├── admin.js             # Dashboard, settings, dedupe, export
│   └── superadmin.js        # Owner-only: view/export all sessions
└── public/
    ├── index.html, join.html, admin.html, super.html
    ├── css/style.css
    └── js/ (main.js, join.js, admin.js, super.js)
```

---

## Notes on the things you specifically asked for

- **Real-time tracking** uses Socket.io — when someone joins, the admin dashboard's live feed and progress bar update instantly without a page refresh, scoped per-session via socket rooms so admins only see their own session's activity.
- **Country breakdown** is calculated purely from phone number prefixes (`+254` → Kenya, etc.) — zero external API calls, zero cost, works offline-friendly on Render's free tier.
- **Duplicate detection** matches on normalized phone number (handles `0712...` vs `+254712...` formats automatically) before storage, and the dedupe button cleans up anything that slips through.
- **Emoji prefix** is applied only at export time, never stored on the contact itself — so changing it later doesn't corrupt your data, and you can re-export with a different prefix any time.

---

## What to build next (ideas)

- Email the admin link automatically if you add an email field to session creation (needs an email service — e.g. Resend's free tier)
- Bulk import existing contacts into a session via CSV
- Per-session custom branding/colors for the join page
- Rate limiting on the join endpoint to prevent spam joins

Built with Express, MongoDB, and Socket.io — fits straight into your existing Render free-tier deploy workflow.
