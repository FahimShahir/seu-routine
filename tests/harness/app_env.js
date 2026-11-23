/**
 * app_env.js
 * Comprehensive JSDOM execution environment for testing d:\rutine\index.html
 */

const fs = require('fs');
const path = require('path');
const { JSDOM, VirtualConsole } = require('jsdom');

const INDEX_HTML_PATH = path.resolve(__dirname, '../../index.html');
const rawHtml = fs.readFileSync(INDEX_HTML_PATH, 'utf8');

class MemoryStorage {
  constructor(initialData = {}) {
    this.store = { ...initialData };
  }

  getItem(key) {
    return Object.prototype.hasOwnProperty.call(this.store, key) ? this.store[key] : null;
  }

  setItem(key, value) {
    this.store[key] = String(value);
  }

  removeItem(key) {
    delete this.store[key];
  }

  clear() {
    this.store = {};
  }

  get length() {
    return Object.keys(this.store).length;
  }

  key(index) {
    const keys = Object.keys(this.store);
    return keys[index] || null;
  }
}

class AppEnvironment {
  constructor(options = {}) {
    this.storage = options.storage || new MemoryStorage(options.initialStorage || {});
    this.mockTime = options.mockTime ? new Date(options.mockTime).getTime() : null;
    this.alerts = [];
    this.toasts = [];
    this.initDom();
  }

  initDom() {
    const self = this;
    const virtualConsole = new VirtualConsole();
    virtualConsole.on('jsdomError', (error) => {
      // Ignore CSS parsing errors or minor JSDOM resource errors
    });

    this.dom = new JSDOM(rawHtml, {
      runScripts: 'dangerously',
      url: 'https://fahimshahir.github.io/seu-routine/',
      virtualConsole,
      beforeParse(window) {
        // Mock localStorage
        Object.defineProperty(window, 'localStorage', {
          value: self.storage,
          writable: false
        });

        // Mock window methods
        window.scrollTo = () => {};
        window.alert = (msg) => { self.alerts.push(String(msg)); };
        window.confirm = () => true;
        window.prompt = (msg, def) => def || '';

        // Capture showToast
        const origShowToast = window.showToast;
        window.showToast = (msg) => {
          self.toasts.push(String(msg));
          if (typeof origShowToast === 'function') origShowToast(msg);
        };

        // Mock Date if mockTime is configured
        if (self.mockTime !== null) {
          const OrigDate = window.Date;
          const mockTimestamp = self.mockTime;
          class MockDate extends OrigDate {
            constructor(...args) {
              if (args.length === 0) {
                super(mockTimestamp);
              } else {
                super(...args);
              }
            }
            static now() {
              return mockTimestamp;
            }
          }
          window.Date = MockDate;
        }
      }
    });

    this.window = this.dom.window;
    this.document = this.window.document;
  }

  setMockTime(dateOrTimestamp) {
    const ts = new Date(dateOrTimestamp).getTime();
    this.mockTime = ts;
    const OrigDate = this.window.Date;
    class MockDate extends OrigDate {
      constructor(...args) {
        if (args.length === 0) {
          super(ts);
        } else {
          super(...args);
        }
      }
      static now() {
        return ts;
      }
    }
    this.window.Date = MockDate;
  }

  eval(code) {
    return this.window.eval(code);
  }

  getStorage(key = 'SEU_STUDENT_ROUTINE_V2') {
    const raw = this.storage.getItem(key);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch (e) {
      return raw;
    }
  }

  setStorage(key, value) {
    const serialized = typeof value === 'string' ? value : JSON.stringify(value);
    this.storage.setItem(key, serialized);
  }

  getAppData() {
    return this.eval('appData');
  }

  getActiveSemester() {
    return this.eval('activeSemester');
  }

  getActiveProfile() {
    return this.eval('activeProfile');
  }

  isDemoMode() {
    return this.eval('isDemoMode');
  }

  query(selector) {
    return this.document.querySelector(selector);
  }

  queryAll(selector) {
    return Array.from(this.document.querySelectorAll(selector));
  }

  text(selector) {
    const el = this.query(selector);
    return el ? (el.innerText || el.textContent || '').trim() : null;
  }

  click(selector) {
    const el = typeof selector === 'string' ? this.query(selector) : selector;
    if (!el) throw new Error(`Element not found for click: ${selector}`);
    el.click();
  }

  pasteAndImportUms(text, targetSem = 'Fall 2026') {
    const rawTextEl = this.document.getElementById('importRawText');
    const targetSemEl = this.document.getElementById('importTargetSemester');
    if (rawTextEl) rawTextEl.value = text;
    if (targetSemEl) targetSemEl.value = targetSem;
    this.window.parseAndImportText();
  }

  uploadJson(jsonObj) {
    const jsonStr = typeof jsonObj === 'string' ? jsonObj : JSON.stringify(jsonObj);
    const mockFile = { name: 'routine.json', size: jsonStr.length };
    
    // Stub FileReader to immediately trigger onload with jsonStr
    const OrigFileReader = this.window.FileReader;
    this.window.FileReader = class {
      readAsText() {
        setTimeout(() => {
          if (typeof this.onload === 'function') {
            this.onload({ target: { result: jsonStr } });
          }
        }, 0);
      }
    };

    const mockEvent = {
      target: {
        files: [mockFile]
      }
    };

    this.window.importRoutineJson(mockEvent);
    this.window.FileReader = OrigFileReader;
  }

  simulateReload() {
    // Preserves this.storage, re-executes index.html on fresh DOM
    this.cleanup();
    this.initDom();
  }

  triggerClockUpdate() {
    if (typeof this.window.updateStatusTracker === 'function') {
      this.window.updateStatusTracker();
    }
    if (typeof this.window.updateLiveCountdowns === 'function') {
      this.window.updateLiveCountdowns();
    }
  }

  cleanup() {
    if (this.window) {
      // Clear all possible interval IDs (up to 1000)
      for (let i = 1; i < 1000; i++) {
        this.window.clearInterval(i);
        this.window.clearTimeout(i);
      }
      this.window.close();
    }
  }
}

function createApp(options = {}) {
  return new AppEnvironment(options);
}

module.exports = {
  createApp,
  MemoryStorage,
  INDEX_HTML_PATH
};
