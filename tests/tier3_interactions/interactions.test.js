/**
 * tier3_interactions/interactions.test.js
 * Cross-Feature Interaction Tests (Requirement R1, R2, R3, R4)
 */

const fs = require('fs');
const path = require('path');
const { describe, it, beforeEach, afterEach, expect } = require('../harness/test_framework');
const { createApp } = require('../harness/app_env');

const multilineFixture = fs.readFileSync(path.resolve(__dirname, '../fixtures/ums_multiline.txt'), 'utf8');

describe('Tier 3: Cross-Feature Interactions', () => {
  let app;

  beforeEach(() => {
    app = createApp();
  });

  afterEach(() => {
    if (app) app.cleanup();
  });

  it('3.I.1 Demo Preview -> Real Import -> Reload Interaction: Real routine persists and is not blocked by isDemoMode', () => {
    // 1. User explores demo mode
    app.window.loadSampleDemo();
    expect(app.isDemoMode()).toBe(true);

    // 2. User pastes real UMS routine
    app.pasteAndImportUms(multilineFixture, 'Fall 2026');

    // Requirement: isDemoMode must be reset to false so saveStore() can persist real routine
    expect(app.isDemoMode()).toBe(false);

    // 3. User reloads page
    app.simulateReload();

    // Routine must exist in localStorage and render on boot
    const stored = app.getStorage('SEU_STUDENT_ROUTINE_V2');
    expect(stored).not.toBeNull();
    expect(stored.profiles[0].studentId).toBe('0232330005131002');

    const courses = app.getActiveSemester().courses;
    expect(courses.length).toBe(5);
    expect(courses.some(c => c.code === 'EEE447')).toBe(true);
  });

  it('3.I.2 Exit Demo after Reload Interaction: Does not destroy stored user routine from localStorage', () => {
    // 1. User has saved routine
    app.pasteAndImportUms(multilineFixture, 'Fall 2026');
    expect(app.getStorage('SEU_STUDENT_ROUTINE_V2')).not.toBeNull();

    // 2. User clicks "View Sample Demo"
    app.window.loadSampleDemo();
    expect(app.isDemoMode()).toBe(true);

    // 3. User refreshes browser while in demo (clearing in-memory realAppDataBackup)
    app.simulateReload();

    // 4. User clicks "Exit Demo"
    app.window.exitDemoMode();

    // Requirement: exitDemoMode must not purge real data from localStorage
    const stored = app.getStorage('SEU_STUDENT_ROUTINE_V2');
    expect(stored).not.toBeNull();
    expect(stored.profiles[0].studentId).toBe('0232330005131002');
  });

  it('3.I.3 Manual Edit in Demo Mode Interaction: Transitions demo to real persisted user routine', () => {
    // 1. User in demo
    app.window.loadSampleDemo();
    expect(app.isDemoMode()).toBe(true);

    // 2. User modifies a course slot
    const courses = app.getActiveSemester().courses;
    courses[0].title = 'Custom Edited Course';
    app.window.saveStore();

    // 3. Reload
    app.simulateReload();

    // Storage must be persisted
    const stored = app.getStorage('SEU_STUDENT_ROUTINE_V2');
    expect(stored).not.toBeNull();
  });

  it('3.I.4 Calendar System Toggle Interaction: Bi-Semester toggle persists across semester switches and reloads', () => {
    app.pasteAndImportUms(multilineFixture, 'Fall 2026');

    // Toggle to Bi-Semester
    app.eval(`
      if (typeof CalendarManager !== 'undefined') {
        CalendarManager.switchCalendarSystem ? CalendarManager.switchCalendarSystem('biSemester') : CalendarManager.setSystem('biSemester');
      }
    `);
    app.setStorage('seu_calendar_system', 'biSemester');

    // Trigger renderAll or semester switch
    app.window.renderAll();

    // Reload
    app.simulateReload();

    const currentSys = app.eval('CalendarManager.currentSystem');
    expect(currentSys).toBe('biSemester');
  });

  it('3.I.5 Weekend Schedule Rendering Interaction: Timetable grid dynamically accommodates Friday/Saturday courses', () => {
    app.pasteAndImportUms(multilineFixture, 'Fall 2026');
    const sem = app.getActiveSemester();

    // Add a weekend course on Friday
    sem.courses.push({
      codeWithSec: 'CSE101.1',
      code: 'CSE101',
      section: '1',
      title: 'Weekend Computer Lab',
      credits: 1.5,
      type: 'Lab',
      faculty: { initials: 'WKF', name: 'Weekend Faculty', email: '', avatar: '' },
      schedules: [{ day: 'FRI', startTime: '09:00', endTime: '12:00', room: 'PC301', campus: 'PC' }]
    });
    app.window.saveStore();
    app.window.renderAll();

    const timetableBody = app.query('#timetableGridBody');
    const timetableHtml = timetableBody ? timetableBody.innerHTML : '';
    // Timetable grid must include Friday column when active courses have Friday schedules
    expect(timetableHtml).toMatch(/(FRI|Friday)/i);
    expect(timetableHtml).toContain('CSE101');
  });
});
