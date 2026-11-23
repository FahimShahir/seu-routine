/**
 * tests/tier1_features/two_step_ums_wizard.test.js
 * Feature Tests for 2-Step UMS Ingestion Wizard, Validation, and Dynamic GPA Growth
 */

const fs = require('fs');
const path = require('path');
const { describe, it, beforeEach, afterEach, expect } = require('../harness/test_framework');
const { createApp } = require('../harness/app_env');

const aboutSampleText = `
About
Registered Courses
Class Attendance
0
Preregistered Courses
Total:
0 Credits
6
Registered Course
Total:
15 Credits
114
Credits Completed
Attempted:
123 Credits
৳ -27,480.00
Due Amount
Basic Information


F.U.M Foyjul Bari Shahir
Batch: 42
BSc in EEE
View full profile
Code
2023200500002
ID
0232330005131002
Program
BSc in EEE
Starting Semester
Fall 2023
Last Semester
Summer 2026
Adviser
Card cover image
Faculty
Dr. Nur Hosain Md. Ariful Azim
Coordinator & Professor
Department of Electrical & Electronic Engineering
Your Growth
1.19
Summer 2026
2.93
Spring 2026
2.77
Fall 2025
2.73
Summer 2025
`;

const registeredCoursesSampleText = `
Registered Courses
Course
Faculty
Schedule
EEE442.2
Optoelectronics Laboratory
[RR] Rakayet Rafi
rakayet.rafi@seu.edu.bd
MON # 14:00 ~ 16:00 @ PC211
EEE447.1
Nano Electronic Devices
[MRT] Ruchira Tabassum
ruchira.tabassum@seu.edu.bd
SUN # 10:00 ~ 11:20 @ PC422
WED # 10:00 ~ 11:20 @ PC413
EEE410.1
Green Power and Energy
[PJD] Puja Das
puja.das@seu.edu.bd
SUN # 13:30 ~ 14:50 @ PC422
WED # 13:30 ~ 14:50 @ PC417
EEE401.1
VLSI I
[SMR] S. M. Razibur Rahman
sm.raziburrahman@seu.edu.bd
MON # 16:30 ~ 17:50 @ PC422
WED # 16:30 ~ 17:50 @ PC417
EEE441.2
Optoelectronics
[RR] Rakayet Rafi
rakayet.rafi@seu.edu.bd
TUE # 08:30 ~ 09:50 @ PC408
THU # 08:30 ~ 09:50 @ PC422
`;

describe('Tier 1: Feature 7 - 2-Step UMS Ingestion Wizard & Dynamic Profile', () => {
  let app;

  beforeEach(() => {
    app = createApp();
  });

  afterEach(() => {
    if (app) app.cleanup();
  });

  it('7.1 should extract complete student metadata, dues, and semester GPAs from UMS About text', () => {
    const parsed = app.window.parseUmsAbout(aboutSampleText);
    expect(parsed).toBeDefined();
    expect(parsed.name).toBe('F.U.M Foyjul Bari Shahir');
    expect(parsed.studentId).toBe('0232330005131002');
    expect(parsed.studentCode).toBe('2023200500002');
    expect(parsed.batch).toBe('42');
    expect(parsed.program).toBe('BSc in EEE');
    expect(parsed.dueAmount).toBe('৳ -27,480.00');
    expect(parsed.creditsCompleted).toBe('114');
    expect(parsed.creditsAttempted).toBe('123');
    expect(parsed.advisor.name).toBe('Dr. Nur Hosain Md. Ariful Azim');
    expect(parsed.gpaHistory.length).toBe(4);
    expect(parsed.gpaHistory[0].term).toBe('Summer 2026');
    expect(parsed.gpaHistory[0].gpa).toBe(1.19);
  });

  it('7.2 should identify missing fields and alert user when UMS About text is truncated', () => {
    const truncatedText = 'F.U.M Foyjul Bari Shahir\nBatch 42\nProgram BSc in EEE';
    const parsed = app.window.parseUmsAbout(truncatedText);
    const val = app.window.validateUmsAbout(parsed);

    expect(val.isValid).toBe(false);
    expect(val.missing.length).toBeGreaterThan(0);

    // Test in DOM
    const aboutInput = app.query('#importAboutText');
    aboutInput.value = truncatedText;
    app.window.validateAboutStepAndProceed();

    const alertEl = app.query('#umsAboutValidationAlert');
    expect(alertEl.className).toContain('block');
    expect(alertEl.innerHTML).toContain('মিসিং ফিল্ড');
  });

  it('7.3 should successfully complete 2-step wizard flow and render personalized hub', () => {
    // Step 1: Paste About
    const aboutInput = app.query('#importAboutText');
    aboutInput.value = aboutSampleText;
    app.window.validateAboutStepAndProceed();

    // Verify step 2 transition
    const step2Container = app.query('#umsStep2Container');
    expect(step2Container.className).not.toContain('hidden');

    const s2Name = app.query('#step2StudentName').textContent;
    expect(s2Name).toBe('F.U.M Foyjul Bari Shahir');

    // Step 2: Paste Registered Courses
    const regInput = app.query('#importRawText');
    regInput.value = registeredCoursesSampleText;
    app.query('#importTargetSemester').value = 'Summer 2026';
    app.window.completeTwoStepImport();

    // Verify Main App content is visible and demo mode is false
    expect(app.isDemoMode()).toBe(false);
    expect(app.query('#mainAppContent').style.display).not.toBe('none');

    // Check active profile
    const profile = app.getActiveProfile();
    expect(profile.name).toBe('F.U.M Foyjul Bari Shahir');
    expect(profile.studentId).toBe('0232330005131002');
    expect(profile.dueAmount).toBe('৳ -27,480.00');
    expect(profile.creditsCompleted).toBe('114');
  });

  it('7.4 should dynamically render real dues, credits completed, and GPA Growth in Profile tab', () => {
    // Import complete profile
    const aboutInput = app.query('#importAboutText');
    aboutInput.value = aboutSampleText;
    app.window.validateAboutStepAndProceed();

    const regInput = app.query('#importRawText');
    regInput.value = registeredCoursesSampleText;
    app.window.completeTwoStepImport();

    // Switch to Profile Tab
    app.window.switchTab('profile');

    const dueVal = app.query('#profileDueVal').textContent;
    expect(dueVal).toBe('৳ -27,480.00');

    const crVal = app.query('#profileCreditsCompletedVal').textContent;
    expect(crVal).toBe('114 Cr');

    const gpaList = app.query('#profileGpaGrowthList');
    expect(gpaList).toBeDefined();
    expect(gpaList.innerHTML).toContain('Summer 2026');
    expect(gpaList.innerHTML).toContain('1.19');
    expect(gpaList.innerHTML).toContain('Spring 2026');
    expect(gpaList.innerHTML).toContain('2.93');
  });

  it('7.5 should adapt to any student with different name, dues, and GPA history without hardcoding', () => {
    const customStudentText = `
About
Registered Courses
Total:
12 Credits
45
Credits Completed
Attempted:
50 Credits
৳ 14,250.00
Due Amount
Basic Information
Tanvir Rahman
Batch: 45
BSc in CSE
Code
2024100500009
ID
0242330005139999
Program
BSc in CSE
Starting Semester
Spring 2024
Last Semester
Fall 2027
Adviser
Faculty
Prof. Dr. M. A. Karim
Your Growth
3.75
Spring 2025
3.60
Fall 2024
    `;

    const parsed = app.window.parseUmsAbout(customStudentText);
    expect(parsed.name).toBe('Tanvir Rahman');
    expect(parsed.studentId).toBe('0242330005139999');
    expect(parsed.dueAmount).toBe('৳ 14,250.00');
    expect(parsed.creditsCompleted).toBe('45');
    expect(parsed.gpaHistory.length).toBe(2);
    expect(parsed.gpaHistory[0].gpa).toBe(3.75);

    // Import into app
    app.query('#importAboutText').value = customStudentText;
    app.window.validateAboutStepAndProceed();
    app.query('#importRawText').value = registeredCoursesSampleText;
    app.window.completeTwoStepImport();

    expect(app.query('#profileStudentName').textContent).toBe('Tanvir Rahman');
    expect(app.query('#profileDueVal').textContent).toBe('৳ 14,250.00');
    expect(app.query('#profileCreditsCompletedVal').textContent).toBe('45 Cr');
    expect(app.query('#profileGpaGrowthList').innerHTML).toContain('Spring 2025');
    expect(app.query('#profileGpaGrowthList').innerHTML).toContain('3.75');
  });
});
