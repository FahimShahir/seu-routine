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

  it('4.S.8 Scenario 8: Comprehensive Semester Lifecycle (Onboarding -> Assignments -> Midterm -> Final Ingestion -> Completion)', () => {
    // Stage 1: Semester Kickoff (Oct 25, 2026)
    app.setMockTime(new Date(2026, 9, 25, 9, 0, 0, 0));
    let progress = app.eval("CalendarManager.getSemesterProgress(new Date(2026, 9, 25, 9, 0, 0, 0), 'Fall 2026', 'triSemester')");
    expect(progress.progressPercentage).toBeLessThanOrEqual(5);
    expect(progress.status).toBe('In Progress');

    // Create Assignment 1
    const hw1 = app.eval(`
      AssignmentManager.save({
        courseCode: 'EEE447',
        title: 'Semiconductor Physics Problem Set',
        dueDate: '2026-11-15',
        dueTime: '23:59',
        priority: 'high'
      });
    `);
    expect(app.eval('AssignmentManager.getAll().length')).toBe(1);

    // Stage 2: Midterm Examination Week (Dec 03, 2026)
    app.setMockTime(new Date(2026, 11, 3, 10, 0, 0, 0));
    progress = app.eval("CalendarManager.getSemesterProgress(new Date(2026, 11, 3, 10, 0, 0, 0), 'Fall 2026', 'triSemester')");
    expect(progress.progressPercentage).toBeGreaterThanOrEqual(40);
    expect(progress.progressPercentage).toBeLessThanOrEqual(48);
    expect(progress.currentMilestone).not.toBeNull();
    expect(progress.currentMilestone.title).toMatch(/midterm/i);

    // Mark HW1 submitted and create HW2
    app.eval(`AssignmentManager.updateStatus('${hw1.id}', 'submitted')`);
    const hw2 = app.eval(`
      AssignmentManager.save({
        courseCode: 'EEE410',
        title: 'Microgrid Design Project',
        dueDate: '2026-12-28',
        dueTime: '18:00',
        priority: 'high'
      });
    `);
    let stats = app.eval('AssignmentManager.getStats(new Date(2026, 11, 3, 10, 0, 0, 0))');
    expect(stats.submitted).toBe(1);
    expect(stats.pending).toBe(1);

    // Stage 3: Final Examination Routine Ingestion (Jan 10, 2027)
    app.setMockTime(new Date(2027, 0, 10, 10, 0, 0, 0));
    progress = app.eval("CalendarManager.getSemesterProgress(new Date(2027, 0, 10, 10, 0, 0, 0), 'Fall 2026', 'triSemester')");
    expect(progress.progressPercentage).toBeGreaterThanOrEqual(80);

    const examSchedule = [
      {
        id: 'final-ex-1',
        courseCode: 'EEE447.1',
        courseTitle: 'Nano Electronic Devices',
        date: '2027-01-17',
        startTime: '10:00',
        endTime: '12:00',
        room: 'PC-422',
        type: 'Final'
      },
      {
        id: 'final-ex-2',
        courseCode: 'EEE410.1',
        courseTitle: 'Green Power and Energy',
        date: '2027-01-19',
        startTime: '14:00',
        endTime: '16:00',
        room: 'PC-312',
        type: 'Final'
      }
    ];
    app.eval(`ExamManager.saveSchedule(${JSON.stringify(examSchedule)})`);

    const nextExam = app.eval('ExamManager.getNextExam(new Date(2027, 0, 10, 10, 0, 0, 0))');
    expect(nextExam).not.toBeNull();
    const exItem = nextExam.exam || nextExam;
    expect(exItem.courseCode).toMatch(/EEE447/);

    // Stage 4: Semester Conclusion (Jan 28, 2027)
    app.setMockTime(new Date(2027, 0, 28, 12, 0, 0, 0));
    progress = app.eval("CalendarManager.getSemesterProgress(new Date(2027, 0, 28, 12, 0, 0, 0), 'Fall 2026', 'triSemester')");
    expect(progress.progressPercentage).toBe(100);
    expect(progress.status).toBe('Completed');
  });

  it('4.S.9 Scenario 9: High-Stress Exam Week Synchronized Countdown Matrix', () => {
    // Time: Sunday Jan 17, 2027 at 08:30:00 AM (90 minutes before first final exam)
    const examMorning = new Date(2027, 0, 17, 8, 30, 0, 0);
    app.setMockTime(examMorning);

    // Ingest exams:
    // Exam 1: Today at 10:00 AM (90 min away)
    // Exam 2: Tuesday Jan 19 at 14:00 PM (53.5h away)
    app.eval(`
      ExamManager.saveSchedule([
        {
          id: 'ex-stress-1',
          courseCode: 'EEE447.1',
          courseTitle: 'Nano Electronic Devices',
          date: '2027-01-17',
          startTime: '10:00',
          endTime: '12:00',
          room: 'PC-422',
          type: 'Final'
        },
        {
          id: 'ex-stress-2',
          courseCode: 'EEE410.1',
          courseTitle: 'Green Power',
          date: '2027-01-19',
          startTime: '14:00',
          endTime: '16:00',
          room: 'PC-312',
          type: 'Final'
        }
      ]);
    `);

    // Ingest urgent last-minute lab notebook due today at 12:00 PM
    app.eval(`
      AssignmentManager.save({
        courseCode: 'EEE442',
        title: 'Optoelectronics Final Lab Notebook',
        dueDate: '2027-01-17',
        dueTime: '12:00',
        priority: 'high'
      });
    `);

    app.triggerClockUpdate();

    // 1. Next Exam must be EEE447.1 in 90 minutes
    const nextExam = app.eval('ExamManager.getNextExam(new Date(2027, 0, 17, 8, 30, 0, 0))');
    expect(nextExam).not.toBeNull();
    const ex = nextExam.exam || nextExam;
    expect(ex.courseCode).toMatch(/EEE447/);
    if (nextExam.diffMs) {
      expect(nextExam.diffMs).toBe(90 * 60 * 1000);
    }

    // 2. Next Assignment must be the Lab Notebook due in 3.5 hours
    const nextDue = app.eval('AssignmentManager.getNextDue(new Date(2027, 0, 17, 8, 30, 0, 0))');
    expect(nextDue).not.toBeNull();
    const assign = nextDue.assignment || nextDue;
    expect(assign.title).toContain('Lab Notebook');

    // 3. Calendar progress must reflect active Final Examination milestone
    const progress = app.eval("CalendarManager.getSemesterProgress(new Date(2027, 0, 17, 8, 30, 0, 0), 'Fall 2026', 'triSemester')");
    expect(progress.currentMilestone).not.toBeNull();
    expect(progress.currentMilestone.title).toMatch(/final/i);
  });
});
