/**
 * tier1_features/persistence.test.js
 * Feature Tests for Persistence Across Simulated Reloads (Requirement R1, R4)
 */

const fs = require('fs');
const path = require('path');
const { describe, it, beforeEach, afterEach, expect } = require('../harness/test_framework');
const { createApp } = require('../harness/app_env');

const multilineFixture = fs.readFileSync(path.resolve(__dirname, '../fixtures/ums_multiline.txt'), 'utf8');
const sampleJsonFixture = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, '../fixtures/seu_routine_sample.json'), 'utf8')
);

describe('Tier 1: Feature 3 - Persistence Across Reloads', () => {
  let app;

  beforeEach(() => {
    app = createApp();
  });

  afterEach(() => {
    if (app) app.cleanup();
  });

  it('3.1 should retain imported UMS courses and profile metadata across simulated reload', () => {
    app.pasteAndImportUms(multilineFixture, 'Fall 2026');
    expect(app.getActiveSemester().courses.length).toBe(5);

    // Simulated browser refresh
    app.simulateReload();

    const reloadedSem = app.getActiveSemester();
    expect(reloadedSem).toBeDefined();
    expect(reloadedSem.courses.length).toBe(5);

    const reloadedProfile = app.getActiveProfile();
    expect(reloadedProfile.name).toBe('F.U.M Foyjul Bari Shahir');
    expect(reloadedProfile.studentId).toBe('0232330005131002');

    // DOM should show mainAppContent, not onboardingHub
    expect(app.query('#mainAppContent').style.display).not.toBe('none');
    expect(app.query('#onboardingHub').style.display).toBe('none');
  });

  it('3.2 should retain JSON-uploaded routine across simulated reload', async () => {
    app.uploadJson(sampleJsonFixture);
    await new Promise(r => setTimeout(r, 20));

    app.simulateReload();

    const stored = app.getStorage('SEU_STUDENT_ROUTINE_V2');
    expect(stored).toBeDefined();
    expect(stored).not.toBeNull();
    expect(stored.profiles[0].id).toBe('prof-shahir');
    expect(stored.profiles[0].semesters['Fall 2026'].courses.length).toBe(5);
  });

  it('3.3 should persist manual course slot edits across simulated reload', () => {
    app.pasteAndImportUms(multilineFixture, 'Fall 2026');
    const courses = app.getActiveSemester().courses;
    expect(courses.length).toBeGreaterThan(0);

    // Modify room of first schedule
    courses[0].schedules[0].room = 'PC999';
    app.window.saveStore();

    app.simulateReload();

    const reloadedCourses = app.getActiveSemester().courses;
    expect(reloadedCourses[0].schedules[0].room).toBe('PC999');
  });

  it('3.4 should persist added course slot across simulated reload', () => {
    app.pasteAndImportUms(multilineFixture, 'Fall 2026');
    const courses = app.getActiveSemester().courses;
    const initialCount = courses.length;

    courses.push({
      codeWithSec: 'CSE499.1',
      code: 'CSE499',
      section: '1',
      title: 'Senior Design Project',
      credits: 3.0,
      type: 'Project',
      faculty: { initials: 'TBA', name: 'Supervisor', email: '', avatar: '' },
      schedules: [{ day: 'THU', startTime: '11:30', endTime: '12:50', room: 'PC501', campus: 'PC' }]
    });
    app.window.saveStore();

    app.simulateReload();

    const reloadedCourses = app.getActiveSemester().courses;
    expect(reloadedCourses.length).toBe(initialCount + 1);
    expect(reloadedCourses.some(c => c.code === 'CSE499')).toBe(true);
  });

  it('3.5 should persist course deletions across simulated reload', () => {
    app.pasteAndImportUms(multilineFixture, 'Fall 2026');
    const courses = app.getActiveSemester().courses;
    const initialCount = courses.length;

    // Delete the first course
    app.window.deleteCourse(0);

    app.simulateReload();

    const reloadedCourses = app.getActiveSemester().courses;
    expect(reloadedCourses.length).toBe(initialCount - 1);
    expect(reloadedCourses.some(c => c.codeWithSec === 'EEE447.1')).toBe(false);
  });

  it('3.6 should clean legacy caches without corrupting V2 storage', () => {
    app.setStorage('SEU_PRODUCTION_ROUTINE_V1', 'legacy-data');
    app.setStorage('seu_routine_db', 'legacy-data');
    app.pasteAndImportUms(multilineFixture, 'Fall 2026');

    app.simulateReload();

    // Legacy keys must be purged by purgeLegacyTestData
    expect(app.getStorage('SEU_PRODUCTION_ROUTINE_V1')).toBeNull();
    expect(app.getStorage('seu_routine_db')).toBeNull();

    // V2 storage must remain intact
    expect(app.getStorage('SEU_STUDENT_ROUTINE_V2')).not.toBeNull();
  });
});
