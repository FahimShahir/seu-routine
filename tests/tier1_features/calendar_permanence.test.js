/**
 * tier1_features/calendar_permanence.test.js
 * Feature Tests for Academic Calendar Permanent Availability (Requirement R2, R4)
 */

const fs = require('fs');
const path = require('path');
const { describe, it, beforeEach, afterEach, expect } = require('../harness/test_framework');
const { createApp } = require('../harness/app_env');

const multilineFixture = fs.readFileSync(path.resolve(__dirname, '../fixtures/ums_multiline.txt'), 'utf8');

describe('Tier 1: Feature 4 - Academic Calendar Permanent Availability', () => {
  let app;

  beforeEach(() => {
    app = createApp();
  });

  afterEach(() => {
    if (app) app.cleanup();
  });

  it('4.1 should have #btnAcademicCal visible in empty routine state without demo mode', () => {
    const btn = app.query('#btnAcademicCal');
    expect(btn).toBeDefined();
    // Requirement R2: Calendar button must NEVER be hidden in empty routine state
    expect(btn.style.display).not.toBe('none');
  });

  it('4.2 should open academic calendar modal and render 2026 holidays in empty state', () => {
    app.eval('openAcademicCalendarModal()');
    const modal = app.query('#modalAcademicCalendar');
    expect(modal).toBeDefined();
    expect(modal.style.display).not.toBe('none');

    const holidayListEl = app.query('#calHolidaysTableBody') || app.query('#calHolidayList');
    expect(holidayListEl).toBeDefined();
    expect(holidayListEl.innerHTML).toContain('Holiday');
  });

  it('4.3 should have CalendarManager initialized unconditionally on app boot', () => {
    const calMgr = app.eval('CalendarManager');
    expect(calMgr).toBeDefined();
    expect(calMgr).not.toBeNull();
    expect(typeof calMgr.getActiveSystemData).toBe('function');

    const sysData = calMgr.getActiveSystemData();
    expect(sysData).toBeDefined();
    expect(sysData.allHolidays.length).toBeGreaterThan(0);
  });

  it('4.4 should provide an academic calendar card/trigger in Onboarding Hub', () => {
    const onboardingHub = app.query('#onboardingHub');
    expect(onboardingHub).toBeDefined();
    // Onboarding Hub must have a direct link or button to open the Academic Calendar
    const calTrigger = onboardingHub.querySelector('[onclick*="AcademicCalendar"]') ||
                       onboardingHub.querySelector('[onclick*="academicCalendar"]');
    expect(calTrigger).not.toBeNull();
  });

  it('4.5 should persist Tri-Semester vs Bi-Semester toggle across reload', () => {
    app.eval(`
      if (typeof CalendarManager !== 'undefined') {
        CalendarManager.setSystem ? CalendarManager.setSystem('biSemester') : (CalendarManager.currentSystem = 'biSemester');
      }
    `);
    app.setStorage('seu_calendar_system', 'biSemester');

    app.simulateReload();

    const savedSys = app.getStorage('seu_calendar_system');
    expect(savedSys).toBe('biSemester');

    const currentSys = app.eval('typeof CalendarManager !== "undefined" ? CalendarManager.currentSystem : null');
    expect(currentSys).toBe('biSemester');
  });

  it('4.6 should keep academic calendar accessible after importing real routine', () => {
    app.pasteAndImportUms(multilineFixture, 'Fall 2026');
    const btn = app.query('#btnAcademicCal');
    expect(btn.style.display).not.toBe('none');

    app.eval('openAcademicCalendarModal()');
    const modal = app.query('#modalAcademicCalendar');
    expect(modal.style.display).not.toBe('none');
  });
});
