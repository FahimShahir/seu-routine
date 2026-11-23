/**
 * tier1_features/ums_ingestion.test.js
 * Feature Tests for UMS Text Ingestion (Requirement R1, R4)
 */

const fs = require('fs');
const path = require('path');
const { describe, it, beforeEach, afterEach, expect } = require('../harness/test_framework');
const { createApp } = require('../harness/app_env');

const multilineFixture = fs.readFileSync(path.resolve(__dirname, '../fixtures/ums_multiline.txt'), 'utf8');
const tabFixture = fs.readFileSync(path.resolve(__dirname, '../fixtures/ums_singleline_tab.txt'), 'utf8');

describe('Tier 1: Feature 1 - UMS Text Ingestion', () => {
  let app;

  beforeEach(() => {
    app = createApp();
  });

  afterEach(() => {
    if (app) app.cleanup();
  });

  it('1.1 should parse all courses and metadata from multi-line UMS paste', () => {
    app.pasteAndImportUms(multilineFixture, 'Fall 2026');
    const sem = app.getActiveSemester();

    expect(sem).toBeDefined();
    expect(sem.courses.length).toBe(5);

    const codes = sem.courses.map(c => c.codeWithSec);
    expect(codes).toContain('EEE447.1');
    expect(codes).toContain('EEE410.1');
    expect(codes).toContain('EEE442.2');
    expect(codes).toContain('EEE401.1');
    expect(codes).toContain('EEE441.2');

    const c1 = sem.courses.find(c => c.code === 'EEE447');
    expect(c1.title).toBe('Nano Electronic Devices');
    expect(c1.faculty.initials).toBe('MRT');
    expect(c1.faculty.name).toBe('Ruchira Tabassum');
    expect(c1.faculty.email).toBe('ruchira.tabassum@seu.edu.bd');
  });

  it('1.2 should parse single-line tab-delimited UMS table rows without dropping schedules', () => {
    app.pasteAndImportUms(tabFixture, 'Fall 2026');
    const sem = app.getActiveSemester();

    expect(sem).toBeDefined();
    expect(sem.courses.length).toBeGreaterThanOrEqual(5);

    const c1 = sem.courses.find(c => c.codeWithSec === 'EEE447.1');
    expect(c1).toBeDefined();
    expect(c1.title).toBe('Nano Electronic Devices');
    expect(c1.schedules.length).toBeGreaterThanOrEqual(1);
    expect(c1.schedules[0].room).toBe('PC422');
  });

  it('1.3 should extract student header metadata (ID, code, name, batch, program)', () => {
    app.pasteAndImportUms(multilineFixture, 'Fall 2026');
    const profile = app.getActiveProfile();

    expect(profile).toBeDefined();
    expect(profile.name).toBe('F.U.M Foyjul Bari Shahir');
    expect(profile.studentId).toBe('0232330005131002');
    expect(profile.code).toBe('2023200500002');
    expect(profile.batch).toBe('42');
    expect(profile.program).toBe('BSc in EEE');
  });

  it('1.4 should distinguish Lab (1.5 credits) from Theory (3.0 credits)', () => {
    app.pasteAndImportUms(multilineFixture, 'Fall 2026');
    const sem = app.getActiveSemester();

    const lab = sem.courses.find(c => c.codeWithSec === 'EEE442.2');
    const theory = sem.courses.find(c => c.codeWithSec === 'EEE447.1');

    expect(lab).toBeDefined();
    expect(lab.type).toBe('Lab');
    expect(lab.credits).toBe(1.5);

    expect(theory).toBeDefined();
    expect(theory.type).toBe('Theory');
    expect(theory.credits).toBe(3.0);
  });

  it('1.5 should capture multiple schedule slots on a single course', () => {
    app.pasteAndImportUms(multilineFixture, 'Fall 2026');
    const sem = app.getActiveSemester();

    const c = sem.courses.find(c => c.codeWithSec === 'EEE447.1');
    expect(c).toBeDefined();
    expect(c.schedules.length).toBe(2);

    expect(c.schedules[0].day).toBe('SUN');
    expect(c.schedules[0].startTime).toBe('10:00');
    expect(c.schedules[0].endTime).toBe('11:20');
    expect(c.schedules[0].room).toBe('PC422');

    expect(c.schedules[1].day).toBe('WED');
    expect(c.schedules[1].startTime).toBe('10:00');
    expect(c.schedules[1].endTime).toBe('11:20');
    expect(c.schedules[1].room).toBe('PC413');
  });

  it('1.6 should render course badges and rows in UI after UMS import', () => {
    app.pasteAndImportUms(multilineFixture, 'Fall 2026');
    const mainAppDisplay = app.query('#mainAppContent').style.display;
    expect(mainAppDisplay).not.toBe('none');

    const timetableBody = app.query('#timetableGridBody');
    const courseTableBody = app.query('#courseTableBody');
    expect(timetableBody || courseTableBody).toBeDefined();

    const combinedHtml = (timetableBody ? timetableBody.innerHTML : '') + ' ' + (courseTableBody ? courseTableBody.innerHTML : '');
    expect(combinedHtml).toContain('EEE447');
    expect(combinedHtml).toContain('PC422');
  });
});
