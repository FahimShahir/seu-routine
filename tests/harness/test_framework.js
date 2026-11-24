/**
 * test_framework.js
 * Lightweight, zero-dependency async test framework for SEU Routine E2E testing.
 */

class Expectation {
  constructor(actual, isNot = false) {
    this.actual = actual;
    this.isNot = isNot;
  }

  get not() {
    return new Expectation(this.actual, !this.isNot);
  }

  _evaluate(condition, message) {
    const passed = this.isNot ? !condition : condition;
    if (!passed) {
      throw new Error(message);
    }
  }

  toBe(expected) {
    this._evaluate(
      this.actual === expected,
      `Expected ${JSON.stringify(this.actual)} ${this.isNot ? 'not to be' : 'to be'} ${JSON.stringify(expected)}`
    );
  }

  toEqual(expected) {
    const actualStr = JSON.stringify(this.actual);
    const expectedStr = JSON.stringify(expected);
    this._evaluate(
      actualStr === expectedStr,
      `Expected ${actualStr} ${this.isNot ? 'not to equal' : 'to equal'} ${expectedStr}`
    );
  }

  toBeTruthy() {
    this._evaluate(
      Boolean(this.actual),
      `Expected ${JSON.stringify(this.actual)} ${this.isNot ? 'not to be truthy' : 'to be truthy'}`
    );
  }

  toBeFalsy() {
    this._evaluate(
      !this.actual,
      `Expected ${JSON.stringify(this.actual)} ${this.isNot ? 'not to be falsy' : 'to be falsy'}`
    );
  }

  toBeNull() {
    this._evaluate(
      this.actual === null,
      `Expected ${JSON.stringify(this.actual)} ${this.isNot ? 'not to be null' : 'to be null'}`
    );
  }

  toBeDefined() {
    this._evaluate(
      typeof this.actual !== 'undefined',
      `Expected ${JSON.stringify(this.actual)} ${this.isNot ? 'to be undefined' : 'to be defined'}`
    );
  }

  toBeGreaterThan(expected) {
    this._evaluate(
      this.actual > expected,
      `Expected ${this.actual} ${this.isNot ? 'not to be greater than' : 'to be greater than'} ${expected}`
    );
  }

  toBeGreaterThanOrEqual(expected) {
    this._evaluate(
      this.actual >= expected,
      `Expected ${this.actual} ${this.isNot ? 'not to be >= ' : 'to be >= '} ${expected}`
    );
  }

  toBeLessThan(expected) {
    this._evaluate(
      this.actual < expected,
      `Expected ${this.actual} ${this.isNot ? 'not to be less than' : 'to be less than'} ${expected}`
    );
  }

  toBeLessThanOrEqual(expected) {
    this._evaluate(
      this.actual <= expected,
      `Expected ${this.actual} ${this.isNot ? 'not to be <= ' : 'to be <= '} ${expected}`
    );
  }

  toContain(item) {
    let contains = false;
    if (typeof this.actual === 'string' || Array.isArray(this.actual)) {
      contains = this.actual.includes(item);
    } else if (this.actual && typeof this.actual === 'object') {
      contains = Object.prototype.hasOwnProperty.call(this.actual, item);
    }
    this._evaluate(
      contains,
      `Expected ${JSON.stringify(this.actual)} ${this.isNot ? 'not to contain' : 'to contain'} ${JSON.stringify(item)}`
    );
  }

  toMatch(regex) {
    const passed = regex.test(String(this.actual));
    this._evaluate(
      passed,
      `Expected "${this.actual}" ${this.isNot ? 'not to match' : 'to match'} ${regex.toString()}`
    );
  }

  toHaveLength(len) {
    const actualLen = this.actual ? this.actual.length : undefined;
    this._evaluate(
      actualLen === len,
      `Expected length ${actualLen} ${this.isNot ? 'not to be' : 'to be'} ${len}`
    );
  }
}

class TestSuiteRunner {
  constructor() {
    this.suites = [];
    this.currentSuite = null;
    this.results = {
      total: 0,
      passed: 0,
      failed: 0,
      skipped: 0,
      errors: []
    };
  }

  describe(title, fn) {
    const suite = {
      title,
      tests: [],
      beforeEachFns: [],
      afterEachFns: []
    };
    this.suites.push(suite);
    const prevSuite = this.currentSuite;
    this.currentSuite = suite;
    try {
      fn();
    } finally {
      this.currentSuite = prevSuite;
    }
  }

  it(title, fn) {
    if (!this.currentSuite) {
      throw new Error(`Test "${title}" must be inside a describe block`);
    }
    this.currentSuite.tests.push({ title, fn });
  }

  beforeEach(fn) {
    if (this.currentSuite) {
      this.currentSuite.beforeEachFns.push(fn);
    }
  }

  afterEach(fn) {
    if (this.currentSuite) {
      this.currentSuite.afterEachFns.push(fn);
    }
  }

  expect(actual) {
    return new Expectation(actual);
  }

  async run() {
    console.log(`\n======================================================`);
    console.log(`  SEU Routine Test Suite Runner`);
    console.log(`======================================================\n`);

    const startTotal = Date.now();

    for (const suite of this.suites) {
      console.log(`\n▶ Suite: ${suite.title}`);
      for (const test of suite.tests) {
        this.results.total++;
        const testStart = Date.now();
        let err = null;

        try {
          for (const bf of suite.beforeEachFns) {
            await bf();
          }
          try {
            await test.fn();
          } finally {
            for (const af of suite.afterEachFns) {
              await af();
            }
          }
          this.results.passed++;
          const duration = Date.now() - testStart;
          console.log(`  ✔ PASS: ${test.title} (${duration}ms)`);
        } catch (e) {
          this.results.failed++;
          const duration = Date.now() - testStart;
          console.log(`  ✖ FAIL: ${test.title} (${duration}ms)`);
          console.log(`     Error: ${e.message}`);
          this.results.errors.push({
            suite: suite.title,
            test: test.title,
            error: e.message,
            stack: e.stack
          });
        }
      }
    }

    const totalDuration = Date.now() - startTotal;
    console.log(`\n======================================================`);
    console.log(`  Test Run Summary (${totalDuration}ms)`);
    console.log(`  Total:  ${this.results.total}`);
    console.log(`  Passed: ${this.results.passed}`);
    console.log(`  Failed: ${this.results.failed}`);
    console.log(`======================================================\n`);

    return this.results;
  }
}

const runner = new TestSuiteRunner();

module.exports = {
  describe: (title, fn) => runner.describe(title, fn),
  it: (title, fn) => runner.it(title, fn),
  beforeEach: (fn) => runner.beforeEach(fn),
  afterEach: (fn) => runner.afterEach(fn),
  expect: (actual) => runner.expect(actual),
  runner
};
