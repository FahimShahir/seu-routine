# 🎓 Southeast University — Class Routine & Schedule System (PWA)

A fast, responsive, privacy-first **Class Routine & Schedule Management System** built for students of **Southeast University (SEU)**. Works offline as a Progressive Web App (PWA) and installs directly to your phone's home screen.

🌐 **Live Web Application:** [https://fahimshahir.github.io/seu-routine/](https://fahimshahir.github.io/seu-routine/)

---

## ✨ Features

- ⚡ **1-Click Safe UMS Sync:** Syncs your registered courses, room allocations, and Sir/Ma'am photos directly from `ums.seu.edu.bd` in 1 second.
- 🛡️ **Zero UMS Lockout Risk:** Runs 100% inside your own browser tab. Zero automated logins, zero password requests, and zero network calls to the university server.
- 📱 **Progressive Web App (PWA):** Install it directly to your home screen on Android, iPhone, or Desktop with one click.
- 📶 **Works 100% Offline:** Service Worker caching allows you to check your timetable even in campus basements or without internet.
- 🔒 **Privacy-First (On-Device):** All personal data and routine schedules are stored strictly inside your browser (`localStorage` + session cookie). No central server collects your data.
- 👥 **Multi-Student Support:** Any number of students across any department (EEE, CSE, BBA, English, Pharmacy, Law, Civil, etc.) can use the site simultaneously without data collisions.
- ⏰ **Live Next Class Tracker:** Real-time clock indicating ongoing classes, remaining time, and countdown to your next lecture.
- 📅 **3 Interactive Views:**
  - Weekly Timetable Grid
  - Searchable Course & Faculty Directory (with photos, initials, and email links)
  - Daily Agenda View
- 💾 **Batch Sharing:** Class Representatives (CRs) can export the section routine as a `.json` file and share it in WhatsApp/Messenger groups for 1-second batchmate setup.
- 🗓️ **Google Calendar Integration:** Export full weekly schedule to `.ics` with single tap.

---

## 🚀 How to Use

### Method 1: 1-Click Safe UMS Sync (Fastest)
1. Open the [Routine App](https://fahimshahir.github.io/seu-routine/).
2. Drag the **"📌 Sync SEU Routine"** button up to your browser Bookmarks Bar (`Ctrl + Shift + B`).
3. Log into [https://ums.seu.edu.bd/dashboard](https://ums.seu.edu.bd/dashboard).
4. Click the bookmark on your bookmarks bar.
5. In the pop-up banner, click **"🚀 Open Routine App"** — your courses, rooms, and faculty photos will load instantly!

### Method 2: Copy-Paste Registered Courses
1. Select and copy your course table from the UMS dashboard.
2. In the Routine App, click **"✨ Import UMS"**, paste the text, and click **"Parse & Import"**.

### Method 3: Import from Class Representative (CR)
1. If your CR shared a `SEU_Routine.json` file in your batch group, click **"Upload Batch File"** on the home screen.
2. The entire section timetable will load in 1 second!

---

## 📱 Mobile App Installation (Add to Home Screen)

- **Android (Chrome / Edge):** Click the **"📱 Add to Home Screen"** button in the top toolbar (or tap `⋮` ➔ "Install app").
- **iPhone / iPad (Safari):** Tap the **Share** button at the bottom ➔ Tap **"Add to Home Screen"** (➕) ➔ Tap **Add**.

---

## 🛠️ Technology Stack

- **Frontend:** Vanilla HTML5, CSS3 (CSS Variables, Flexbox/Grid), JavaScript (ES6+).
- **PWA:** Web App Manifest (`manifest.json`), Service Worker (`sw.js`).
- **Storage:** Client-side `localStorage` & Session Cookies.
- **Icons & Graphics:** Responsive SVGs and high-resolution PNGs.
- **Deployment:** GitHub Pages / Vercel (100% Static & Serverless).

---

## 📄 License
MIT License. Created with ❤️ for Southeast University students.
