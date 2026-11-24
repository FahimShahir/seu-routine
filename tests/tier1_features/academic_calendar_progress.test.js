/**
 * tier1_features/academic_calendar_progress.test.js
 * Feature Tests for Dynamic Academic Calendar Semester Progress (Requirement R2, R4)
 */

const fs = require('fs');
const path = require('path');
const { describe, it, beforeEach, afterEach, expect } = require('../harness/test_framework');
const { createApp } = require('../harness/app_env');

const multilineFixture = fs.readFileSync(path.resolve(__dirname, '../fixtures/ums_multiline.txt'), 'utf8');

describe('Tier 1: Feature 9 - Dynamic Academic Calendar Progress', () => {
  let app;

  beforeEach(() => {
    app = createApp();
    app.pasteAndImportUms(multilineFixture, 'Fall 2026');
  });

  afterEach(() => {
    if (app) app.cleanup();
  });

  it('9.1 should calculate accurate Tri-Semester progress percentage and days elapsed for Fall 2026', () => {
    // In seu_academic_calendar_2026.json:
    // Tri-Semester Fall 2026:
    // Classes begin: 2026-10-25
    // Final Examination ends: 2027-01-24
    // Total duration: 91 days (from 2026-10-25 to 2027-01-24)
    // Simulated date: Nov 24, 2026 (Day 30 out of 91 => ~33%)
    const simDate = new Date('2026-11-24T12:00:00');
    app.setMockTime(simDate);

    const progress = app.eval(`
      CalendarManager.getSemesterProgress(new Date('2026-11-24T12:00:00'), 'Fall 2026', 'triSemester')
    `);

    expect(progress).toBeDefined();
    expect(progress.system).toBe('triSemester');
    expect(progress.startDate).toBe('2026-10-25');
    expect(progress.endDate).toBe('2027-01-24');
    expect(progress.totalDays).toBeGreaterThan(80);
    expect(progress.elapsedDays).toBeGreaterThan(25);
    expect(progress.progressPercentage).toBeGreaterThanOrEqual(30);
    expect(progress.progressPercentage).toBeLessThanOrEqual(36);
    expect(progress.status).toBe('In Progress');
  });

  it('9.2 should calculate accurate Bi-Semester progress percentage and days elapsed for Bi Semester Fall 2026', () => {
    // Bi-Semester Fall 2026:
    // Classes begin: 2026-08-16
    // Final exam ends: 2027-01-27
    // Simulated date: Oct 25, 2026 (70 days elapsed out of 164 => ~43%)
    const progress = app.eval(`
      CalendarManager.getSemesterProgress(new Date('2026-10-25T12:00:00'), 'Fall 2026', 'biSemester')
    `);

    expect(progress).toBeDefined();
    expect(progress.system).toBe('biSemester');
    expect(progress.startDate).toBe('2026-08-16');
    expect(progress.totalDays).toBeGreaterThan(150);
    expect(progress.progressPercentage).toBeGreaterThanOrEqual(40);
    expect(progress.progressPercentage).toBeLessThanOrEqual(46);
    expect(progress.status).toBe('In Progress');
  });

  it('9.3 should normalize cross-year Fall milestone dates from 2026 to 2027 in Bi-Semester', () => {
    // In seu_academic_calendar_2026.json, Bi Semester Fall - 2026 has unnormalized January/February dates with year 2026.
    // The engine must normalize them so Final Examination is in 2027, not in the past!
    const progress = app.eval(`
      CalendarManager.getSemesterProgress(new Date('2026-11-01T12:00:00'), 'Fall 2026', 'biSemester')
    `);

    expect(progress).toBeDefined();
    expect(progress.endDate.startsWith('2027')).toBe(true);

    const finalMilestone = (progress.milestones || []).find(m => /final/i.test(m.title));
    expect(finalMilestone).toBeDefined();
    expect(finalMilestone.startDate.startsWith('2027')).toBe(true);
    expect(finalMilestone.endDate.startsWith('2027')).toBe(true);
  });

  it('9.4 should identify active milestone during ongoing examination period (Midterm)', () => {
    // Tri-Semester Fall 2026 Midterm: Dec 01, 2026 to Dec 08, 2026
    const midtermDate = new Date('2026-12-04T12:00:00');
    app.setMockTime(midtermDate);

    const progress = app.eval(`
      CalendarManager.getSemesterProgress(new Date('2026-12-04T12:00:00'), 'Fall 2026', 'triSemester')
    `);

    expect(progress).toBeDefined();
    expect(progress.currentMilestone).not.toBeNull();
    expect(progress.currentMilestone.title).toMatch(/midterm/i);
  });

  it('9.5 should identify next upcoming milestone and calculate remaining days/countdown', () => {
    // Date: Nov 15, 2026. Next milestone should be Midterm Examination (Dec 01, 2026)
    const testDate = new Date('2026-11-15T12:00:00');
    app.setMockTime(testDate);

    const progress = app.eval(`
      CalendarManager.getSemesterProgress(new Date('2026-11-15T12:00:00'), 'Fall 2026', 'triSemester')
    `);

    expect(progress).toBeDefined();
    expect(progress.nextMilestone).not.toBeNull();
    expect(progress.nextMilestone.title).toMatch(/midterm/i);
    if (progress.nextMilestoneCountdown) {
      expect(progress.nextMilestoneCountdown).toMatch(/(1[5-7]d|days)/i);
    }
  });

  it('9.6 should return 0% Upcoming before semester start and 100% Completed after final exam conclusion', () => {
    // 1. Before semester start: Oct 10, 2026
    const preProgress = app.eval(`
      CalendarManager.getSemesterProgress(new Date('2026-10-10T12:00:00'), 'Fall 2026', 'triSemester')
    `);
    expect(preProgress.progressPercentage).toBe(0);
    expect(preProgress.status).toBe('Upcoming');
    expect(preProgress.elapsedDays).toBe(0);

    // 2. After semester end: Feb 01, 2027
    const postProgress = app.eval(`
      CalendarManager.getSemesterProgress(new Date('2027-02-01T12:00:00'), 'Fall 2026', 'triSemester')
    `);
    expect(postProgress.progressPercentage).toBe(100);
    expect(postProgress.status).toBe('Completed');
    expect(postProgress.remainingDays).toBe(0);
  });

  it('9.7 should dynamically recalculate progress when switching systems between triSemester and biSemester', () => {
    const testDate = new Date('2026-10-25T12:00:00');
    app.setMockTime(testDate);

    // On Oct 25, 2026:
    // Tri-Semester starts today (Day 0 out of 91 => ~0%)
    const tri = app.eval(`CalendarManager.getSemesterProgress(new Date('2026-10-25T12:00:00'), 'Fall 2026', 'triSemester')`);
    expect(tri.progressPercentage).toBeLessThanOrEqual(5);

    // Bi-Semester started on Aug 16, 2026 (~70 days elapsed => ~43%)
    const bi = app.eval(`CalendarManager.getSemesterProgress(new Date('2026-10-25T12:00:00'), 'Fall 2026', 'biSemester')`);
    expect(bi.progressPercentage).toBeGreaterThanOrEqual(40);

    // System toggle reflects different duration and percentages
    expect(bi.totalDays).toBeGreaterThan(tri.totalDays);
    expect(bi.progressPercentage).toBeGreaterThan(tri.progressPercentage);
  });
});
