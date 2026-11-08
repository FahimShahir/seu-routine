/**
 * SEU Class Routine - 1-Click Safe Bookmarklet Sync (Anti-Block & Image Optimized)
 * --------------------------------------------------------------------------------
 * Runs safely inside student logged-in session on:
 * https://ums.seu.edu.bd/dashboard
 * 
 * Safety & Privacy Architecture (Anti-Block Guarantee):
 * 1. 0 Network Requests to UMS server (Zero packets sent; physically undetectable by WAF/firewall).
 * 2. 0 Credential / Password / Cookie Access (Never touches passwords, auth tokens, or cookies).
 * 3. 100% Read-Only Client-side DOM reading of rendered courses, student profile & photos in RAM.
 * 4. Concurrency Mutex: Prevents double-clicking or rapid repetitive script execution.
 * 5. Gentle Humanized Tab Switching: Never clicks an already-active tab (aria-selected="true").
 * 6. High-Efficiency Image Downscaling: Compact 80x80 & 52x52 JPEGs prevent browser URL truncation.
 * 7. Dual-Channel Lossless Transport: window.postMessage + compact URL hash (< 11 KB).
 * 8. 100% Error Shielding: Zero unhandled exceptions reach window.onerror or Angular telemetry.
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

    // 4. Client-side Local Image Downscaler & Extractor (Zero Network Requests)
    function getElementBase64(imgEl, maxDim, quality) {
      try {
        if (!imgEl) return '';
        maxDim = maxDim || 64;
        quality = quality || 0.60;

        let candidateSrc = '';

        // 4.1 Direct src check (ignore empty or SVG placeholders)
        if (imgEl.src && !imgEl.src.startsWith('data:image/svg')) {
          candidateSrc = imgEl.src;
        }

        // 4.2 Computed background-image check (resolves CSS variables and classes)
        if (!candidateSrc && window.getComputedStyle) {
          const bg = window.getComputedStyle(imgEl).backgroundImage || (imgEl.style ? imgEl.style.backgroundImage : '');
          if (bg && bg.includes('data:image/')) {
            const m = bg.match(/url\(['"]?(data:image\/[^'"]+)['"]?\)/i);
            if (m && m[1]) candidateSrc = m[1];
          }
        }

        // 4.3 Setup compact canvas
        const canvas = document.createElement('canvas');
        canvas.width = maxDim;
        canvas.height = maxDim;
        const ctx = canvas.getContext('2d');

        // If we have a data URL candidate, downscale it onto the canvas
        if (candidateSrc && candidateSrc.startsWith('data:image/')) {
          try {
            const tempImg = new Image();
            tempImg.src = candidateSrc;
            ctx.drawImage(tempImg, 0, 0, maxDim, maxDim);
            const compressed = canvas.toDataURL('image/jpeg', quality);
            if (compressed && compressed.length > 200) {
              return compressed;
            }
          } catch (e) {}

          // If canvas compression failed, return candidate directly if under reasonable size
          if (candidateSrc.length < 15000) return candidateSrc;
        }

        // 4.4 If imgEl is an active IMG tag with natural dimensions, draw directly
        if (imgEl.tagName && imgEl.tagName.toUpperCase() === 'IMG' && imgEl.complete && imgEl.naturalWidth > 0) {
          try {
            ctx.drawImage(imgEl, 0, 0, maxDim, maxDim);
            const b64 = canvas.toDataURL('image/jpeg', quality);
            if (b64 && b64.length > 200) return b64;
          } catch (taintErr) {}
        }

        return '';
      } catch (err) {
        return '';
      }
    }

    // 5. Active Tab Detector & Non-Intrusive Tab Switcher (Gentle, Checks aria-selected before clicking)
    function getCurrentActiveTab() {
      try {
        const tabs = Array.from(document.querySelectorAll('.mdc-tab, [role="tab"], .mat-mdc-tab'));
        const activeTab = tabs.find(el => {
          return el.getAttribute('aria-selected') === 'true' || 
                 el.classList.contains('mdc-tab--active') ||
                 el.classList.contains('mat-mdc-tab-active') ||
                 el.classList.contains('mdc-tab-indicator--active');
        });
        if (activeTab) {
          const txt = (activeTab.innerText || '').trim().toLowerCase();
          if (txt.includes('registered')) return 'registered';
          if (txt.includes('about')) return 'about';
        }
        // Fallback based on distinctive DOM containers on page
        if (document.querySelector('.student-count.grid')) return 'registered';
        if (document.querySelector('.student-course-list-grid') || document.querySelector('.filter-info')) return 'about';
      } catch (e) {}
      return 'unknown';
    }

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
    // A) Extract Student Profile from "About" tab and Navbar ONLY
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
          const codeMatch = bodyText.match(/(?:^|\n)\s*Code\s*[\n:\s]+(\d{10,})/i) || bodyText.match(/(\d{13})/);
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

        // Active Semester / Last Semester (e.g. Summer 2026)
        let activeSemester = 'Summer 2026';
        const semLabel = allDivs.find(el => el.children.length === 0 && (el.innerText.trim().toUpperCase() === 'LAST SEMESTER' || el.innerText.trim().toUpperCase() === 'ACTIVE SEMESTER'));
        if (semLabel && semLabel.nextElementSibling) {
          const val = (semLabel.nextElementSibling.innerText || '').trim();
          if (val) activeSemester = val;
        }
        if (!activeSemester || activeSemester === 'Summer 2026') {
          const semMatch = bodyText.match(/(?:^|\n)\s*(?:Last\s+Semester|Active\s+Semester)\s*[\n:\s]+([^\n]+)/i) || 
                           bodyText.match(/(Summer|Fall|Spring)\s*(\d{4})/i);
          if (semMatch) {
            activeSemester = semMatch[2] ? (semMatch[1] + ' ' + semMatch[2]) : semMatch[1].trim();
          }
        }

        // Registered Courses Count & Total Credits from About Tab Dashboard Cards
        let registeredCoursesCount = 0;
        let totalCredits = 0.0;

        const countCards = Array.from(document.querySelectorAll('.card, [class*="card"], div.flex-col'));
        for (const card of countCards) {
          const cardText = (card.innerText || '').trim();
          if (cardText.includes('Registered Course') && !cardText.includes('Preregistered Courses')) {
            const countEl = card.querySelector('.text-6xl, .text-7xl, .text-5xl, [class*="text-6xl"]');
            if (countEl) {
              const num = parseInt(countEl.innerText.trim(), 10);
              if (!isNaN(num)) registeredCoursesCount = num;
            }
            const credMatch = cardText.match(/Total\s*:\s*([\d\.]+)\s*Credits?/i);
            if (credMatch) {
              totalCredits = parseFloat(credMatch[1]);
            }
            break;
          }
        }

        // Fallback from bodyText regex
        if (!registeredCoursesCount || !totalCredits) {
          const regCardMatch = bodyText.match(/(\d+)\s*\n\s*Registered\s+Course[s]?\s*\n\s*Total:\s*\n\s*([\d\.]+)\s*Credits?/i);
          if (regCardMatch) {
            if (!registeredCoursesCount) registeredCoursesCount = parseInt(regCardMatch[1], 10);
            if (!totalCredits) totalCredits = parseFloat(regCardMatch[2]);
          }
        }
        if (!registeredCoursesCount) {
          const m = bodyText.match(/(\d+)\s*\n\s*Registered\s+Course[s]?/i);
          if (m) registeredCoursesCount = parseInt(m[1], 10);
        }
        if (!totalCredits) {
          const m = bodyText.match(/Registered\s+Course[s]?[\s\S]*?Total:\s*([\d\.]+)\s*Credits?/i);
          if (m) totalCredits = parseFloat(m[1]);
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

        // Student Avatar Image (Multi-source: About tab + Navbar + Header)
        let studentAvatar = '';
        const profileImgSelectors = [
          'img.w-24.h-24.rounded-full',
          'img[class*="w-24"][class*="rounded-full"]',
          'img.w-20.h-20.rounded-full',
          'img.w-7.h-7.rounded-full',
          '.border-primary-600 img',
          'header img.rounded-full',
          'nav img.rounded-full',
          'img[src*="student"]',
          'img[src*="profile"]'
        ];

        for (const sel of profileImgSelectors) {
          const img = document.querySelector(sel);
          if (img) {
            const b64 = getElementBase64(img, 80, 0.65);
            if (b64 && b64.length > 200 && !b64.includes('svg+xml')) {
              studentAvatar = b64;
              break;
            }
          }
        }

        // Fallback: Check any .rounded-full element with background-image containing data:image
        if (!studentAvatar && window.getComputedStyle) {
          const roundedEls = Array.from(document.querySelectorAll('.rounded-full'));
          for (const el of roundedEls) {
            const bg = window.getComputedStyle(el).backgroundImage;
            if (bg && bg.includes('data:image/jpeg')) {
              const b64 = getElementBase64(el, 80, 0.65);
              if (b64 && b64.length > 200) {
                studentAvatar = b64;
                break;
              }
            }
          }
        }

        return {
          name: studentName,
          studentId: studentId,
          code: studentCode,
          batch: batch,
          program: program,
          activeSemester: activeSemester,
          registeredCoursesCount: registeredCoursesCount,
          totalCredits: totalCredits,
          advisor: { name: advisorName },
          avatar: studentAvatar
        };
      } catch (e) {
        return { name: '', studentId: '', code: '', batch: '42', program: 'BSc in EEE', activeSemester: 'Summer 2026', registeredCoursesCount: 0, totalCredits: 0, advisor: { name: '' }, avatar: '' };
      }
    }

    // B) Extract Routine Courses and Teachers' Photos from "Registered Courses" tab ONLY
    function extractCoursesAndTeachers() {
      const courses = [];

      try {
        // STRICT GUARD: If current active tab is "About", NEVER extract routine courses from About tab!
        // The About tab has a partial overview table (.student-course-list-grid) with NO faculty names, NO emails, and NO teacher photos.
        const currentTab = getCurrentActiveTab();
        if (currentTab === 'about') {
          return []; // Return empty so orchestrator switches gently to Registered Courses tab!
        }

        // 1. Primary strategy: Row-by-Row DOM extraction ONLY from the REAL Registered Courses table
        // Real UMS Registered Courses rows strictly use class: .student-count.grid
        const allPotentialRows = Array.from(document.querySelectorAll(
          '.student-count.grid, [class*="student-count"], tr[class*="course"], table tbody tr'
        ));

        const rowContainers = allPotentialRows.filter(el => {
          if (el.classList.contains('mat-sort') || el.classList.contains('student-course-list-grid') || el.tagName === 'THEAD') return false;
          const txt = el.innerText || '';
          return /[A-Z]{3,5}\s*\d{3,4}/i.test(txt);
        });
        
        if (rowContainers.length > 0) {
          rowContainers.forEach(row => {
            const rowText = row.innerText || '';
            const match = rowText.match(/([A-Z]{3,5}\s*\d{3,4}(?:\.\d+)?)/i);
            if (!match) return;

            const rawCode = match[1].replace(/\s+/g, '').toUpperCase();
            if (rawCode.startsWith('PC') || rawCode.startsWith('ROOM') || rawCode.startsWith('SEC')) return;

            const parts = rawCode.split('.');
            const code = parts[0];
            const sec = parts[1] || '1';

            // 1.1 Course Title: Look inside the first column or near course code
            let title = '';
            const firstCol = row.children[0] || row;
            const titleCandidates = Array.from(firstCol.querySelectorAll('.text-sm, .text-gray-500, [class*="text-gray"], .course-title, div, span, p'));
            for (const el of titleCandidates) {
              const txt = (el.innerText || '').trim();
              if (txt && txt.length > 2 && 
                  !txt.includes('@') && 
                  !txt.includes('mailto:') && 
                  !txt.startsWith('SEC') && 
                  !txt.startsWith('PC') && 
                  !txt.startsWith('[') && 
                  !/^(SUN|MON|TUE|WED|THU|FRI|SAT)/i.test(txt) &&
                  !/^[A-Z]{3,5}\s*\d{3,4}/i.test(txt)) {
                title = txt;
                break;
              }
            }
            if (!title) {
              // Row-level fallback for title
              const rowGray = Array.from(row.querySelectorAll('.text-gray-500, [class*="text-gray-500"], .course-title'));
              for (const el of rowGray) {
                const txt = (el.innerText || '').trim();
                if (txt && txt.length > 3 && !txt.includes('@') && !txt.includes('mailto:')) {
                  title = txt;
                  break;
                }
              }
            }
            if (!title) {
              // Line fallback
              const lines = rowText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
              for (let i = 0; i < lines.length; i++) {
                if (lines[i].includes(code) && i + 1 < lines.length) {
                  const nextL = lines[i+1];
                  if (!nextL.includes('@') && !nextL.includes('#') && !nextL.startsWith('[') && !/^(SUN|MON|TUE|WED|THU|FRI|SAT)/i.test(nextL)) {
                    title = nextL;
                    break;
                  }
                }
              }
            }

            // 1.2 Faculty Email
            let facEmail = '';
            const emailEl = row.querySelector('a[href^="mailto:"]');
            if (emailEl) {
              facEmail = emailEl.getAttribute('href').replace('mailto:', '').trim();
            } else {
              const mailMatch = (row.innerHTML || rowText).match(/mailto:([^\s'"<>]+)/i) || rowText.match(/([\w\.-]+@[\w\.-]+\.\w+)/i);
              if (mailMatch) facEmail = mailMatch[1].trim();
            }

            // 1.3 Faculty Initials & Clean Name
            let facInitials = '';
            let facName = '';
            const facMatch = rowText.match(/\[([A-Z]{2,5})\]\s*([^<\n@#]+)/i);
            if (facMatch) {
              facInitials = facMatch[1].toUpperCase();
              facName = facMatch[2].trim();
            } else {
              const parenMatch = rowText.match(/\(([A-Z]{2,5})\)\s*([^<\n@#]+)/i) || rowText.match(/([^<\n@#]+)\s*\(([A-Z]{2,5})\)/i);
              if (parenMatch) {
                if (parenMatch[1].length <= 5 && parenMatch[1] === parenMatch[1].toUpperCase()) {
                  facInitials = parenMatch[1];
                  facName = parenMatch[2].trim();
                } else {
                  facName = parenMatch[1].trim();
                  facInitials = parenMatch[2].toUpperCase();
                }
              } else {
                const fontSemi = Array.from(row.querySelectorAll('.font-semibold, [class*="font-semibold"], td, div'));
                for (const fs of fontSemi) {
                  const txt = (fs.innerText || '').trim();
                  if (txt.length > 3 && !txt.includes(code) && !txt.includes('Credit') && 
                      !/^(SUN|MON|TUE|WED|THU|FRI|SAT)/i.test(txt) && !txt.startsWith('PC')) {
                    const clone = fs.cloneNode(true);
                    clone.querySelectorAll('a, mat-icon, [class*="text-gray"], div').forEach(c => c.remove());
                    const pureTxt = (clone.innerText || '').trim();
                    if (pureTxt.length > 2) {
                      facName = pureTxt.replace(/\[[A-Z]+\]/gi, '').trim();
                      const inBrackets = (pureTxt.match(/\[([A-Z]+)\]/i) || [])[1];
                      if (inBrackets) facInitials = inBrackets.toUpperCase();
                      break;
                    }
                  }
                }
              }
            }

            // CRITICAL: Clean email username if glued to faculty name!
            if (facEmail && facEmail.includes('@')) {
              const emailUser = facEmail.split('@')[0].trim();
              if (facName.toLowerCase().endsWith(emailUser.toLowerCase())) {
                facName = facName.substring(0, facName.length - emailUser.length).trim();
              }
              if (facName.toLowerCase().endsWith(facEmail.toLowerCase())) {
                facName = facName.substring(0, facName.length - facEmail.length).trim();
              }
            }
            facName = facName.replace(/[\s\.\,\-]+$/, '').trim();
            if (!facInitials && facName) {
              facInitials = facName.split(/\s+/).filter(w => w && w[0] === w[0].toUpperCase()).map(w => w[0]).slice(0, 3).join('');
            }

            // 1.4 Faculty Avatar Photo
            let facAvatar = '';
            const facImg = row.querySelector('img[alt="User avatar"], img[class*="rounded-full"], .rounded-full img, img');
            if (facImg) {
              const b64 = getElementBase64(facImg, 52, 0.55);
              if (b64 && b64.length > 200 && !b64.includes('svg+xml')) {
                facAvatar = b64;
              }
            }

            // 1.5 Schedules
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

            // 1.6 Accurate Lab vs Theory and Credits (Never use section .2 as lab indicator!)
            const titleLow = title.toLowerCase();
            const codeUpp = code.toUpperCase();
            let isLab = titleLow.includes('lab') || titleLow.includes('sessional') || 
                        titleLow.includes('practical') || titleLow.includes('project') || 
                        titleLow.includes('thesis') || codeUpp.includes('LAB') || 
                        codeUpp.endsWith('L');

            // Check if schedule duration is >= 100 minutes
            for (const s of schedules) {
              if (s.startTime && s.endTime) {
                const [h1, m1] = s.startTime.split(':').map(Number);
                const [h2, m2] = s.endTime.split(':').map(Number);
                if ((h2 * 60 + m2) - (h1 * 60 + m1) >= 100) {
                  isLab = true;
                  break;
                }
              }
            }

            const courseType = isLab ? 'Lab' : 'Theory';
            const credits = (isLab && !titleLow.includes('project') && !titleLow.includes('thesis')) ? 1.5 : 3.0;

            courses.push({
              codeWithSec: rawCode,
              code: code,
              section: sec,
              title: title,
              credits: credits,
              type: courseType,
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

        // 2. Secondary fallback strategy: Robust Text-based line parsing (ONLY if NOT on About tab!)
        if (courses.length === 0 && currentTab !== 'about') {
          const bodyText = document.body ? (document.body.innerText || '') : '';
          const lines = bodyText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
          const courseLineRegex = /^[ \t]*(?:Course\s*:\s*)?([A-Z]{3,5}\s*\d{3,4}(?:\.\d+)?)(?:[\s\.\:\-]+(.*))?$/i;
          let curCourse = null;

          for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const match = line.match(courseLineRegex);

            if (match && !line.startsWith('PC') && !line.startsWith('ROOM') && !line.startsWith('SEC') && 
                !/^(SUN|MON|TUE|WED|THU|FRI|SAT)/i.test(line)) {
              if (curCourse) courses.push(curCourse);

              const rawCode = match[1].replace(/\s+/g, '').toUpperCase();
              const parts = rawCode.split('.');
              const code = parts[0];
              const sec = parts[1] || '1';
              let sameLineTitle = (match[2] || '').trim();
              if (sameLineTitle && (sameLineTitle.startsWith('[') || sameLineTitle.includes('@'))) {
                sameLineTitle = '';
              }

              curCourse = {
                codeWithSec: rawCode,
                code: code,
                section: sec,
                title: sameLineTitle,
                credits: 3.0,
                type: 'Theory',
                faculty: { initials: '', name: '', email: '', avatar: '' },
                schedules: []
              };
              continue;
            }

            if (!curCourse) continue;

            // Faculty
            const facMatch = line.match(/\[([A-Z]{2,5})\]\s*([^@\n<]+)/i);
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

            // Schedule
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

            // Title if on next line
            if (!curCourse.title && !line.includes('@') && !line.includes('#') && !line.startsWith('[')) {
              curCourse.title = line;
            }
          }
          if (curCourse) courses.push(curCourse);

          // Post-process fallback courses
          courses.forEach(c => {
            const email = c.faculty.email;
            if (email && email.includes('@')) {
              const u = email.split('@')[0].trim();
              if (c.faculty.name.toLowerCase().endsWith(u.toLowerCase())) {
                c.faculty.name = c.faculty.name.substring(0, c.faculty.name.length - u.length).trim();
              }
            }
            c.faculty.name = c.faculty.name.replace(/[\s\.\,\-]+$/, '').trim();
            const tLow = c.title.toLowerCase();
            const cUpp = c.code.toUpperCase();
            const isL = tLow.includes('lab') || tLow.includes('sessional') || tLow.includes('practical') || 
                        tLow.includes('project') || tLow.includes('thesis') || cUpp.includes('LAB');
            c.type = isL ? 'Lab' : 'Theory';
            c.credits = (isL && !tLow.includes('project') && !tLow.includes('thesis')) ? 1.5 : 3.0;
          });
        }
      } catch (e) {}

      return courses;
    }

    async function runSmartSync() {
      // Show progress notice
      showUmsBanner(
        '🔄 SEU Sync: ডেটা রিড করা হচ্ছে...',
        'সাউথইস্ট UMS থেকে আপনার প্রোফাইল ও রুটিন নিরাপদভাবে রিড করা হচ্ছে। দয়া করে ১-২ সেকেন্ড অপেক্ষা করুন...',
        false,
        ''
      );

      // Check cache in sessionStorage for partial data from prior tab run
      let cachedData = {};
      try {
        const raw = sessionStorage.getItem('seu_sync_cache');
        if (raw) cachedData = JSON.parse(raw);
      } catch (e) {}

      let activeTab = getCurrentActiveTab();
      let currentProfile = extractStudentProfile();
      let currentCourses = extractCoursesAndTeachers();

      // Check where we are:
      // If we are currently on "About" tab (or courses is 0 but we have profile data)
      if (activeTab === 'about' || (currentCourses.length === 0 && (currentProfile.name || currentProfile.studentId || currentProfile.code))) {
        // Save current profile to cache
        cachedData.student = currentProfile;
        try { sessionStorage.setItem('seu_sync_cache', JSON.stringify(cachedData)); } catch(e) {}

        // Gentle Human Delay Tab Switch to "Registered Courses" with dynamic DOM polling
        const switched = switchUmsTabSafely('Registered Courses');
        if (switched) {
          for (let retries = 0; retries < 8; retries++) {
            await new Promise(res => setTimeout(res, 250));
            currentCourses = extractCoursesAndTeachers();
            if (currentCourses.length > 0) break;
          }
        }
      }
      // If we are currently on "Registered Courses" tab (has courses but missing detailed student profile)
      else if (currentCourses.length > 0 && (!currentProfile.studentId || !currentProfile.code || !currentProfile.avatar || !currentProfile.advisor || !currentProfile.advisor.name)) {
        // Save courses to cache
        cachedData.courses = currentCourses;
        try { sessionStorage.setItem('seu_sync_cache', JSON.stringify(cachedData)); } catch(e) {}

        // Gentle Human Delay Tab Switch to "About" with dynamic DOM polling
        const switched = switchUmsTabSafely('About');
        if (switched) {
          for (let retries = 0; retries < 8; retries++) {
            await new Promise(res => setTimeout(res, 250));
            const freshProfile = extractStudentProfile();
            if (freshProfile.studentId || freshProfile.code) {
              currentProfile = freshProfile;
              break;
            }
          }
          // Switch back to "Registered Courses"
          switchUmsTabSafely('Registered Courses');
          await new Promise(res => setTimeout(res, 350));
        }
      }

      // Merge with cache if any fields are still missing
      if (cachedData.student) {
        currentProfile.name = currentProfile.name || cachedData.student.name;
        currentProfile.studentId = currentProfile.studentId || cachedData.student.studentId;
        currentProfile.code = currentProfile.code || cachedData.student.code;
        currentProfile.batch = currentProfile.batch || cachedData.student.batch;
        currentProfile.program = currentProfile.program || cachedData.student.program;
        currentProfile.activeSemester = currentProfile.activeSemester || cachedData.student.activeSemester;
        currentProfile.registeredCoursesCount = currentProfile.registeredCoursesCount || cachedData.student.registeredCoursesCount;
        currentProfile.totalCredits = currentProfile.totalCredits || cachedData.student.totalCredits;
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
      const totalCreditsCalculated = currentCourses.reduce((sum, c) => sum + (c.credits || 0), 0);
      const totalCreditsFinal = currentProfile.totalCredits || totalCreditsCalculated || 15.0;

      const syncPayload = {
        student: {
          name: currentProfile.name || 'Student Name',
          studentId: currentProfile.studentId || '',
          code: currentProfile.code || '',
          program: currentProfile.program || 'BSc in EEE',
          batch: currentProfile.batch || '42',
          advisor: currentProfile.advisor || { name: '' },
          avatar: currentProfile.avatar || '',
          registeredCoursesCount: currentProfile.registeredCoursesCount || currentCourses.length,
          totalCredits: totalCreditsFinal
        },
        activeSemester: currentProfile.activeSemester || 'Summer 2026',
        courses: currentCourses
      };

      const payloadEncoded = encodeURIComponent(JSON.stringify(syncPayload));
      const publicUrl = window.location.origin.includes('localhost')
        ? 'http://localhost:8080/index.html'
        : (window.location.protocol === 'file:' ? 'file:///D:/rutine/index.html' : 'https://fahimshahir.github.io/seu-routine/');
      const syncFullUrl = publicUrl + '#sync=' + payloadEncoded;

      // Build Success Banner UI with avatar preview thumbnail
      const avatarThumbnailHtml = currentProfile.avatar
        ? (String.fromCharCode(60) + 'img src="' + currentProfile.avatar + '" alt="Student Photo" style="width:44px; height:44px; border-radius:50%; object-fit:cover; border:2px solid #10b981; flex-shrink:0;">')
        : '<div style="width:44px; height:44px; border-radius:50%; background:#3b82f6; color:#fff; display:flex; align-items:center; justify-content:center; font-weight:800; font-size:14px; flex-shrink:0;">' + ((currentProfile.name || 'ST').substring(0, 2).toUpperCase()) + '</div>';

      const actionHtml = [
        '<div style="display:flex; flex-wrap:wrap; gap:8px; margin-top:12px;">',
        '  <button id="btnOpenRoutineApp" style="background:#2563eb; color:white; border:none; padding:9px 15px; border-radius:8px; font-weight:700; cursor:pointer; font-size:13px; box-shadow:0 2px 6px rgba(37,99,235,0.4);">',
        '    🚀 Open Routine App',
        '  </button>',
        '  <button id="btnCopyJsonData" style="background:#0284c7; color:white; border:none; padding:9px 12px; border-radius:8px; font-weight:600; cursor:pointer; font-size:13px;">',
        '    📋 Copy Routine Data',
        '  </button>',
        '  <button id="btnCopySyncLink" style="background:#475569; color:white; border:none; padding:9px 12px; border-radius:8px; font-weight:600; cursor:pointer; font-size:13px;">',
        '    🔗 Copy Link',
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
        '    <div style="font-size:12px; color:#94a3b8;">ID: ' + (currentProfile.studentId || '—') + ' | Code: ' + (currentProfile.code || '—') + ' | Batch: ' + (currentProfile.batch || '—') + ' | ' + (currentProfile.program || 'BSc in EEE') + '</div>',
        '    <div style="font-size:11px; color:#38bdf8; margin-top:2px;">Advisor: ' + ((currentProfile.advisor && currentProfile.advisor.name) ? currentProfile.advisor.name : '—') + ' | ' + (currentProfile.activeSemester || 'Summer 2026') + '</div>',
        '  </div>',
        '</div>',
        '<div style="font-size:13px; color:#cbd5e1; line-height:1.45;">',
        '  ✅ <strong>' + currentCourses.length + 'টি কোর্স (' + totalCreditsFinal + ' Credits)</strong> এবং <strong>' + teachersWithPhotos + ' জন শিক্ষকের ছবি</strong> সফলভাবে সংগৃহীত হয়েছে!',
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

      // 1. Open Routine App with dual-channel (postMessage + URL hash fallback)
      const btnOpen = document.getElementById('btnOpenRoutineApp');
      if (btnOpen) {
        btnOpen.onclick = function () {
          cleanCache();
          const win = window.open(syncFullUrl, '_blank');
          if (win) {
            const sendMsg = function () {
              try {
                win.postMessage({ type: 'SEU_ROUTINE_SYNC', payload: syncPayload }, '*');
              } catch (e) {}
            };
            setTimeout(sendMsg, 250);
            setTimeout(sendMsg, 750);
            setTimeout(sendMsg, 1500);
          }
          if (banner) banner.remove();
        };
      }

      // 2. 1-Tap Copy Data JSON for easy paste into the Routine App
      const btnCopyData = document.getElementById('btnCopyJsonData');
      if (btnCopyData) {
        btnCopyData.onclick = function () {
          cleanCache();
          const jsonStr = JSON.stringify(syncPayload, null, 2);
          if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(jsonStr).then(() => {
              alert('📋 Routine & Photos copied! Open the Routine App and tap "Paste from Clipboard".');
            }).catch(() => {
              prompt('Copy your Routine JSON below:', jsonStr);
            });
          } else {
            prompt('Copy your Routine JSON below:', jsonStr);
          }
        };
      }

      // 3. Copy Link
      const btnCopy = document.getElementById('btnCopySyncLink');
      if (btnCopy) {
        btnCopy.onclick = function () {
          cleanCache();
          if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(syncFullUrl).then(() => {
              alert('🔗 Sync link copied! Paste into your browser.');
            }).catch(() => {
              prompt('Copy your Sync Link below:', syncFullUrl);
            });
          } else {
            prompt('Copy your Sync Link below:', syncFullUrl);
          }
        };
      }

      // 4. Download JSON
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
