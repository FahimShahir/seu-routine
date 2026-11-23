/**
 * tier1_features/next_off_day.test.js
 * Feature Tests for Three-Factor Next Off-Day Evaluation (Requirement R3, R4)
 */

const fs = require('fs');
const path = require('path');
const { describe, it, beforeEach, afterEach, expect } = require('../harness/test_framework');
const { createApp } = require('../harness/app_env');

const multilineFixture = fs.readFileSync(path.resolve(__dirname, '../fixtures/ums_multiline.txt'), 'utf8');

describe('Tier 1: Feature 6 - Next Off-Day Three-Factor Countdown', () => {
  let app;

  beforeEach(() => {
    app = createApp();
    app.pasteAndImportUms(multilineFixture, 'Fall 2026');
  });

  afterEach(() => {
    if (app) app.cleanup();
  });

  it('6.1 should detect Factor 1: Official University Holiday from Academic Calendar', () => {
    // Independence Day: March 26, 2026. Mock time: March 24, 2026 at 10:00:00 AM
    app.setMockTime(new Date(2026, 2, 24, 10, 0, 0, 0));
    app.triggerClockUpdate();

    const info = app.eval('CalendarManager.getNextOffDay()');
    expect(info).toBeDefined();
    expect(info).not.toBeNull();

    const holidayTitle = info.offDay ? info.offDay.title : (info.holiday ? info.holiday.title : '');
    expect(holidayTitle).toMatch(/(Independence|Day|Holiday)/i);
  });

  it('6.2 should detect Factor 2: Regular Weekly Off-Day (Friday)', () => {
    // Thursday Nov 19, 2026 at 15:00:00 (3:00 PM)
    // Friday begins at Nov 20, 2026 00:00:00 (9 hours ahead)
    app.setMockTime(new Date(2026, 10, 19, 15, 0, 0, 0));
    app.triggerClockUpdate();

    const info = app.eval('CalendarManager.getNextOffDay()');
    expect(info).toBeDefined();
    expect(info).not.toBeNull();

    const title = info.offDay ? info.offDay.title : (info.holiday ? info.holiday.title : '');
    // Factor 2 must identify Friday weekend, rather than skipping weeks ahead to next calendar holiday
    expect(title).toMatch(/(Friday|Weekly Off|Weekend)/i);
    expect(info.diffMs).toBeLessThanOrEqual(9 * 3600 * 1000 + 1000);
  });

  it('6.3 should detect Factor 3: Routine-Specific Off-Day with 0 scheduled classes', () => {
    // In our multiline fixture, student has classes on SUN, MON, TUE, WED, THU.
    // Let's create a student routine with classes only on Sunday and Wednesday (Mon, Tue, Thu have 0 classes)
    const sem = app.getActiveSemester();
    sem.courses = [
      {
        codeWithSec: 'EEE447.1',
        code: 'EEE447',
        section: '1',
        title: 'Nano Electronic Devices',
        schedules: [
          { day: 'SUN', startTime: '10:00', endTime: '11:20', room: 'PC422' },
          { day: 'WED', startTime: '10:00', endTime: '11:20', room: 'PC413' }
        ]
      }
    ];
    app.window.saveStore();

    // Mock time: Sunday evening Nov 15, 2026 at 18:00:00.
    // Monday Nov 16 has 0 classes scheduled!
    app.setMockTime(new Date(2026, 10, 15, 18, 0, 0, 0));
    app.triggerClockUpdate();

    const info = app.eval('CalendarManager.getNextOffDay()');
    expect(info).toBeDefined();
    expect(info).not.toBeNull();

    // Monday should be detected as routine off-day (6 hours ahead to Nov 16 00:00:00)
    const title = info.offDay ? info.offDay.title : '';
    expect(title).toMatch(/(Monday|Routine|Off)/i);
  });

  it('6.4 should identify ongoing status when current day is an off-day', () => {
    // Friday Nov 20, 2026 at 11:00:00 AM
    app.setMockTime(new Date(2026, 10, 20, 11, 0, 0, 0));
    app.triggerClockUpdate();

    const info = app.eval('CalendarManager.getNextOffDay()');
    expect(info).toBeDefined();
    expect(info).not.toBeNull();
    expect(info.isOngoing).toBe(true);
  });

  it('6.5 should format countdown string cleanly without NaN or negative values', () => {
    app.setMockTime(new Date(2026, 10, 15, 18, 0, 0, 0));
    app.triggerClockUpdate();

    const countdownText = app.text('#dashOffDayCountdown') || app.text('#dashHolidayCountdown');
    expect(countdownText).not.toBeNull();
    expect(countdownText).not.toContain('NaN');
    expect(countdownText).not.toContain('-');
    expect(countdownText).toMatch(/\d{2}d\s*:\s*\d{2}h\s*:\s*\d{2}m\s*:\s*\d{2}s/);
  });

  it('6.6 should display descriptive category tags (Weekly Off, Academic Cal, Routine Free)', () => {
    // Thursday before Friday
    app.setMockTime(new Date(2026, 10, 19, 15, 0, 0, 0));
    app.triggerClockUpdate();

    const tagText = app.text('#dashOffDayTag') || app.text('#dashHolidayTag') || app.text('#stripNextHoliday');
    expect(tagText).not.toBeNull();
    expect(tagText.length).toBeGreaterThan(0);
  });
});
