# 🎓 Southeast University — Class Routine & Schedule Management System (PWA)

> ### 👨‍💻 Engineered & Maintained by [F.U.M Foyjul Bari Shahir](https://github.com/FahimShahir)
> **Student ID:** `0232330005131002` • **Code:** `2023200500002` • **Batch 42**  
> **Department of Electrical & Electronic Engineering (EEE)**  
> **Southeast University** *(Permanent Campus - PC, Tejgaon, Dhaka)*  
> 🌐 **Live Web Application:** [https://fahimshahir.github.io/seu-routine/](https://fahimshahir.github.io/seu-routine/)

---

A high-performance, privacy-first, offline-capable **Progressive Web App (PWA)** built specifically for students of **Southeast University (SEU)** across all academic departments (EEE, CSE, BBA, Civil, Textile, Pharmacy, English, Law, etc.).

[![GitHub stars](https://img.shields.io/github/stars/FahimShahir/seu-routine?style=social)](https://github.com/FahimShahir/seu-routine)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![PWA Ready](https://img.shields.io/badge/PWA-Ready-success.svg)](https://fahimshahir.github.io/seu-routine/)
[![SEU Portal](https://img.shields.io/badge/SEU-UMS%20Sync-blue.svg)](https://ums.seu.edu.bd)

---

## 👨‍💻 About the Developer & Creator

<div align="center">
  <img src="https://avatars.githubusercontent.com/u/108399589?v=4" alt="F.U.M Foyjul Bari Shahir" width="130" style="border-radius: 50%; border: 3px solid #2563eb; box-shadow: 0 4px 14px rgba(37,99,235,0.3); margin-bottom: 10px;" />
  <h3>F.U.M Foyjul Bari Shahir</h3>
  <p><strong>Creator & Lead System Developer</strong><br>
  <em>Batch 42 • Department of Electrical & Electronic Engineering (EEE)</em><br>
  <strong>Southeast University, Dhaka, Bangladesh</strong></p>
  
  <p>
    <a href="https://github.com/FahimShahir">
      <img src="https://img.shields.io/badge/GitHub-Profile-black?style=for-the-badge&logo=github" alt="GitHub Profile" />
    </a>
    <a href="https://github.com/FahimShahir/seu-routine">
      <img src="https://img.shields.io/badge/Star%20Repo-🌟-yellow?style=for-the-badge" alt="Star Repository" />
    </a>
  </p>
</div>

> *"I engineered this universal routine management platform to solve a daily frustration for all Southeast University students — remembering class times, room numbers, and faculty details. With 1-Click Safe UMS Sync, offline PWA support, and strict on-device privacy, every student across every semester and department can now have their personal timetable in their pocket without university portal lockout risks."*  
> — **F.U.M Foyjul Bari Shahir**

---

## ✨ Core Features

- ⚡ **1-Click Safe UMS Sync Bookmarklet:** Syncs registered courses, lecture rooms, and teacher photos straight from `ums.seu.edu.bd` in 1 second.
- 🛡️ **Zero UMS Lockout Risk:** Runs entirely inside your browser tab. Zero bot logins, zero password requests, and zero network calls to the university server.
- 📱 **Installable Progressive Web App (PWA):** Installs natively onto your Android, iPhone, or Desktop home screen with one tap.
- 📶 **100% Offline Capable:** Built-in Service Worker caches your schedule and faculty directory, so you can check classes inside basements or without internet.
- 🔒 **Zero-Data Clean Slate (Privacy First):** No personal data is stored on external servers. All routines and profiles are saved exclusively on your device via browser `localStorage` and session cookies.
- 👥 **Multi-Student & Multi-Semester:** Any number of students across any department (EEE, CSE, BBA, Civil, Textile, etc.) can manage multiple semesters concurrently on the same device.
- ⏰ **Live Next Class Tracker:** Real-time countdown clock indicating ongoing lectures, room numbers, and time remaining until the next class.
- 🗓️ **Google Calendar Export:** Single-click export of your full semester timetable to `.ics` for Google Calendar, Apple Calendar, and Outlook.
- 🖨️ **Print & PDF Mode:** High-resolution formatted weekly timetable layout optimized for A4 printouts and notice boards.

---

## 🚀 How to Use

### Method 1: 1-Click Safe UMS Sync (Fastest)
1. Open the [Routine App](https://fahimshahir.github.io/seu-routine/).
2. Drag the **"📌 Sync SEU Routine"** button to your browser Bookmarks Bar (`Ctrl + Shift + B`).
3. Log into [https://ums.seu.edu.bd/dashboard](https://ums.seu.edu.bd/dashboard).
4. Click the bookmark on your bookmarks bar.
5. In the pop-up notification, click **"🚀 Open Routine App"** — your courses, rooms, and faculty photos will load instantly!

### Method 2: Copy-Paste Registered Courses
1. Select and copy your course table from the UMS dashboard.
2. In the Routine App, click **"✨ Import UMS"**, paste the text, and click **"Parse & Import"**.

### Method 3: Import from Class Representative (CR)
1. If your CR shared a routine file in your batch group, click **"Upload Batch File"** on the home screen.
2. Your entire section timetable will load in 1 second!

---

## 📱 Mobile App Installation (Add to Home Screen)

- **Android (Chrome / Edge):** Click the **"📱 Add to Home Screen"** button in the top toolbar (or tap `⋮` ➔ "Install app").
- **iPhone / iPad (Safari):** Tap the **Share** button at the bottom ➔ Tap **"Add to Home Screen"** (➕) ➔ Tap **Add**.

---

## 🛠️ Technology Stack

- **Frontend:** HTML5, CSS3 (Modern Variables, Responsive Flexbox & Grid), JavaScript (ES6+).
- **PWA Architecture:** Web App Manifest (`manifest.json`), Service Worker (`sw.js`).
- **Data Engine:** Client-side `localStorage`, Session Cookies.
- **Hosting & CI/CD:** GitHub Pages (100% Serverless, Static, HTTPS).

---

## 📄 License & Attribution

This project is licensed under the **MIT License**.  
Crafted with ❤️ by **[F.U.M Foyjul Bari Shahir](https://github.com/FahimShahir)** (Batch 42, Dept. of EEE) for the students of **Southeast University**.
