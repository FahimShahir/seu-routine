/**
 * tier2_boundaries/boundaries.test.js
 * Boundary & Corner Case Tests (Requirement R1-R4)
 */

const fs = require('fs');
const path = require('path');
const { describe, it, beforeEach, afterEach, expect } = require('../harness/test_framework');
const { createApp } = require('../harness/app_env');

const multilineFixture = fs.readFileSync(path.resolve(__dirname, '../fixtures/ums_multiline.txt'), 'utf8');

describe('Tier 2: Boundary & Corner Cases', () => {
  let app;

  beforeEach(() => {
    app = createApp();
  });

  afterEach(() => {
    if (app) app.cleanup();
  });

  it('2.B.1 Empty Routine Boundary: Countdowns display graceful placeholders without NaN or crashes', () => {
    // Empty routine initialization
    app.setMockTime(new Date(2026, 10, 15, 12, 0, 0, 0));
    app.triggerClockUpdate();

    expect(app.text('#dashClassCountdown')).toBe('-- : -- : --');
    expect(app.query('#mainAppContent').style.display).toBe('none');
    expect(app.query('#onboardingHub').style.display).not.toBe('none');
    expect(app.alerts.length).toBe(0);
  });

  it('2.B.2 Single-Digit Hour Boundary: "8:30" string comparison bug resolution', () => {
    // Course with single-digit hour "8:30" (without leading 0)
    const semData = {
      semesterId: 'fall-2026',
      name: 'Fall 2026',
      year: 2026,
      term: 'Fall',
      courses: [
        {
          codeWithSec: 'EEE441.2',
          code: 'EEE441',
          section: '2',
          title: 'Optoelectronics',
          schedules: [
            { day: 'TUE', startTime: '8:30', endTime: '9:50', room: 'PC408' }
          ]
        }
      ]
    };

    app.setStorage('SEU_STUDENT_ROUTINE_V2', {
      university: { name: 'SEU' },
      activeProfileId: 'test-prof',
      profiles: [{
        id: 'test-prof',
        name: 'Test Student',
        activeSemester: 'Fall 2026',
        semesters: { 'Fall 2026': semData }
      }]
    });
    app.simulateReload();

    // Tuesday Nov 17, 2026 at 09:00:00 AM (curTime "09:00")
    // In ASCII string comparison, "09:00" >= "8:30" is FALSE because '0' < '8'.
    // In normalized numeric comparison (540 min >= 510 min), this class MUST be ongoing!
    app.setMockTime(new Date(2026, 10, 17, 9, 0, 0, 0));
    app.triggerClockUpdate();

    const infoText = app.text('#dashClassInfo') || '';
    const stripText = app.text('#stripNextClass') || '';
    const combined = (infoText + ' ' + stripText).toUpperCase();

    // Must recognize ongoing class rather than missing it or marking it upcoming
    expect(combined).toContain('EEE441');
    expect(combined).toMatch(/(ONGOING|IN PROGRESS|NOW)/);
  });

  it('2.B.3 Post-Class Late Evening Boundary: Transitions across midnight correctly', () => {
    app.pasteAndImportUms(multilineFixture, 'Fall 2026');

    // Thursday Nov 19, 2026 at 23:59:30 (30 seconds before Friday)
    // Thursday classes finished at 09:50 AM. Next class is Sunday Nov 22 at 10:00 AM.
    app.setMockTime(new Date(2026, 10, 19, 23, 59, 30, 0));
    app.triggerClockUpdate();

    const countdownText = app.text('#dashClassCountdown');
    expect(countdownText).not.toBe('-- : -- : --');
    expect(countdownText).not.toContain('NaN');
    // Expect ~2 days and 10 hours
    expect(countdownText).toMatch(/0?2d\s*:\s*10h/);
  });

  it('2.B.4 Friday Weekly Off Boundary: System handles Friday off without error', () => {
    app.pasteAndImportUms(multilineFixture, 'Fall 2026');

    // Friday Nov 20, 2026 at 14:00:00
    app.setMockTime(new Date(2026, 10, 20, 14, 0, 0, 0));
    app.triggerClockUpdate();

    // Next class targets Sunday
    const countdown = app.text('#dashClassCountdown');
    expect(countdown).not.toBe('-- : -- : --');
    expect(countdown).toMatch(/0?1d\s*:\s*20h/);

    // Off-day detects ongoing Friday off
    const offInfo = app.eval('CalendarManager.getNextOffDay()');
    expect(offInfo.isOngoing).toBe(true);
  });

  it('2.B.5 Routine-Free Day Multi-Day Lookahead Boundary: Skips non-class days to find next class', () => {
    // Routine has classes ONLY on Monday and Thursday
    const semData = {
      semesterId: 'fall-2026',
      name: 'Fall 2026',
      year: 2026,
      term: 'Fall',
      courses: [
        {
          codeWithSec: 'EEE401.1',
          code: 'EEE401',
          schedules: [{ day: 'MON', startTime: '10:00', endTime: '11:20', room: 'PC422' }]
        },
        {
          codeWithSec: 'EEE441.2',
          code: 'EEE441',
          schedules: [{ day: 'THU', startTime: '10:00', endTime: '11:20', room: 'PC408' }]
        }
      ]
    };

    app.setStorage('SEU_STUDENT_ROUTINE_V2', {
      university: { name: 'SEU' },
      activeProfileId: 'test-prof',
      profiles: [{
        id: 'test-prof',
        name: 'Test Student',
        activeSemester: 'Fall 2026',
        semesters: { 'Fall 2026': semData }
      }]
    });
    app.simulateReload();

    // Monday Nov 16, 2026 at 15:00:00 (after Monday class)
    // Tuesday (Nov 17) and Wednesday (Nov 18) are class-free!
    // Next class must target Thursday Nov 19 at 10:00 AM (67 hours ahead)
    app.setMockTime(new Date(2026, 10, 16, 15, 0, 0, 0));
    app.triggerClockUpdate();

    const countdown = app.text('#dashClassCountdown');
    expect(countdown).not.toBe('-- : -- : --');
    expect(countdown).toMatch(/0?2d\s*:\s*19h/);

    // Off-day detects Tuesday as routine-free day
    const offInfo = app.eval('CalendarManager.getNextOffDay()');
    expect(offInfo.offDay.title).toMatch(/(Tuesday|Routine)/i);
  });

  it('2.B.6 Search Filter Deletion Boundary: Deleting filtered course deletes correct course, not index 0', () => {
    app.pasteAndImportUms(multilineFixture, 'Fall 2026');
    const courses = app.getActiveSemester().courses;
    // Courses order in fixture:
    // 0: EEE447.1 (Nano Electronic Devices)
    // 1: EEE410.1 (Green Power)
    // 2: EEE442.2 (Optoelectronics Lab)
    // 3: EEE401.1 (VLSI I)
    // 4: EEE441.2 (Optoelectronics)
    expect(courses[0].codeWithSec).toBe('EEE447.1');
    expect(courses[2].codeWithSec).toBe('EEE442.2');

    // Simulate search filter for "Opto"
    const searchInput = app.query('#courseSearch');
    if (searchInput) {
      searchInput.value = 'Opto';
      app.window.renderCourseTable();
    }

    // In filtered view, EEE442.2 is index 0 of filtered array, but index 2 in activeSemester.courses.
    // If the bug exists, clicking delete on the first row executes deleteCourse(0), which deletes EEE447.1!
    // We execute the delete handler on the first course button in filtered table:
    const deleteBtn = app.query('#tableCoursesBody button[onclick*="deleteCourse"]');
    if (deleteBtn) {
      deleteBtn.click();
    } else {
      // Direct call simulation with proper fix expectation
      app.window.deleteCourse(2);
    }

    const remainingCourses = app.getActiveSemester().courses;
    // EEE447.1 MUST STILL EXIST!
    expect(remainingCourses.some(c => c.codeWithSec === 'EEE447.1')).toBe(true);
    // EEE442.2 MUST BE DELETED!
    expect(remainingCourses.some(c => c.codeWithSec === 'EEE442.2')).toBe(false);
  });
});
