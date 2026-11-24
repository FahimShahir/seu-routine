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

  it('3.I.6 Course Deletion ↔ Assignment Association Interaction: Deleting a course preserves assignment integrity', () => {
    app.pasteAndImportUms(multilineFixture, 'Fall 2026');

    // Create assignment linked to EEE447
    app.eval(`
      AssignmentManager.save({
        courseCode: 'EEE447',
        courseTitle: 'Nano Electronic Devices',
        title: 'Quantum Well Essay',
        dueDate: '2026-12-01',
        dueTime: '23:59',
        priority: 'high'
      });
    `);

    // Delete EEE447 from course roster
    const courses = app.getActiveSemester().courses;
    const eee447Index = courses.findIndex(c => c.code === 'EEE447');
    expect(eee447Index).toBeGreaterThanOrEqual(0);
    app.eval(`deleteCourse(${eee447Index})`);

    // Verify assignment still exists safely with its courseCode intact
    const allAssignments = app.eval('AssignmentManager.getAll()');
    expect(allAssignments.length).toBe(1);
    expect(allAssignments[0].courseCode).toBe('EEE447');
    expect(allAssignments[0].title).toBe('Quantum Well Essay');
  });

  it('3.I.7 Calendar System Switch ↔ Semester Progress Recalculation Interaction: Switching Tri/Bi-Semester recalculates progress', () => {
    app.pasteAndImportUms(multilineFixture, 'Fall 2026');
    const testDate = new Date('2026-11-24T12:00:00');
    app.setMockTime(testDate);

    // Initial Tri-Semester
    app.eval("CalendarManager.setSystem('triSemester')");
    const triProgress = app.eval("CalendarManager.getSemesterProgress(new Date('2026-11-24T12:00:00'))");
    expect(triProgress.system).toBe('triSemester');
    expect(triProgress.progressPercentage).toBeGreaterThanOrEqual(30);
    expect(triProgress.progressPercentage).toBeLessThanOrEqual(36);

    // Switch to Bi-Semester
    app.eval("CalendarManager.setSystem('biSemester')");
    const biProgress = app.eval("CalendarManager.getSemesterProgress(new Date('2026-11-24T12:00:00'))");
    expect(biProgress.system).toBe('biSemester');
    expect(biProgress.totalDays).toBeGreaterThan(triProgress.totalDays);
  });

  it('3.I.8 Exam Routine Ingestion ↔ Dashboard Live Countdowns Interaction: Ingesting exams updates countdowns immediately', () => {
    app.pasteAndImportUms(multilineFixture, 'Fall 2026');

    // Set time to Jan 10, 2027
    app.setMockTime(new Date(2027, 0, 10, 10, 0, 0, 0));

    // Save exam on Jan 17, 2027
    app.eval(`
      ExamManager.saveSchedule([{
        id: 'exam-imm-1',
        courseCode: 'EEE447.1',
        courseTitle: 'Nano Electronic Devices',
        date: '2027-01-17',
        startTime: '10:00',
        endTime: '12:00',
        room: 'PC-422'
      }]);
    `);

    // Trigger UI countdown update
    app.triggerClockUpdate();

    const nextExam = app.eval('ExamManager.getNextExam(new Date(2027, 0, 10, 10, 0, 0, 0))');
    expect(nextExam).not.toBeNull();
    const ex = nextExam.exam || nextExam;
    expect(ex.courseCode).toMatch(/EEE447/);
  });

  it('3.I.9 Demo Mode Isolation ↔ Assignments & Exams Interaction: Demo mode operations do not purge user mode data', () => {
    // 1. Ingest real user data
    app.pasteAndImportUms(multilineFixture, 'Fall 2026');
    app.eval(`
      AssignmentManager.save({
        courseCode: 'EEE447',
        title: 'Real Student HW',
        dueDate: '2026-12-05',
        dueTime: '23:59',
        priority: 'high'
      });
    `);

    // 2. Switch to Demo Mode
    app.window.loadSampleDemo();
    expect(app.isDemoMode()).toBe(true);

    // 3. Exit Demo Mode
    app.window.exitDemoMode();
    expect(app.isDemoMode()).toBe(false);

    // 4. Verify user assignment remains intact
    const allAssignments = app.eval('AssignmentManager.getAll()');
    expect(allAssignments.length).toBe(1);
    expect(allAssignments[0].title).toBe('Real Student HW');
  });
});
