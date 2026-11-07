# 🚀 Public Deployment Guide — SEU Class Routine System
**How to deploy this website online for all Southeast University students (Free forever)**

This guide explains how to host this system publicly so that any student at Southeast University can visit the URL (e.g. `https://your-name.github.io/seu-routine/` or `https://seu-routine.vercel.app/`), sync their routine in 1 second, and use it safely.

---

## 🔒 100% University Account Safety & Privacy Guarantee

When sharing this with students, emphasize these three points:
1. **Zero Password Sharing:** Students **never** enter their university UMS password on this website.
2. **Zero Bot Calls:** The system makes **0 requests** to `ums.seu.edu.bd`. It reads already-rendered courses on the student's screen, so **there is zero risk of university account lockout**.
3. **100% Client-Side Privacy:** All routines, courses, and photos are saved in the student's **own browser (`localStorage`)**. No central database is used, meaning no student data is ever collected or leaked.

---

## 🌐 Method 1: Deploy Free on GitHub Pages (Recommended — Takes 2 Minutes)

1. **Create a GitHub Repository:**
   - Go to [https://github.com/new](https://github.com/new).
   - Repository name: `seu-routine` (make it **Public**).
   - Click **Create repository**.

2. **Upload Files:**
   - Upload the following files to your repository:
     - `index.html` (Main Production Web Application)
     - `manifest.json` (PWA Configuration)
     - `sw.js` (Offline Service Worker)
     - `icons/` (Folder with `icon-192.png` and `icon-512.png`)
     - `routine_data.json`
     - `seu_ums_sync_bookmarklet.js`
     - `ROUTINE.md`

3. **Enable GitHub Pages:**
   - In your GitHub repo, go to **Settings** -> **Pages** (on the left menu).
   - Under **Build and deployment** -> **Branch**, select `main` (or `master`) and folder `/ (root)`.
   - Click **Save**.

4. **Your Live Public Link:**
   - Within 60 seconds, your site will be live at:  
     `https://<your-username>.github.io/seu-routine/`
   - Share this link with your batchmates, CRs, and campus Facebook/WhatsApp groups!

---

## 📱 How Students Install "Add to Home Screen" (PWA Mobile App)

This application is built as an official **Progressive Web App (PWA)**:
1. **Android (Chrome, Samsung Internet, Edge):**
   - When a student visits the site, an **`📱 Add to Home Screen`** button appears in the top header.
   - Click it (or open browser menu `⋮` ➔ **"Install app"** / **"Add to Home screen"**).
   - The app installs directly onto their phone's home screen with the official Southeast University icon and opens fullscreen without any browser address bar!
2. **iPhone / iPad (Apple Safari):**
   - Open the link in Safari.
   - Tap the **Share** button (box with an arrow pointing up at the bottom).
   - Tap **"Add to Home Screen"** (➕) and tap **Add**.
3. **Works 100% Offline:**
   - Thanks to `sw.js`, students can open and check their daily routine, room numbers, and teachers' details even without an active internet connection!

---

## 👥 Multi-Student Concurrency & Cookie/LocalStorage Privacy

- **Unlimited Simultaneous Users:** Because the app is 100% client-side (Zero central server), **10,000+ students** can use the website at the exact same moment with zero server lag, zero database collisions, and zero hosting costs.
- **Isolated Data:** Every student's courses, teacher photos, and ID are stored strictly on their own device (`localStorage` + `seu_student_session` cookie). Student A's data never touches Student B's device.
- **Clean Production Slate:** New visitors start with a clean onboarding hub (zero pre-loaded personal data), with options to sync from UMS, paste text, or upload their section's JSON.

---

## ⚡ Method 2: Deploy Free on Vercel (Instant 1-Click)

1. Go to [https://vercel.com](https://vercel.com) and log in with GitHub.
2. Click **Add New...** -> **Project**.
3. Select your `seu-routine` GitHub repository and click **Deploy**.
4. Your site will immediately be live on a fast global CDN (e.g. `https://seu-routine.vercel.app`).

---

## 📌 How Students Will Sync Their Routine on the Public Site

When a student visits your public link:
1. **Method A — 1-Click Bookmarklet (Instant Magic):**
   - The student drags the **"📌 Sync SEU Routine"** button into their browser bookmarks bar.
   - They log into `https://ums.seu.edu.bd/dashboard` normally.
   - They click the bookmark -> A green banner pops up -> Click **"🚀 Open Routine App"**.
   - Their entire timetable, rooms, and faculty photos load instantly!

2. **Method B — Paste UMS Text (Mobile / Phone Friendly):**
   - On phone or PC, student selects the text in their UMS "Registered Courses" table and copies it.
   - On the routine website, click **"✨ Import UMS"**, paste the text, and click **"Parse & Import"**.
   - Done in 5 seconds!

3. **Method C — Batch Representative (CR) Share:**
   - The Class Representative (CR) creates/imports the routine for their section once.
   - The CR clicks **"💾 Share / Backup"** -> **"Download Routine JSON"** and sends `SEU_Routine_Section_1.json` to the batch Messenger/WhatsApp group.
   - All other students simply click **"Import Routine (.json)"** and their entire schedule is set up instantly with zero effort!

