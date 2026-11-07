/**
 * SEU Class Routine - 1-Click Safe Bookmarklet Sync
 * ----------------------------------------------------
 * Runs safely inside student logged-in session on:
 * https://ums.seu.edu.bd/dashboard
 * 
 * Safety Guarantee:
 * - 0 network requests to UMS server.
 * - 0 credential requests.
 * - 100% Client-side DOM reading of rendered courses, student profile & photos.
 * - 0% risk of account lockout.
 */

(function () {
  if (!window.location.hostname.includes('seu.edu.bd')) {
    alert('⚠️ Please open https://ums.seu.edu.bd/dashboard first, log in, and then click this bookmark!');
    return;
  }

  // Convert rendered image element to Base64 JPEG data URL safely on the client
  function getElementBase64(imgEl) {
    try {
      if (!imgEl) return '';
      if (imgEl.src && imgEl.src.startsWith('data:image/jpeg;base64') && imgEl.src.length > 200) {
        return imgEl.src;
      }
      const canvas = document.createElement('canvas');
      const maxDim = 160;
      let w = imgEl.naturalWidth || imgEl.width || 120;
      let h = imgEl.naturalHeight || imgEl.height || 120;
      if (w > maxDim || h > maxDim) {
        if (w >= h) {
          h = Math.round((h * maxDim) / w);
          w = maxDim;
        } else {
          w = Math.round((w * maxDim) / h);
          h = maxDim;
        }
      }
      canvas.width = Math.max(w, 40);
      canvas.height = Math.max(h, 40);
      const ctx = canvas.getContext('2d');
      ctx.drawImage(imgEl, 0, 0, canvas.width, canvas.height);
      return canvas.toDataURL('image/jpeg', 0.82);
    } catch (e) {
      return (imgEl && imgEl.src && imgEl.src.startsWith('data:image')) ? imgEl.src : '';
    }
  }

  function findFacultyAvatar(initials, name, courseCode) {
    try {
      const allCards = Array.from(document.querySelectorAll('div, tr, mat-card, .card, [class*="card"]'));
      const container = allCards.find(el => {
        const txt = el.innerText || '';
        return (txt.includes(courseCode) || (initials && txt.includes('[' + initials + ']'))) && el.querySelector('img');
      });
      if (container) {
        const img = container.querySelector('img');
        if (img) {
          const b64 = getElementBase64(img);
          if (b64) return b64;
          if (img.src && (img.src.startsWith('data:image') || img.src.startsWith('http'))) return img.src;
        }
      }
    } catch (e) {}
    return '';
  }

  // Extract student avatar image from UMS dashboard DOM
  function extractStudentAvatar() {
    const selectors = [
      'img.w-24.h-24.rounded-full',
      'img[class*="rounded-full"][class*="w-24"]',
      'img[class*="rounded-full"][class*="border-primary"]',
      'img.w-20.h-20.rounded-full',
      'img.w-7.h-7.rounded-full',
      'img[src*="student"]',
      'img[src*="profile"]',
      'img[alt*="student"]',
      'img[alt*="Card cover image"]'
    ];
    for (const sel of selectors) {
      const el = document.querySelector(sel);
      if (el) {
        const b64 = getElementBase64(el);
        if (b64 && b64.length > 100) return b64;
      }
    }

    const allImgs = Array.from(document.querySelectorAll('img'));
    for (const img of allImgs) {
      const isLogo = (img.className || '').includes('hidden') || (img.alt || '').toLowerCase().includes('logo');
      if (isLogo) continue;
      if (img.classList.contains('rounded-full') || (img.className || '').includes('w-24') || (img.className || '').includes('w-20') || (img.className || '').includes('w-7')) {
        const b64 = getElementBase64(img);
        if (b64 && b64.length > 100) return b64;
      }
    }
    return '';
  }

  // Extract student info
  const bodyText = document.body.innerText || '';
  const allDivs = Array.from(document.querySelectorAll('div, td, th, span'));
  
  // Student Name
  let studentName = '';
  const nameEl = document.querySelector('.text-xl.font-semibold, h1.font-semibold, h2.font-semibold');
  if (nameEl && nameEl.innerText && !nameEl.innerText.toLowerCase().includes('adviser') && !nameEl.innerText.toLowerCase().includes('faculty') && !nameEl.innerText.toLowerCase().includes('dashboard')) {
    studentName = nameEl.innerText.trim();
  }
  if (!studentName) {
    const batchIdx = bodyText.indexOf('Batch:');
    if (batchIdx !== -1) {
      const pre = bodyText.substring(Math.max(0, batchIdx - 200), batchIdx).trim().split('\n');
      const cand = pre[pre.length - 1].trim();
      if (cand && cand.length > 2 && !cand.toLowerCase().includes('dashboard')) {
        studentName = cand;
      }
    }
  }
  if (!studentName) {
    const nameMatch = bodyText.match(/Welcome back\s*!?,?\s*([^\n!]+)/i) || bodyText.match(/Basic Information\s*\n\s*([^\n]+)/i);
    if (nameMatch) studentName = nameMatch[1].trim();
  }

  // Batch
  let batch = '42';
  const batchMatch = bodyText.match(/Batch\s*[:\s]*(\d+)/i);
  if (batchMatch) batch = batchMatch[1].trim();

  // Student ID
  let studentId = '';
  const idLabel = allDivs.find(el => el.children.length === 0 && el.innerText.trim().toUpperCase() === 'ID');
  if (idLabel && idLabel.nextElementSibling) {
    const val = (idLabel.nextElementSibling.innerText || '').match(/\d{10,}/);
    if (val) studentId = val[0];
  }
  if (!studentId) {
    const idMatch = bodyText.match(/(?:^|\n)\s*ID\s*[\n:\s]+(\d{10,})/i) || bodyText.match(/(\d{16})/);
    if (idMatch) studentId = idMatch[1].trim();
  }

  // Student Code
  let studentCode = '';
  const codeLabel = allDivs.find(el => el.children.length === 0 && el.innerText.trim().toUpperCase() === 'CODE');
  if (codeLabel && codeLabel.nextElementSibling) {
    const val = (codeLabel.nextElementSibling.innerText || '').match(/\d{10,}/);
    if (val) studentCode = val[0];
  }
  if (!studentCode) {
    const codeMatch = bodyText.match(/(?:^|\n)\s*Code\s*[\n:\s]+(\d{10,})/i);
    if (codeMatch) studentCode = codeMatch[1].trim();
  }

  // Program / Department
  let program = 'BSc in EEE';
  const progLabel = allDivs.find(el => el.children.length === 0 && el.innerText.trim().toUpperCase() === 'PROGRAM');
  if (progLabel && progLabel.nextElementSibling) {
    const val = progLabel.nextElementSibling.innerText.trim();
    if (val) program = val;
  }
  if (!program || program === 'BSc in EEE') {
    const progMatch = bodyText.match(/(?:^|\n)\s*Program\s*[\n:\s]+([^\n]+)/i);
    if (progMatch) program = progMatch[1].trim();
  }
  if (!program) {
    const degMatch = bodyText.match(/(BSc\s+in\s+[A-Za-z\s]+|BBA|BA\s+in\s+[A-Za-z\s]+|LLB|MBA|MSc\s+in\s+[A-Za-z\s]+)/i);
    if (degMatch) program = degMatch[1].trim();
  }

  // Advisor Name
  let advisorName = '';
  const advLabel = allDivs.find(el => el.children.length === 0 && (el.innerText.trim().toUpperCase() === 'ADVISER' || el.innerText.trim().toUpperCase() === 'ADVISOR'));
  if (advLabel) {
    const advCard = advLabel.closest('.filter-info, [class*="card"], div.rounded-2xl') || (advLabel.parentElement ? advLabel.parentElement.parentElement : null);
    if (advCard) {
      const advNameEl = advCard.querySelector('.text-xl, .text-2xl, h2, h3, .font-semibold');
      if (advNameEl && !advNameEl.innerText.toLowerCase().includes('adviser') && !advNameEl.innerText.toLowerCase().includes('faculty')) {
        advisorName = advNameEl.innerText.trim();
      }
    }
  }
  if (!advisorName) {
    const advMatch = bodyText.match(/Adviser[\s\S]*?Faculty[\s\S]*?([Dr\.]*[A-Za-z\s\.]+)\n/i) || bodyText.match(/(?:Advisor|Adviser)\s*[:\s]*([^\n]+)/i);
    if (advMatch) advisorName = advMatch[1].trim();
  }

  // Student Avatar
  const studentAvatar = extractStudentAvatar();

  // Extract Registered Courses & Schedules
  const lines = bodyText.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
  const courses = [];
  const courseRegex = /^[ \t]*([A-Z]{3,5}\s*\d{3,4}(?:\.\d+)?)[ \t]*$/i;
  
  let curCourse = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const match = line.match(courseRegex);

    if (match && !line.startsWith('PC') && !line.startsWith('ROOM') && !line.startsWith('SEC')) {
      if (curCourse) {
        courses.push(curCourse);
      }

      const rawCode = match[1].replace(/\s+/g, '').toUpperCase();
      const parts = rawCode.split('.');
      const code = parts[0];
      const sec = parts[1] || '1';

      curCourse = {
        codeWithSec: rawCode,
        code: code,
        section: sec,
        title: '',
        credits: code.includes('LAB') || rawCode.endsWith('.2') ? 1.5 : 3.0,
        type: code.includes('LAB') || rawCode.endsWith('.2') ? 'Lab' : 'Theory',
        faculty: { initials: '', name: '', email: '', avatar: '' },
        schedules: []
      };
      continue;
    }

    if (!curCourse) continue;

    // Faculty: [RR] Rakayet Rafi
    const facMatch = line.match(/\[([A-Z]+)\]\s*([^@\n]+)/i);
    if (facMatch) {
      curCourse.faculty.initials = facMatch[1].toUpperCase();
      curCourse.faculty.name = facMatch[2].trim();
      continue;
    }

    // Email
    const emailMatch = line.match(/([\w\.-]+@[\w\.-]+\.\w+)/i);
    if (emailMatch) {
      curCourse.faculty.email = emailMatch[1].trim();
      continue;
    }

    // Schedule: MON # 14:00 ~ 16:00 @ PC211
    const schedMatch = line.match(/(SUN|MON|TUE|WED|THU|FRI|SAT)\s*#?\s*(\d{1,2}:\d{2})\s*[-~–]\s*(\d{1,2}:\d{2})(?:\s*@\s*([A-Za-z0-9\-]+))?/i);
    if (schedMatch) {
      curCourse.schedules.push({
        day: schedMatch[1].toUpperCase(),
        startTime: schedMatch[2],
        endTime: schedMatch[3],
        room: (schedMatch[4] || 'TBA').toUpperCase(),
        campus: 'Permanent Campus (PC)'
      });
      continue;
    }

    // Course Title
    if (!curCourse.title && !line.includes('@') && !line.includes('#') && !line.startsWith('[')) {
      curCourse.title = line;
    }
  }

  if (curCourse) {
    courses.push(curCourse);
  }

  // Attach Faculty Avatars if rendered on page
  courses.forEach(c => {
    c.faculty.avatar = findFacultyAvatar(c.faculty.initials, c.faculty.name, c.codeWithSec);
  });

  if (courses.length === 0) {
    alert('⚠️ Could not find registered courses on this screen.\n\nPlease click on "Registered Courses" or "Student Dashboard" on UMS first, then click this bookmark again!');
    return;
  }

  const syncPayload = {
    student: {
      name: studentName || 'Student Name',
      studentId: studentId || '',
      code: studentCode || '',
      program: program || 'BSc in EEE',
      batch: batch || '42',
      advisor: { name: advisorName || '' },
      avatar: studentAvatar
    },
    activeSemester: 'Fall 2026',
    courses: courses
  };

  const payloadEncoded = encodeURIComponent(JSON.stringify(syncPayload));
  const publicUrl = window.location.origin.includes('localhost')
    ? 'http://localhost:8080/index.html'
    : (window.location.protocol === 'file:' ? 'file:///D:/rutine/index.html' : 'https://fahimshahir.github.io/seu-routine/');
  const syncFullUrl = publicUrl + '#sync=' + payloadEncoded;

  // Show Success Banner
  const banner = document.createElement('div');
  banner.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 9999999;
    background: #0f172a;
    color: #ffffff;
    padding: 16px 22px;
    border-radius: 12px;
    box-shadow: 0 10px 25px rgba(0,0,0,0.5);
    border: 2px solid #10b981;
    font-family: system-ui, -apple-system, sans-serif;
    max-width: 440px;
  `;
  banner.innerHTML = `
    <div style="font-weight:800; font-size:16px; color:#10b981; margin-bottom:6px;">
      ✅ SEU Routine & Profile Extracted!
    </div>
    <div style="font-size:13px; color:#cbd5e1; margin-bottom:12px; line-height:1.5;">
      Found <strong>${courses.length} courses</strong> &amp; profile data for <strong>${studentName || 'Student'}</strong> (Batch: ${batch || '—'}, ID: ${studentId || '—'}).
    </div>
    <div style="display:flex; flex-wrap:wrap; gap:8px;">
      <button id="btnOpenRoutineApp" style="background:#2563eb; color:white; border:none; padding:8px 14px; border-radius:6px; font-weight:700; cursor:pointer; font-size:13px;">
        🚀 Open Routine App
      </button>
      <button id="btnCopySyncLink" style="background:#0284c7; color:white; border:none; padding:8px 12px; border-radius:6px; font-weight:600; cursor:pointer; font-size:13px;">
        📋 Copy Link
      </button>
      <button id="btnDownloadJson" style="background:#334155; color:white; border:none; padding:8px 12px; border-radius:6px; font-weight:600; cursor:pointer; font-size:13px;">
        💾 Save JSON
      </button>
      <button onclick="this.parentElement.parentElement.remove()" style="background:transparent; color:#94a3b8; border:none; padding:8px; cursor:pointer; font-size:13px;">
        ✕
      </button>
    </div>
  `;

  document.body.appendChild(banner);

  document.getElementById('btnOpenRoutineApp').onclick = function () {
    window.open(syncFullUrl, '_blank');
    banner.remove();
  };

  document.getElementById('btnCopySyncLink').onclick = function () {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(syncFullUrl).then(() => {
        alert('📋 Sync link copied! Open the Routine App or paste into your browser.');
      }).catch(() => {
        prompt('Copy your Sync Link below:', syncFullUrl);
      });
    } else {
      prompt('Copy your Sync Link below:', syncFullUrl);
    }
  };

  document.getElementById('btnDownloadJson').onclick = function () {
    const blob = new Blob([JSON.stringify(syncPayload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SEU_Routine_${(studentName || 'Student').replace(/\s+/g, '_')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    banner.remove();
  };
})();
