/**
 * tier1_features/assignment_deadlines.test.js
 * Feature Tests for Assignment Deadline Tracking (Requirement R1, R4)
 */

const fs = require('fs');
const path = require('path');
const { describe, it, beforeEach, afterEach, expect } = require('../harness/test_framework');
const { createApp } = require('../harness/app_env');

const multilineFixture = fs.readFileSync(path.resolve(__dirname, '../fixtures/ums_multiline.txt'), 'utf8');

describe('Tier 1: Feature 8 - Assignment Deadline Tracking', () => {
  let app;

  beforeEach(() => {
    app = createApp();
    app.pasteAndImportUms(multilineFixture, 'Fall 2026');
  });

  afterEach(() => {
    if (app) app.cleanup();
  });

  it('8.1 should create new assignment with course linkage, default pending status, and unique ID', () => {
    const created = app.eval(`
      AssignmentManager.save({
        courseCode: 'EEE447',
        courseTitle: 'Nano Electronic Devices',
        title: 'Nanowire Simulation Report',
        dueDate: '2026-11-30',
        dueTime: '23:59',
        priority: 'high',
        description: 'Complete TCAD device simulation writeup'
      });
    `);

    expect(created).toBeDefined();
    expect(created.id).toBeDefined();
    expect(created.courseCode).toBe('EEE447');
    expect(created.title).toBe('Nanowire Simulation Report');
    expect(created.dueDate).toBe('2026-11-30');
    expect(created.dueTime).toBe('23:59');
    expect(created.priority).toBe('high');
    expect(created.status).toBe('pending');

    const all = app.eval('AssignmentManager.getAll()');
    expect(Array.isArray(all)).toBe(true);
    expect(all.length).toBe(1);
    expect(all[0].id).toBe(created.id);
  });

  it('8.2 should edit existing assignment fields while preserving ID and creation timestamp', () => {
    const original = app.eval(`
      AssignmentManager.save({
        courseCode: 'EEE410',
        title: 'Renewable Solar Draft',
        dueDate: '2026-12-05',
        dueTime: '17:00',
        priority: 'medium'
      });
    `);
    const originalId = original.id;
    const createdAt = original.createdAt;

    const updated = app.eval(`
      AssignmentManager.save({
        id: '${originalId}',
        courseCode: 'EEE410',
        title: 'Renewable Solar Final Presentation',
        dueDate: '2026-12-07',
        dueTime: '20:00',
        priority: 'high',
        description: 'Updated slide deck with PV inverter analysis'
      });
    `);

    expect(updated.id).toBe(originalId);
    if (createdAt) {
      expect(updated.createdAt).toBe(createdAt);
    }
    expect(updated.title).toBe('Renewable Solar Final Presentation');
    expect(updated.dueDate).toBe('2026-12-07');
    expect(updated.dueTime).toBe('20:00');
    expect(updated.priority).toBe('high');

    const fetched = app.eval(`AssignmentManager.getById('${originalId}')`);
    expect(fetched.title).toBe('Renewable Solar Final Presentation');
  });

  it('8.3 should remove assignment by ID and verify getById returns null and getAll updates', () => {
    const item1 = app.eval(`
      AssignmentManager.save({
        courseCode: 'EEE401',
        title: 'VLSI Layout Project',
        dueDate: '2026-12-10',
        dueTime: '23:59',
        priority: 'high'
      });
    `);
    const item2 = app.eval(`
      AssignmentManager.save({
        courseCode: 'EEE441',
        title: 'Laser Diode Problem Set',
        dueDate: '2026-12-12',
        dueTime: '18:00',
        priority: 'low'
      });
    `);

    expect(app.eval('AssignmentManager.getAll().length')).toBe(2);

    const deleteSuccess = app.eval(`AssignmentManager.delete('${item1.id}')`);
    expect(deleteSuccess).toBe(true);

    const remaining = app.eval('AssignmentManager.getAll()');
    expect(remaining.length).toBe(1);
    expect(remaining[0].id).toBe(item2.id);

    const deletedLookup = app.eval(`AssignmentManager.getById('${item1.id}')`);
    expect(deletedLookup).toBeNull();
  });

  it('8.4 should cycle or update assignment status (pending, in_progress, submitted, overdue)', () => {
    const item = app.eval(`
      AssignmentManager.save({
        courseCode: 'EEE447',
        title: 'Status Lifecycle Test',
        dueDate: '2026-11-28',
        dueTime: '23:59',
        priority: 'medium'
      });
    `);
    expect(item.status).toBe('pending');

    // Update to in_progress
    const inProg = app.eval(`AssignmentManager.updateStatus('${item.id}', 'in_progress')`);
    expect(inProg.status).toBe('in_progress');

    // Update to submitted
    const submitted = app.eval(`AssignmentManager.updateStatus('${item.id}', 'submitted')`);
    expect(submitted.status).toBe('submitted');

    // Test toggleStatus: from submitted back to pending or toggling state
    const toggled = app.eval(`AssignmentManager.toggleStatus('${item.id}')`);
    expect(toggled).toBeDefined();
    expect(toggled.status).not.toBe('submitted');
  });

  it('8.5 should calculate countdown to next due assignment and flag overdue tasks', () => {
    // Current simulated time: Nov 24, 2026 12:00:00
    app.setMockTime(new Date(2026, 10, 24, 12, 0, 0, 0));

    // Overdue assignment (due yesterday Nov 23, 2026)
    app.eval(`
      AssignmentManager.save({
        courseCode: 'EEE441',
        title: 'Past Assignment',
        dueDate: '2026-11-23',
        dueTime: '23:59',
        priority: 'medium'
      });
    `);

    // Next upcoming assignment (due in 2 days: Nov 26, 2026 14:00:00)
    app.eval(`
      AssignmentManager.save({
        courseCode: 'EEE447',
        title: 'Upcoming Lab Report',
        dueDate: '2026-11-26',
        dueTime: '14:00',
        priority: 'high'
      });
    `);

    // Farther upcoming assignment (due in 5 days)
    app.eval(`
      AssignmentManager.save({
        courseCode: 'EEE401',
        title: 'Farther Assignment',
        dueDate: '2026-11-29',
        dueTime: '18:00',
        priority: 'low'
      });
    `);

    const nextDue = app.eval('AssignmentManager.getNextDue(new Date(2026, 10, 24, 12, 0, 0, 0))');
    expect(nextDue).toBeDefined();
    expect(nextDue).not.toBeNull();
    expect(nextDue.assignment ? nextDue.assignment.title : nextDue.title).toBe('Upcoming Lab Report');
    // Difference from Nov 24 12:00 to Nov 26 14:00 is 50 hours (2 days 2 hours)
    expect(nextDue.diffMs || nextDue.remainingMs).toBeGreaterThan(0);
    if (nextDue.countdown) {
      expect(nextDue.countdown).toMatch(/(0?2d|50h)/);
    }
  });

  it('8.6 should persist assignments in localStorage["seu_assignments"] across simulated browser reloads', () => {
    app.eval(`
      AssignmentManager.save({
        courseCode: 'EEE447',
        title: 'Persistent HW 1',
        dueDate: '2026-12-01',
        dueTime: '23:59',
        priority: 'high'
      });
    `);

    // Verify written to storage
    const stored = app.getStorage('seu_assignments');
    expect(stored).not.toBeNull();

    // Reload page
    app.simulateReload();

    const loadedAll = app.eval('AssignmentManager.getAll()');
    expect(loadedAll.length).toBe(1);
    expect(loadedAll[0].title).toBe('Persistent HW 1');
    expect(loadedAll[0].courseCode).toBe('EEE447');
  });

  it('8.7 should compute accurate assignment statistics (total, pending, inProgress, submitted, overdue)', () => {
    // Current simulated time: Nov 24, 2026 12:00:00
    const now = new Date(2026, 10, 24, 12, 0, 0, 0);
    app.setMockTime(now);

    // Overdue item (due in past and still pending)
    app.eval(`
      AssignmentManager.save({
        courseCode: 'EEE447',
        title: 'Overdue HW',
        dueDate: '2026-11-20',
        dueTime: '12:00',
        priority: 'high'
      });
    `);

    // In-progress item (due future)
    const inProg = app.eval(`
      AssignmentManager.save({
        courseCode: 'EEE410',
        title: 'Active Draft',
        dueDate: '2026-11-28',
        dueTime: '12:00',
        priority: 'medium'
      });
    `);
    app.eval(`AssignmentManager.updateStatus('${inProg.id}', 'in_progress')`);

    // Submitted item (due future)
    const sub = app.eval(`
      AssignmentManager.save({
        courseCode: 'EEE401',
        title: 'Done Project',
        dueDate: '2026-11-27',
        dueTime: '12:00',
        priority: 'low'
      });
    `);
    app.eval(`AssignmentManager.updateStatus('${sub.id}', 'submitted')`);

    // Pending item (due future)
    app.eval(`
      AssignmentManager.save({
        courseCode: 'EEE441',
        title: 'Pending Reading',
        dueDate: '2026-11-30',
        dueTime: '12:00',
        priority: 'low'
      });
    `);

    const stats = app.eval('AssignmentManager.getStats(new Date(2026, 10, 24, 12, 0, 0, 0))');
    expect(stats).toBeDefined();
    expect(stats.total).toBe(4);
    expect(stats.inProgress).toBe(1);
    expect(stats.submitted).toBe(1);
    expect(stats.overdue).toBe(1);
    expect(stats.pending).toBe(1);
  });
});
