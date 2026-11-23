/**
 * tier1_features/json_upload.test.js
 * Feature Tests for JSON Routine Upload (Requirement R1, R4)
 */

const fs = require('fs');
const path = require('path');
const { describe, it, beforeEach, afterEach, expect } = require('../harness/test_framework');
const { createApp } = require('../harness/app_env');

const sampleJsonFixture = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, '../fixtures/seu_routine_sample.json'), 'utf8')
);

describe('Tier 1: Feature 2 - JSON Routine Upload', () => {
  let app;

  beforeEach(() => {
    app = createApp();
  });

  afterEach(() => {
    if (app) app.cleanup();
  });

  it('2.1 should restore complete profile and course roster from valid JSON', async () => {
    app.uploadJson(sampleJsonFixture);
    // Allow any async event loop callbacks
    await new Promise(r => setTimeout(r, 20));

    const appData = app.getAppData();
    expect(appData).toBeDefined();
    expect(appData).not.toBeNull();
    expect(appData.profiles[0].name).toBe('F.U.M Foyjul Bari Shahir');
    expect(appData.profiles[0].studentId).toBe('0232330005131002');

    const sem = app.getActiveSemester();
    expect(sem).toBeDefined();
    expect(sem.courses.length).toBe(5);
  });

  it('2.2 should save uploaded JSON to localStorage without getting wiped by initStore', async () => {
    app.uploadJson(sampleJsonFixture);
    await new Promise(r => setTimeout(r, 20));

    const stored = app.getStorage('SEU_STUDENT_ROUTINE_V2');
    expect(stored).toBeDefined();
    expect(stored).not.toBeNull();
    expect(stored.profiles[0].id).toBe('prof-shahir');
    expect(stored.profiles[0].semesters['Fall 2026'].courses.length).toBe(5);
  });

  it('2.3 should reset isDemoMode flag to false on JSON upload', async () => {
    app.window.loadSampleDemo();
    expect(app.isDemoMode()).toBe(true);

    app.uploadJson(sampleJsonFixture);
    await new Promise(r => setTimeout(r, 20));

    expect(app.isDemoMode()).toBe(false);
  });

  it('2.4 should switch view from onboarding hub to main app content after upload', async () => {
    // Initial state: onboarding visible, main content hidden
    expect(app.query('#mainAppContent').style.display).toBe('none');

    app.uploadJson(sampleJsonFixture);
    await new Promise(r => setTimeout(r, 20));

    expect(app.query('#mainAppContent').style.display).not.toBe('none');
    expect(app.query('#onboardingHub').style.display).toBe('none');
  });

  it('2.5 should preserve faculty initials, official emails, and schedules exactly', async () => {
    app.uploadJson(sampleJsonFixture);
    await new Promise(r => setTimeout(r, 20));

    const sem = app.getActiveSemester();
    const c = sem.courses.find(x => x.code === 'EEE441');
    expect(c).toBeDefined();
    expect(c.faculty.initials).toBe('RR');
    expect(c.faculty.email).toBe('rakayet.rafi@seu.edu.bd');
    expect(c.schedules.length).toBe(2);
    expect(c.schedules[0].day).toBe('TUE');
    expect(c.schedules[0].room).toBe('PC408');
  });

  it('2.6 should trigger alert and reject invalid JSON schema with missing profiles', async () => {
    app.uploadJson({ invalid: 'schema' });
    await new Promise(r => setTimeout(r, 20));

    expect(app.alerts.length).toBeGreaterThan(0);
    expect(app.getStorage('SEU_STUDENT_ROUTINE_V2')).toBeNull();
  });
});
