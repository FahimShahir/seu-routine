/**
 * tier1_features/next_class_countdown.test.js
 * Feature Tests for Next Class Countdown & Status Ticker (Requirement R3, R4)
 */

const fs = require('fs');
const path = require('path');
const { describe, it, beforeEach, afterEach, expect } = require('../harness/test_framework');
const { createApp } = require('../harness/app_env');

const multilineFixture = fs.readFileSync(path.resolve(__dirname, '../fixtures/ums_multiline.txt'), 'utf8');

describe('Tier 1: Feature 5 - Next Class Countdown & Status Ticker', () => {
  let app;

  beforeEach(() => {
    app = createApp();
    app.pasteAndImportUms(multilineFixture, 'Fall 2026');
  });

  afterEach(() => {
    if (app) app.cleanup();
  });

  it('5.1 should accurately count down to upcoming class later today', () => {
    // Sunday Nov 15, 2026 at 09:30:00 AM (30 mins before EEE447.1 at 10:00)
    app.setMockTime(new Date(2026, 10, 15, 9, 30, 0, 0));
    app.triggerClockUpdate();

    const countdownText = app.text('#dashClassCountdown');
    expect(countdownText).not.toBe('-- : -- : --');
    expect(countdownText).toContain('30m');

    const stripText = app.text('#stripNextClass');
    expect(stripText).toContain('EEE447');
    expect(stripText).toContain('PC422');
  });

  it('5.2 should detect ongoing class status when current time is within class hours', () => {
    // Sunday Nov 15, 2026 at 10:30:00 AM (during EEE447.1 10:00 - 11:20)
    app.setMockTime(new Date(2026, 10, 15, 10, 30, 0, 0));
    app.triggerClockUpdate();

    const infoText = app.text('#dashClassInfo');
    const stripText = app.text('#stripNextClass');

    // Either dash info or strip ticker should show ongoing status
    const combined = (infoText + ' ' + stripText).toUpperCase();
    expect(combined).toContain('EEE447');
    expect(combined).toMatch(/(ONGOING|IN PROGRESS|NOW)/);
  });

  it('5.3 should look ahead to Monday when Sunday classes have finished', () => {
    // Sunday Nov 15, 2026 at 18:00:00 (all Sunday classes ended)
    // Next class is Monday 14:00 (EEE442.2 in PC211, 20 hours ahead)
    app.setMockTime(new Date(2026, 10, 15, 18, 0, 0, 0));
    app.triggerClockUpdate();

    const countdownText = app.text('#dashClassCountdown');
    // Must NOT be blank, dashes, or NaN
    expect(countdownText).not.toBe('-- : -- : --');
    expect(countdownText).not.toContain('NaN');
    expect(countdownText).toContain('20h : 00m');

    const infoText = app.text('#dashClassInfo');
    expect(infoText).toContain('EEE442');
  });

  it('5.4 should look ahead across weekend to Sunday from Saturday', () => {
    // Saturday Nov 14, 2026 at 10:00:00 AM
    // Next class is Sunday Nov 15 at 10:00:00 AM (exactly 24h ahead)
    app.setMockTime(new Date(2026, 10, 14, 10, 0, 0, 0));
    app.triggerClockUpdate();

    const countdownText = app.text('#dashClassCountdown');
    expect(countdownText).not.toBe('-- : -- : --');
    expect(countdownText).not.toContain('NaN');
    expect(countdownText).toMatch(/0?1d\s*:\s*0?0h/);
  });

  it('5.5 should display graceful placeholder dashes in empty routine', () => {
    const emptyApp = createApp();
    emptyApp.setMockTime(new Date(2026, 10, 15, 9, 30, 0, 0));
    emptyApp.triggerClockUpdate();

    const countdownText = emptyApp.text('#dashClassCountdown');
    expect(countdownText).toBe('-- : -- : --');

    emptyApp.cleanup();
  });

  it('5.6 should set appropriate status tag (TODAY UPCOMING vs UPCOMING (DAY))', () => {
    // Sunday 09:30 -> Today upcoming
    app.setMockTime(new Date(2026, 10, 15, 9, 30, 0, 0));
    app.triggerClockUpdate();
    const tagToday = app.text('#dashClassTag');
    expect(tagToday).toMatch(/(TODAY|UPCOMING)/i);

    // Sunday 18:00 -> Upcoming on Monday
    app.setMockTime(new Date(2026, 10, 15, 18, 0, 0, 0));
    app.triggerClockUpdate();
    const tagMon = app.text('#dashClassTag');
    expect(tagMon).toMatch(/(MON|UPCOMING)/i);
  });
});
