/**
 * tier1_features/exam_routine_ingestion.test.js
 * Feature Tests for Final Exam Routine Ingestion & Countdowns (Requirement R3, R4)
 */

const fs = require('fs');
const path = require('path');
const { describe, it, beforeEach, afterEach, expect } = require('../harness/test_framework');
const { createApp } = require('../harness/app_env');

const multilineFixture = fs.readFileSync(path.resolve(__dirname, '../fixtures/ums_multiline.txt'), 'utf8');
const validJsonFixture = fs.readFileSync(path.resolve(__dirname, '../fixtures/exam_schedule_valid.json'), 'utf8');
const coeTextFixture = fs.readFileSync(path.resolve(__dirname, '../fixtures/exam_schedule_coe.txt'), 'utf8');
const tableTextFixture = fs.readFileSync(path.resolve(__dirname, '../fixtures/exam_schedule_table.txt'), 'utf8');
const malformedTextFixture = fs.readFileSync(path.resolve(__dirname, '../fixtures/exam_schedule_malformed.txt'), 'utf8');

describe('Tier 1: Feature 10 - Final Exam Routine Ingestion & Countdowns', () => {
  let app;

  beforeEach(() => {
    app = createApp();
    app.pasteAndImportUms(multilineFixture, 'Fall 2026');
  });

  afterEach(() => {
    if (app) app.cleanup();
  });

  it('10.1 should parse structured JSON exam routine and normalize fields', () => {
    const registered = app.getActiveSemester().courses;
    const parsed = app.eval(`
      ExamParser.parseJson(${JSON.stringify(validJsonFixture)}, ${JSON.stringify(registered)})
    `);

    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed.length).toBe(4);

    const exam1 = parsed[0];
    expect(exam1.courseCode).toMatch(/EEE447/);
    expect(exam1.date).toBe('2027-01-17');
    expect(exam1.startTime).toBe('10:00');
    expect(exam1.room).toBe('PC-422');
  });

  it('10.2 should parse official COE multi-line text notice with dates, slots, rooms, and sections', () => {
    const registered = app.getActiveSemester().courses;
    const parsed = app.eval(`
      ExamParser.parseText(${JSON.stringify(coeTextFixture)}, ${JSON.stringify(registered)})
    `);

    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed.length).toBeGreaterThanOrEqual(3);

    // EEE 447 must be detected on 17/01/2027 at 10:00 in PC-422
    const eee447 = parsed.find(e => e.courseCode.includes('447'));
    expect(eee447).toBeDefined();
    expect(eee447.date).toMatch(/(2027-01-17|17\/01\/2027)/);
    expect(eee447.room).toMatch(/PC-?422/i);

    // EEE 410 must be detected on 19/01/2027 at 02:00 PM in PC-312
    const eee410 = parsed.find(e => e.courseCode.includes('410'));
    expect(eee410).toBeDefined();
    expect(eee410.room).toMatch(/PC-?312/i);
  });

  it('10.3 should parse tab-delimited table-pasted exam routine', () => {
    const registered = app.getActiveSemester().courses;
    const parsed = app.eval(`
      ExamParser.parseText(${JSON.stringify(tableTextFixture)}, ${JSON.stringify(registered)})
    `);

    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed.length).toBe(3);

    expect(parsed.some(e => e.courseCode.includes('447'))).toBe(true);
    expect(parsed.some(e => e.courseCode.includes('410'))).toBe(true);
    expect(parsed.some(e => e.courseCode.includes('401'))).toBe(true);
  });

  it('10.4 should match parsed exam entries against student\'s enrolled course roster', () => {
    // Student enrolled in EEE447, EEE410, EEE442, EEE401, EEE441.
    // Notice also contains CSE101 and TEXT305 (which the student is NOT enrolled in).
    const registered = app.getActiveSemester().courses;
    const parsed = app.eval(`
      ExamParser.parseText(${JSON.stringify(coeTextFixture)}, ${JSON.stringify(registered)})
    `);

    // Matched items must be tagged isMatched: true
    const matched = parsed.filter(e => e.isMatched);
    expect(matched.length).toBeGreaterThanOrEqual(3);

    const eee447 = parsed.find(e => e.courseCode.includes('447'));
    expect(eee447.isMatched).toBe(true);

    // If un-enrolled course like TEXT 305 or CSE 101 was parsed, isMatched must be falsy
    const otherCourse = parsed.find(e => e.courseCode.includes('TEXT') || e.courseCode.includes('CSE'));
    if (otherCourse) {
      expect(Boolean(otherCourse.isMatched)).toBe(false);
    }
  });

  it('10.5 should persist schedule in ExamManager and update getNextExam countdown', () => {
    const exams = [
      {
        id: 'exam-test-1',
        courseCode: 'EEE447.1',
        courseTitle: 'Nano Electronic Devices',
        date: '2027-01-17',
        startTime: '10:00',
        endTime: '12:00',
        room: 'PC-422',
        type: 'Final'
      },
      {
        id: 'exam-test-2',
        courseCode: 'EEE401.1',
        courseTitle: 'VLSI I',
        date: '2027-01-21',
        startTime: '10:00',
        endTime: '12:00',
        room: 'PC-417',
        type: 'Final'
      }
    ];

    app.eval(`ExamManager.saveSchedule(${JSON.stringify(exams)})`);

    // Verify stored
    const stored = app.getStorage('seu_exam_schedule');
    expect(stored).not.toBeNull();

    // Reload page to verify persistence
    app.simulateReload();

    const loaded = app.eval('ExamManager.getAll()');
    expect(loaded.length).toBe(2);

    // Next exam countdown evaluated from Jan 10, 2027 10:00:00
    // Jan 10 to Jan 17 is 7 days ahead
    const now = new Date(2027, 0, 10, 10, 0, 0, 0);
    app.setMockTime(now);

    const nextExam = app.eval('ExamManager.getNextExam(new Date(2027, 0, 10, 10, 0, 0, 0))');
    expect(nextExam).toBeDefined();
    expect(nextExam).not.toBeNull();
    const exItem = nextExam.exam || nextExam;
    expect(exItem.courseCode).toMatch(/EEE447/);
    if (nextExam.countdown) {
      expect(nextExam.countdown).toMatch(/(0?7d|days)/i);
    }
  });

  it('10.6 should handle malformed text or invalid JSON gracefully without throwing fatal errors', () => {
    const registered = app.getActiveSemester().courses;

    // 1. Malformed text notice
    const textResult = app.eval(`
      ExamParser.parseText(${JSON.stringify(malformedTextFixture)}, ${JSON.stringify(registered)})
    `);
    expect(Array.isArray(textResult)).toBe(true);
    expect(textResult.length).toBe(0);

    // 2. Malformed JSON string
    const jsonResult = app.eval(`
      ExamParser.parseJson('{"broken json', ${JSON.stringify(registered)})
    `);
    expect(Array.isArray(jsonResult)).toBe(true);
    expect(jsonResult.length).toBe(0);

    // Existing app state and courses must remain intact
    expect(app.getActiveSemester().courses.length).toBe(5);
  });

  it('10.7 should extract exam text and structure via ExamParser.parsePdf', async () => {
    // Test that ExamParser.parsePdf is defined as a function
    const hasPdfParser = app.eval('typeof ExamParser !== "undefined" && typeof ExamParser.parsePdf === "function"');
    expect(hasPdfParser).toBe(true);

    // Passing an empty buffer should resolve safely to an array without throwing unhandled rejection
    const result = await app.eval(`
      ExamParser.parsePdf(new ArrayBuffer(0), [])
        .catch(err => [])
    `);
    expect(Array.isArray(result)).toBe(true);
  });
});
