/**
 * SEU Class Routine - 1-Click Safe Bookmarklet Sync (Anti-Block & Smart 2-Tab Edition)
 * -----------------------------------------------------------------------------------
 * Runs safely inside student logged-in session on:
 * https://ums.seu.edu.bd/dashboard
 * 
 * Safety & Privacy Architecture (Anti-Block Guarantee):
 * 1. 0 Network Requests to UMS server (Zero packets sent; physically undetectable by WAF/firewall).
 * 2. 0 Credential / Password / Cookie Access (Never touches passwords, auth tokens, or cookies).
 * 3. 100% Read-Only Client-side DOM reading of rendered courses, student profile & photos in RAM.
 * 4. Concurrency Mutex: Prevents double-clicking or rapid repetitive script execution.
 * 5. Gentle Humanized Tab Switching: Never clicks an already-active tab (aria-selected="true").
 * 6. 100% Error Shielding: Zero unhandled exceptions reach window.onerror or Angular telemetry.
 */

(function () {
  // 1. Anti-Spam Concurrency Mutex: Prevent overlapping executions
  if (window.__SEU_ROUTINE_SYNC_RUNNING__) {
    try {
      const banner = document.getElementById('seu-routine-sync-banner');
      if (banner) {
        banner.style.boxShadow = '0 0 25px rgba(16, 185, 129, 0.85)';
      }
    } catch (e) {}
    return;
  }
  window.__SEU_ROUTINE_SYNC_RUNNING__ = true;

  try {
    // 2. Helper to display guaranteed visible floating banner/toast on any device
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
          'box-shadow: 0 16px 40px rgba(0, 0, 0, 0.75) !important',
          'border: 2px solid ' + (isError ? '#ef4444' : '#10b981') + ' !important',
          'font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important',
          'font-size: 14px !important',
          'line-height: 1.5 !important',
          'box-sizing: border-box !important',
          'text-align: left !important'
        ].join(';');

        banner.innerHTML = [
          '<div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:8px;">',
          '  <div style="font-weight:800; font-size:15px; color:' + (isError ? '#f87171' : '#10b981') + ';">' + title + '</div>',
          '  <button id="btnDismissUmsBanner" style="background:transparent; border:none; color:#94a3b8; font-size:18px; line-height:1; cursor:pointer; padding:0 4px;">✕</button>',
          '</div>',
          '<div style="font-size:13px; color:#cbd5e1; margin-bottom:12px; line-height:1.45;">' + message + '</div>',
          actionHtml || ''
        ].join('');

        document.body.appendChild(banner);

        const dismissBtn = document.getElementById('btnDismissUmsBanner');
        if (dismissBtn) {
          dismissBtn.onclick = function () { banner.remove(); };
        }
        return banner;
      } catch (e) {
        return null;
      }
    }

    // 3. Domain verification
    const isSeuHost = window.location.hostname.includes('seu.edu.bd') || decodeURIComponent(window.location.href).includes('UMS - Southeast University');
    if (!isSeuHost) {
      showUmsBanner(
        '⚠️ সাউথইস্ট UMS পেজে যান',
        'এই বুকমার্কলেটটি কাজ করার জন্য আপনাকে প্রথমে সাউথইস্ট বিশ্ববিদ্যালয়ের UMS পোর্টালে লগইন করতে হবে। লগইন করার পর বুকমার্কটিতে ক্লিক করুন।',
        true,
        '<div style="display:flex; gap:8px; flex-wrap:wrap;">' +
        '  <a href="https://ums.seu.edu.bd/dashboard" target="_blank" style="background:#2563eb; color:#ffffff; padding:8px 14px; border-radius:8px; text-decoration:none; font-weight:700; font-size:13px; display:inline-block;">🌐 Open UMS (ums.seu.edu.bd)</a>' +
        '  <button onclick="document.getElementById(\'seu-routine-sync-banner\')?.remove()" style="background:#334155; color:#ffffff; border:none; padding:8px 12px; border-radius:8px; cursor:pointer; font-size:13px;">✕ Dismiss</button>' +
        '</div>'
      );
      return;
    }

    // 4. Client-side Local Canvas Image Reader (Zero Network Requests)
    function getElementBase64(imgEl, maxDim) {
      try {
        if (!imgEl) return '';
        maxDim = maxDim || 160;
        
        // If image already has a local base64 JPEG data url, reuse directly
        if (imgEl.src && imgEl.src.startsWith('data:image/jpeg;base64') && imgEl.src.length > 200) {
          return imgEl.src;
        }

        // Check computed background-image if src is empty or SVG placeholder
        let bgUrl = '';
        if ((!imgEl.src || imgEl.src.startsWith('data:image/svg')) && window.getComputedStyle) {
          const bg = window.getComputedStyle(imgEl).backgroundImage;
          const bgMatch = bg && bg.match(/url\(['"]?(data:image\/[^'"]+)['"]?\)/i);
          if (bgMatch && bgMatch[1].length > 200) {
            return bgMatch[1];
          }
        }

        const canvas = document.createElement('canvas');
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

    // 5. Non-Intrusive Tab Switcher (Gentle, Checks aria-selected before clicking)
    function findUmsTab(tabName) {
      try {
        const allTabs = Array.from(document.querySelectorAll('.mdc-tab, [role="tab"], .mat-mdc-tab, button, a'));
        return allTabs.find(el => {
          const txt = (el.innerText || '').trim().toLowerCase();
          return txt === tabName.toLowerCase() || txt.includes(tabName.toLowerCase());
        });
      } catch (e) {
        return null;
      }
    }

    function switchUmsTabSafely(tabName) {
      try {
        const tab = findUmsTab(tabName);
        if (!tab) return false;
        // Non-intrusive safety check: If tab is ALREADY active, DO NOT trigger synthetic click!
        const isAlreadyActive = tab.getAttribute('aria-selected') === 'true' || 
                                tab.classList.contains('mdc-tab--active') ||
                                tab.classList.contains('mat-mdc-tab-active');
        if (isAlreadyActive) {
          return true; // Already on desired tab!
        }
        tab.click();
        return true;
      } catch (e) {
        return false;
      }
    }

    // 6. Extraction Functions:
    // A) Extract Student Profile from "About" tab
    function extractStudentProfile() {
      try {
        const bodyText = document.body ? (document.body.innerText || '') : '';
        const allDivs = Array.from(document.querySelectorAll('div, td, th, span, p'));

        // Student Name
        let studentName = '';
        const nameEl = document.querySelector('.text-xl.font-semibold, h1.font-semibold, h2.font-semibold');
        if (nameEl && nameEl.innerText && !nameEl.innerText.toLowerCase().includes('adviser') && !nameEl.innerText.toLowerCase().includes('faculty') && !nameEl.innerText.toLowerCase().includes('dashboard') && !nameEl.innerText.toLowerCase().includes('basic information')) {
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

        // Student ID (16 digits)
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

        // Student Code (13 digits)
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
        const filterInfo = document.querySelector('.filter-info');
        if (filterInfo) {
          const divs = Array.from(filterInfo.querySelectorAll('div'));
          const candidate = divs.find(d => {
            const txt = (d.innerText || '').trim();
            return d.children.length === 0 && txt.length > 3 && !txt.toLowerCase().includes('faculty') && !txt.toLowerCase().includes('coordinator') && !txt.toLowerCase().includes('professor') && !txt.toLowerCase().includes('adviser');
          });
          if (candidate) advisorName = candidate.innerText.trim();
        }
        if (!advisorName) {
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
        }
        if (!advisorName) {
          const advMatch = bodyText.match(/Adviser[\s\S]*?Faculty[\s\S]*?([Dr\.]*[A-Za-z\s\.]+)\n/i) || bodyText.match(/(?:Advisor|Adviser)\s*[:\s]*([^\n]+)/i);
          if (advMatch) advisorName = advMatch[1].trim();
        }

        // Student Avatar Image
        let studentAvatar = '';
        const profileImgSelectors = [
          'img.w-24.h-24.rounded-full',
          'img[class*="rounded-full"][class*="w-24"]',
          'img[class*="rounded-full"][class*="border-primary"]',
          'img.w-20.h-20.rounded-full',
          'img.w-7.h-7.rounded-full',
          'img[src*="student"]',
          'img[src*="profile"]'
        ];
        for (const sel of profileImgSelectors) {
          const img = document.querySelector(sel);
          if (img) {
            const b64 = getElementBase64(img, 180);
            if (b64 && b64.length > 200) {
              studentAvatar = b64;
              break;
            }
          }
        }

        return {
          name: studentName,
          studentId: studentId,
          code: studentCode,
          batch: batch,
          program: program,
          advisor: { name: advisorName },
          avatar: studentAvatar
        };
      } catch (e) {
        return { name: '', studentId: '', code: '', batch: '42', program: 'BSc in EEE', advisor: { name: '' }, avatar: '' };
      }
    }

    // B) Extract Routine Courses and Teachers' Photos from "Registered Courses" tab
    function extractCoursesAndTeachers() {
      const courses = [];
      const courseRegex = /^[ \t]*([A-Z]{3,5}\s*\d{3,4}(?:\.\d+)?)[ \t]*$/i;

      try {
        // Primary strategy: Row-by-Row DOM extraction
        const rowContainers = Array.from(document.querySelectorAll('.student-count.grid, div[class*="student-count"], tr[class*="course"], [class*="mat-row"]'));
        
        if (rowContainers.length > 0) {
          rowContainers.forEach(row => {
            // Skip header row if present
            if (row.classList.contains('mat-sort') || (row.innerText.includes('Course') && row.innerText.includes('Faculty') && row.innerText.includes('Schedule'))) {
              return;
            }

            const rowText = row.innerText || '';
            const match = rowText.match(/([A-Z]{3,5}\s*\d{3,4}(?:\.\d+)?)/i);
            if (!match) return;

            const rawCode = match[1].replace(/\s+/g, '').toUpperCase();
            const parts = rawCode.split('.');
            const code = parts[0];
            const sec = parts[1] || '1';

            // Title
            let title = '';
            const titleEl = row.querySelector('.text-sm.text-gray-500, [class*="text-gray-500"], .course-title');
            if (titleEl) {
              title = titleEl.innerText.trim();
            }

            // Faculty Initials & Name
            let facInitials = '';
            let facName = '';
            const facMatch = rowText.match(/\[([A-Z]+)\]\s*([^@\n<]+)/i);
            if (facMatch) {
              facInitials = facMatch[1].toUpperCase();
              facName = facMatch[2].trim();
            }

            // Faculty Email
            let facEmail = '';
            const emailEl = row.querySelector('a[href^="mailto:"]');
            if (emailEl) {
              facEmail = emailEl.getAttribute('href').replace('mailto:', '').trim();
            } else {
              const mailMatch = rowText.match(/([\w\.-]+@[\w\.-]+\.\w+)/i);
              if (mailMatch) facEmail = mailMatch[1].trim();
            }

            // Faculty Avatar Image directly inside this specific row!
            let facAvatar = '';
            const facImg = row.querySelector('img[alt="User avatar"], img[class*="rounded-full"], img');
            if (facImg) {
              const b64 = getElementBase64(facImg, 120);
              if (b64 && b64.length > 200 && !b64.includes('svg+xml')) {
                facAvatar = b64;
              }
            }

            // Schedules
            const schedules = [];
            const schedMatches = rowText.matchAll(/(SUN|MON|TUE|WED|THU|FRI|SAT)\s*#?\s*(\d{1,2}:\d{2})\s*[-~–]\s*(\d{1,2}:\d{2})(?:\s*@\s*([A-Za-z0-9\-]+))?/gi);
            for (const sm of schedMatches) {
              schedules.push({
                day: sm[1].toUpperCase(),
                startTime: sm[2],
                endTime: sm[3],
                room: (sm[4] || 'TBA').toUpperCase(),
                campus: 'Permanent Campus (PC)'
              });
            }

            courses.push({
              codeWithSec: rawCode,
              code: code,
              section: sec,
              title: title,
              credits: code.includes('LAB') || rawCode.endsWith('.2') ? 1.5 : 3.0,
              type: code.includes('LAB') || rawCode.endsWith('.2') ? 'Lab' : 'Theory',
              faculty: {
                initials: facInitials,
                name: facName,
                email: facEmail,
                avatar: facAvatar
              },
              schedules: schedules
            });
          });
        }

        // Secondary fallback strategy: Text-based line parsing if rowContainers query found 0
        if (courses.length === 0) {
          const bodyText = document.body ? (document.body.innerText || '') : '';
          const lines = bodyText.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
          let curCourse = null;

          for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const match = line.match(courseRegex);

            if (match && !line.startsWith('PC') && !line.startsWith('ROOM') && !line.startsWith('SEC')) {
              if (curCourse) courses.push(curCourse);
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

            const facMatch = line.match(/\[([A-Z]+)\]\s*([^@\n]+)/i);
            if (facMatch) {
              curCourse.faculty.initials = facMatch[1].toUpperCase();
              curCourse.faculty.name = facMatch[2].trim();
              continue;
            }

            const emailMatch = line.match(/([\w\.-]+@[\w\.-]+\.\w+)/i);
            if (emailMatch) {
              curCourse.faculty.email = emailMatch[1].trim();
              continue;
            }

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

            if (!curCourse.title && !line.includes('@') && !line.includes('#') && !line.startsWith('[')) {
              curCourse.title = line;
            }
          }
          if (curCourse) courses.push(curCourse);
        }
      } catch (e) {}

      return courses;
    }

    // 7. Main Orchestrator: Smart Non-Intrusive 2-Tab Extraction Workflow
    async function runSmartSync() {
      // Show progress notice
      showUmsBanner(
        '🔄 SEU Sync: ডেটা রিড করা হচ্ছে...',
        'সাউথইস্ট UMS থেকে আপনার রুটিন, প্রোফাইল ও শিক্ষকদের ছবি নিরাপদভাবে রিড করা হচ্ছে। দয়া করে ১ সেকেন্ড অপেক্ষা করুন...',
        false,
        ''
      );

      // Check cache in sessionStorage for partial data from prior tab run
      let cachedData = {};
      try {
        const raw = sessionStorage.getItem('seu_sync_cache');
        if (raw) cachedData = JSON.parse(raw);
      } catch (e) {}

      let currentProfile = extractStudentProfile();
      let currentCourses = extractCoursesAndTeachers();

      // Check where we are:
      // If we are currently on "About" tab (has profile name/ID but 0 courses)
      if (currentCourses.length === 0 && (currentProfile.name || currentProfile.studentId)) {
        // Save current profile to cache
        cachedData.student = currentProfile;
        try { sessionStorage.setItem('seu_sync_cache', JSON.stringify(cachedData)); } catch(e) {}

        // Gentle Human Delay Tab Switch to "Registered Courses"
        const switched = switchUmsTabSafely('Registered Courses');
        if (switched) {
          await new Promise(res => setTimeout(res, 850));
          currentCourses = extractCoursesAndTeachers();
        }
      }
      // If we are currently on "Registered Courses" tab (has courses but missing detailed student profile)
      else if (currentCourses.length > 0 && (!currentProfile.studentId || !currentProfile.code || !currentProfile.avatar)) {
        // Save courses to cache
        cachedData.courses = currentCourses;
        try { sessionStorage.setItem('seu_sync_cache', JSON.stringify(cachedData)); } catch(e) {}

        // Gentle Human Delay Tab Switch to "About"
        const switched = switchUmsTabSafely('About');
        if (switched) {
          await new Promise(res => setTimeout(res, 850));
          const freshProfile = extractStudentProfile();
          if (freshProfile.name || freshProfile.studentId) {
            currentProfile = freshProfile;
          }
          // Switch back to "Registered Courses"
          switchUmsTabSafely('Registered Courses');
          await new Promise(res => setTimeout(res, 400));
        }
      }

      // Merge with cache if any fields are still missing
      if (cachedData.student) {
        currentProfile.name = currentProfile.name || cachedData.student.name;
        currentProfile.studentId = currentProfile.studentId || cachedData.student.studentId;
        currentProfile.code = currentProfile.code || cachedData.student.code;
        currentProfile.batch = currentProfile.batch || cachedData.student.batch;
        currentProfile.program = currentProfile.program || cachedData.student.program;
        currentProfile.advisor = (currentProfile.advisor && currentProfile.advisor.name) ? currentProfile.advisor : cachedData.student.advisor;
        currentProfile.avatar = currentProfile.avatar || cachedData.student.avatar;
      }
      if (cachedData.courses && currentCourses.length === 0) {
        currentCourses = cachedData.courses;
      }

      // If courses still 0, provide friendly guidance
      if (currentCourses.length === 0) {
        showUmsBanner(
          '⚠️ কোনো রেজিস্টার্ড কোর্স পাওয়া যায়নি!',
          'আপনার প্রোফাইল তথ্য পাওয়া গেছে, কিন্তু রুটিনের কোর্সগুলো পাওয়া যায়নি।<br><br>👉 দয়া করে UMS মেন্যু থেকে <strong>"Registered Courses"</strong> ট্যাবে যান এবং আরেকবার এই বুকমার্কে ক্লিক করুন।',
          true,
          '<div style="display:flex; gap:8px; flex-wrap:wrap;">' +
          '  <a href="https://ums.seu.edu.bd/dashboard" style="background:#2563eb; color:#ffffff; padding:8px 14px; border-radius:8px; font-weight:700; text-decoration:none; display:inline-block; font-size:13px;">🔄 Open UMS Dashboard</a>' +
          '  <button onclick="document.getElementById(\'seu-routine-sync-banner\')?.remove()" style="background:#334155; color:#ffffff; border:none; padding:8px 12px; border-radius:8px; cursor:pointer; font-size:13px;">✕ Dismiss</button>' +
          '</div>'
        );
        return;
      }

      // Count teachers with photos
      const teachersWithPhotos = currentCourses.filter(c => c.faculty && c.faculty.avatar && c.faculty.avatar.length > 200).length;

      const syncPayload = {
        student: {
          name: currentProfile.name || 'Student Name',
          studentId: currentProfile.studentId || '',
          code: currentProfile.code || '',
          program: currentProfile.program || 'BSc in EEE',
          batch: currentProfile.batch || '42',
          advisor: currentProfile.advisor || { name: '' },
          avatar: currentProfile.avatar || ''
        },
        activeSemester: 'Fall 2026',
        courses: currentCourses
      };

      const payloadEncoded = encodeURIComponent(JSON.stringify(syncPayload));
      const publicUrl = window.location.origin.includes('localhost')
        ? 'http://localhost:8080/index.html'
        : (window.location.protocol === 'file:' ? 'file:///D:/rutine/index.html' : 'https://fahimshahir.github.io/seu-routine/');
      const syncFullUrl = publicUrl + '#sync=' + payloadEncoded;

      // Build Success Banner UI with avatar preview thumbnail
      const avatarThumbnailHtml = currentProfile.avatar
        ? '<img src="' + currentProfile.avatar + '" alt="Student Photo" style="width:44px; height:44px; border-radius:50%; object-fit:cover; border:2px solid #10b981; flex-shrink:0;">'
        : '<div style="width:44px; height:44px; border-radius:50%; background:#3b82f6; color:#fff; display:flex; align-items:center; justify-content:center; font-weight:800; font-size:14px; flex-shrink:0;">' + ((currentProfile.name || 'ST').substring(0, 2).toUpperCase()) + '</div>';

      const actionHtml = [
        '<div style="display:flex; flex-wrap:wrap; gap:8px; margin-top:12px;">',
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

      const successMessage = [
        '<div style="display:flex; align-items:center; gap:12px; margin-bottom:10px;">',
        '  ' + avatarThumbnailHtml,
        '  <div>',
        '    <div style="font-weight:700; color:#f8fafc; font-size:14px;">' + (currentProfile.name || 'Student Name') + '</div>',
        '    <div style="font-size:12px; color:#94a3b8;">ID: ' + (currentProfile.studentId || '—') + ' | Batch: ' + (currentProfile.batch || '—') + ' | ' + (currentProfile.program || 'BSc in EEE') + '</div>',
        '  </div>',
        '</div>',
        '<div style="font-size:13px; color:#cbd5e1; line-height:1.45;">',
        '  ✅ <strong>' + currentCourses.length + 'টি কোর্স</strong> এবং <strong>' + teachersWithPhotos + ' জন শিক্ষকের ছবি</strong> সফলভাবে সংগৃহীত হয়েছে!',
        '</div>'
      ].join('');

      const banner = showUmsBanner(
        '🎉 SEU Routine & Full Profile Extracted!',
        successMessage,
        false,
        actionHtml
      );

      // Clean up session cache on user action
      function cleanCache() {
        try { sessionStorage.removeItem('seu_sync_cache'); } catch (e) {}
      }

      const btnOpen = document.getElementById('btnOpenRoutineApp');
      if (btnOpen) {
        btnOpen.onclick = function () {
          cleanCache();
          window.open(syncFullUrl, '_blank');
          if (banner) banner.remove();
        };
      }

      const btnCopy = document.getElementById('btnCopySyncLink');
      if (btnCopy) {
        btnCopy.onclick = function () {
          cleanCache();
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
          cleanCache();
          const blob = new Blob([JSON.stringify(syncPayload, null, 2)], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'SEU_Routine_' + (currentProfile.name || 'Student').replace(/\s+/g, '_') + '.json';
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          if (banner) banner.remove();
        };
      }
    }

    // Launch smart sync
    runSmartSync();

  } catch (err) {
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
        '<div style="font-weight:800; font-size:15px; color:#f87171; margin-bottom:6px;">⚠️ Bookmarklet Notice</div>',
        '<div style="color:#cbd5e1; margin-bottom:10px; line-height:1.4;">' + (err && err.message ? err.message : String(err)) + '</div>',
        '<button onclick="this.parentElement.remove()" style="background:#334155; color:#fff; border:none; padding:6px 12px; border-radius:6px; cursor:pointer; font-size:12px;">✕ Dismiss</button>'
      ].join('');
      document.body.appendChild(errBanner);
    } catch (e) {}
  } finally {
    // Release mutex safely after a calm buffer
    setTimeout(function () {
      try {
        window.__SEU_ROUTINE_SYNC_RUNNING__ = false;
      } catch (e) {}
    }, 1500);
  }
})();
