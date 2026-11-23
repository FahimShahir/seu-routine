/**
 * tier4_scenarios/scenarios.test.js
 * Real-World Workload Scenario Tests at Multiple Timestamps (Requirement R3, R4)
 */

const fs = require('fs');
const path = require('path');
const { describe, it, beforeEach, afterEach, expect } = require('../harness/test_framework');
const { createApp } = require('../harness/app_env');

const multilineFixture = fs.readFileSync(path.resolve(__dirname, '../fixtures/ums_multiline.txt'), 'utf8');

describe('Tier 4: Real-World Workload Scenarios', () => {
  let app;

  beforeEach(() => {
    app = createApp();
    app.pasteAndImportUms(multilineFixture, 'Fall 2026');
  });

  afterEach(() => {
    if (app) app.cleanup();
  });

  it('4.S.1 Scenario 1: Sunday Morning 09:30 AM (Upcoming First Class)', () => {
    // Sunday Nov 15, 2026 at 09:30:00 AM
    app.setMockTime(new Date(2026, 10, 15, 9, 30, 0, 0));
    app.triggerClockUpdate();

    // 1. Next Class countdown targets 10:00 AM (30 min)
    const countdown = app.text('#dashClassCountdown');
    expect(countdown).toContain('30m');

    // 2. Info displays course code and room
    const strip = app.text('#stripNextClass');
    expect(strip).toContain('EEE447');
    expect(strip).toContain('PC422');

    // 3. Status tag indicates today upcoming
    const tag = app.text('#dashClassTag');
    expect(tag).toMatch(/(TODAY|UPCOMING)/i);
  });

  it('4.S.2 Scenario 2: Sunday Midday 10:30 AM (Ongoing Class Session)', () => {
    // Sunday Nov 15, 2026 at 10:30:00 AM (EEE447.1 runs 10:00 - 11:20)
    app.setMockTime(new Date(2026, 10, 15, 10, 30, 0, 0));
    app.triggerClockUpdate();

    const infoText = app.text('#dashClassInfo') || '';
    const stripText = app.text('#stripNextClass') || '';
    const combined = (infoText + ' ' + stripText).toUpperCase();

    // Must indicate ongoing class EEE447.1 in PC422
    expect(combined).toContain('EEE447');
    expect(combined).toMatch(/(ONGOING|IN PROGRESS|NOW)/);
  });

  it('4.S.3 Scenario 3: Sunday Evening 18:00 (Post-Class Lookahead to Monday)', () => {
    // Sunday Nov 15, 2026 at 18:00:00 (all Sunday classes ended)
    app.setMockTime(new Date(2026, 10, 15, 18, 0, 0, 0));
    app.triggerClockUpdate();

    // Must look ahead to Monday 14:00 (EEE442.2 Lab in PC211, 20h ahead)
    const countdown = app.text('#dashClassCountdown');
    expect(countdown).not.toBe('-- : -- : --');
    expect(countdown).toContain('20h : 00m');

    const info = app.text('#dashClassInfo');
    expect(info).toContain('EEE442');
    expect(info).toContain('PC211');
  });

  it('4.S.4 Scenario 4: Monday Afternoon 15:00 (Active 2-Hour Lab Session)', () => {
    // Monday Nov 16, 2026 at 15:00:00 (EEE442.2 Optoelectronics Lab: 14:00 - 16:00 in PC211)
    app.setMockTime(new Date(2026, 10, 16, 15, 0, 0, 0));
    app.triggerClockUpdate();

    const infoText = app.text('#dashClassInfo') || '';
    const stripText = app.text('#stripNextClass') || '';
    const combined = (infoText + ' ' + stripText).toUpperCase();

    expect(combined).toContain('EEE442');
    expect(combined).toContain('PC211');
    expect(combined).toMatch(/(ONGOING|IN PROGRESS|NOW)/);
  });

  it('4.S.5 Scenario 5: Thursday 15:00 (Pre-Weekend Multi-Day Synchronized Lookahead)', () => {
    // Thursday Nov 19, 2026 at 15:00:00 (all Thursday classes concluded)
    app.setMockTime(new Date(2026, 10, 19, 15, 0, 0, 0));
    app.triggerClockUpdate();

    // 1. Next Off-Day must target Friday Nov 20 00:00:00 (9 hours ahead)
    const offDayCountdown = app.text('#dashOffDayCountdown') || app.text('#dashHolidayCountdown');
    expect(offDayCountdown).toMatch(/0?0d\s*:\s*0?9h/);

    // 2. Next Class must target Sunday Nov 22 10:00 AM (~67 hours ahead)
    const classCountdown = app.text('#dashClassCountdown');
    expect(classCountdown).not.toBe('-- : -- : --');
    expect(classCountdown).toMatch(/0?2d\s*:\s*19h/);
  });

  it('4.S.6 Scenario 6: Friday 10:00 AM (Weekly Off-Day in Progress)', () => {
    // Friday Nov 20, 2026 at 10:00:00 AM
    app.setMockTime(new Date(2026, 10, 20, 10, 0, 0, 0));
    app.triggerClockUpdate();

    // 1. Next Off-Day detects Friday is ongoing
    const offInfo = app.eval('CalendarManager.getNextOffDay()');
    expect(offInfo.isOngoing).toBe(true);

    // 2. Next Class targets Sunday 10:00 AM (48 hours ahead)
    const classCountdown = app.text('#dashClassCountdown');
    expect(classCountdown).not.toBe('-- : -- : --');
    expect(classCountdown).toMatch(/0?2d\s*:\s*0?0h/);
  });

  it('4.S.7 Scenario 7: Upcoming Assessment / Exam Schedule Integration', () => {
    // Inject an exam schedule into localStorage
    const examData = {
      exams: [
        {
          id: 'exam-1',
          code: 'EEE447',
          title: 'Nano Electronic Devices Midterm',
          date: '2026-11-25',
          time: '10:00',
          room: 'PC422'
        }
      ]
    };
    app.setStorage('seu_exam_schedule', examData);

    // Mock time Nov 23, 2026 10:00 AM (2 days before exam)
    app.setMockTime(new Date(2026, 10, 23, 10, 0, 0, 0));
    app.simulateReload();
    app.triggerClockUpdate();

    const examCard = app.query('#dashNextExamTitle') || app.query('#dashExamTitle') || app.query('#dashExamCountdown');
    expect(examCard).toBeDefined();
  });
});
