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
  try {
    // Helper to display a guaranteed visible floating banner on any screen/device
    function showUmsBanner(title, message, isError, actionHtml) {
      try {
        const existing = document.getElementById('seu-routine-sync-banner');
        if (existing) existing.remove();

        const banner = document.createElement('div');
        banner.id = 'seu-routine-sync-banner';
        banner.style.cssText = [
          'position: fixed !important',
          'top: 12px !important',
          'left: 12px !important',
          'right: 12px !important',
          'max-width: 480px !important',
          'margin: 0 auto !important',
          'z-index: 2147483647 !important',
          'background: #0f172a !important',
          'color: #ffffff !important',
          'padding: 16px 20px !important',
          'border-radius: 14px !important',
          'box-shadow: 0 16px 40px rgba(0, 0, 0, 0.65) !important',
          'border: 2px solid ' + (isError ? '#ef4444' : '#10b981') + ' !important',
          'font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif !important',
          'font-size: 14px !important',
          'line-height: 1.5 !important',
          'box-sizing: border-box !important',
          'text-align: left !important'
        ].join(';');

        banner.innerHTML = [
          '<div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:8px;">',
          '  <div style="font-weight:800; font-size:15px; color:' + (isError ? '#f87171' : '#10b981') + ';">',
          '    ' + title,
          '  </div>',
          '  <button id="btnDismissUmsBanner" style="background:transparent; border:none; color:#94a3b8; font-size:18px; line-height:1; cursor:pointer; padding:0 4px;">✕</button>',
          '</div>',
          '<div style="font-size:13px; color:#cbd5e1; margin-bottom:12px; line-height:1.45;">',
          '  ' + message,
          '</div>',
          actionHtml || ''
        ].join('');

        document.body.appendChild(banner);

        const dismissBtn = document.getElementById('btnDismissUmsBanner');
        if (dismissBtn) {
          dismissBtn.onclick = function () { banner.remove(); };
        }
        return banner;
      } catch (e) {
        console.error('Error rendering UMS banner:', e);
        return null;
      }
    }

    // Step 1: Check if running on SEU domain
    const isSeuHost = window.location.hostname.includes('seu.edu.bd') || decodeURIComponent(window.location.href).includes('UMS - Southeast University');
    if (!isSeuHost) {
      showUmsBanner(
        '⚠️ সাউথইস্ট UMS পেজে যান',
        'এই বুকমার্কলেটটি কাজ করার জন্য আপনাকে প্রথমে সাউথইস্ট বিশ্ববিদ্যালয়ের UMS পোর্টালে লগইন করতে হবে। লগইন করার পর বুকমার্কটিতে ক্লিক করুন।',
        true,
        '<div style="display:flex; gap:8px; flex-wrap:wrap;">' +
        '  <a href="https://ums.seu.edu.bd/dashboard" target="_blank" style="background:#2563eb; color:#ffffff; padding:8px 14px; border-radius:8px; text-decoration:none; font-weight:700; font-size:13px; display:inline-block;">🌐 Open UMS (ums.seu.edu.bd)</a>' +
        '  <button onclick="document.getElementById(\'seu-routine-sync-banner\')?.remove()" style="background:#334155; color:#ffffff; border:none; padding:8px 12px; border-radius:8px; cursor:pointer; font-size:13px;">✕ Dismiss</button>' +
        '</div>'
      );
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
      try {
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
      } catch (e) {}
      return '';
    }

    // Extract student info
    const bodyText = document.body ? (document.body.innerText || '') : '';
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
      const val = (progLabel.nextElementSibling.innerText || '').trim();
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
        if (advNameEl && advNameEl.innerText && !advNameEl.innerText.toLowerCase().includes('adviser') && !advNameEl.innerText.toLowerCase().includes('faculty')) {
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

    // Check if courses were found
    if (courses.length === 0) {
      showUmsBanner(
        '⚠️ কোনো রেজিস্টার্ড কোর্স পাওয়া যায়নি!',
        'এই পেজে আপনার রুটিনের কোনো কোর্স খুঁজে পাওয়া যায়নি।<br><br>👉 দয়া করে UMS মেন্যু থেকে <strong>"Registered Courses"</strong> অথবা <strong>"Student Dashboard"</strong> পেজে যান যেখানে আপনার সেমিস্টার ও কোর্সগুলো দেখা যাচ্ছে। তারপর আবার বুকমার্কটিতে ক্লিক করুন।',
        true,
        '<div style="display:flex; gap:8px; flex-wrap:wrap;">' +
        '  <button onclick="window.location.reload()" style="background:#2563eb; color:#ffffff; border:none; padding:8px 14px; border-radius:8px; font-weight:700; cursor:pointer; font-size:13px;">🔄 Reload Page</button>' +
        '  <button onclick="document.getElementById(\'seu-routine-sync-banner\')?.remove()" style="background:#334155; color:#ffffff; border:none; padding:8px 12px; border-radius:8px; cursor:pointer; font-size:13px;">✕ Dismiss</button>' +
        '</div>'
      );
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

    // Show Success Banner with action buttons
    const actionHtml = [
      '<div style="display:flex; flex-wrap:wrap; gap:8px; margin-top:8px;">',
      '  <button id="btnOpenRoutineApp" style="background:#2563eb; color:white; border:none; padding:9px 15px; border-radius:8px; font-weight:700; cursor:pointer; font-size:13px; box-shadow:0 2px 6px rgba(37,99,235,0.4);">',
      '    🚀 Open Routine App',
      '  </button>',
      '  <button id="btnCopySyncLink" style="background:#0284c7; color:white; border:none; padding:9px 12px; border-radius:8px; font-weight:600; cursor:pointer; font-size:13px;">',
      '    📋 Copy Link',
      '  </button>',
      '  <button id="btnDownloadJson" style="background:#334155; color:white; border:none; padding:9px 12px; border-radius:8px; font-weight:600; cursor:pointer; font-size:13px;">',
      '    💾 Save JSON',
      '  </button>',
      '</div>'
    ].join('');

    const banner = showUmsBanner(
      '✅ SEU Routine & Profile Extracted!',
      'Found <strong>' + courses.length + ' courses</strong> &amp; profile data for <strong>' + (studentName || 'Student') + '</strong> (Batch: ' + (batch || '—') + ', ID: ' + (studentId || '—') + '). Click below to load your routine:',
      false,
      actionHtml
    );

    const btnOpen = document.getElementById('btnOpenRoutineApp');
    if (btnOpen) {
      btnOpen.onclick = function () {
        window.open(syncFullUrl, '_blank');
        if (banner) banner.remove();
      };
    }

    const btnCopy = document.getElementById('btnCopySyncLink');
    if (btnCopy) {
      btnCopy.onclick = function () {
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
    }

    const btnJson = document.getElementById('btnDownloadJson');
    if (btnJson) {
      btnJson.onclick = function () {
        const blob = new Blob([JSON.stringify(syncPayload, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'SEU_Routine_' + (studentName || 'Student').replace(/\s+/g, '_') + '.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        if (banner) banner.remove();
      };
    }
  } catch (err) {
    console.error('SEU Routine Bookmarklet Execution Error:', err);
    try {
      const errBanner = document.createElement('div');
      errBanner.style.cssText = [
        'position: fixed !important',
        'top: 12px !important',
        'left: 12px !important',
        'right: 12px !important',
        'max-width: 480px !important',
        'margin: 0 auto !important',
        'z-index: 2147483647 !important',
        'background: #0f172a !important',
        'color: #ffffff !important',
        'padding: 16px 20px !important',
        'border-radius: 14px !important',
        'border: 2px solid #ef4444 !important',
        'font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important',
        'font-size: 13px !important',
        'box-shadow: 0 12px 30px rgba(0,0,0,0.7) !important',
        'box-sizing: border-box !important'
      ].join(';');
      errBanner.innerHTML = [
        '<div style="font-weight:800; font-size:15px; color:#f87171; margin-bottom:6px;">⚠️ Bookmarklet Error</div>',
        '<div style="color:#cbd5e1; margin-bottom:10px; line-height:1.4;">' + (err && err.message ? err.message : String(err)) + '</div>',
        '<button onclick="this.parentElement.remove()" style="background:#334155; color:#fff; border:none; padding:6px 12px; border-radius:6px; cursor:pointer; font-size:12px;">✕ Dismiss</button>'
      ].join('');
      document.body.appendChild(errBanner);
    } catch (e) {
      alert('⚠️ Bookmarklet error: ' + (err && err.message ? err.message : String(err)));
    }
  }
})();
