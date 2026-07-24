// Minimal test runner using Node.js assert — no external dependencies needed
const assert = require("assert");

let passed = 0, failed = 0;
const failures = [];
let currentSuite = "";

function describe(name, fn) {
  currentSuite = name;
  console.log(`\n  ${name}`);
  fn();
}

function it(name, fn) {
  try {
    fn();
    passed++;
    process.stdout.write(`    ✓ ${name}\n`);
  } catch (err) {
    failed++;
    failures.push({ suite: currentSuite, name, msg: err.message });
    process.stdout.write(`    ✗ ${name}\n      → ${err.message}\n`);
  }
}

function expect(actual) {
  return {
    toBe:      (exp)    => { if (actual !== exp) throw new Error(`Got ${JSON.stringify(actual)}, expected ${JSON.stringify(exp)}`); },
    toEqual:   (exp)    => { assert.deepStrictEqual(actual, exp); },
    toContain: (item)   => { if (!actual.includes(item)) throw new Error(`${JSON.stringify(actual)} does not contain ${JSON.stringify(item)}`); },
    toBeDefined:()      => { if (actual == null) throw new Error(`Expected defined, got ${actual}`); },
    toThrow:   ()       => { throw new Error("use expectThrow()"); },
  };
}

function expectThrow(fn, msgContains) {
  let threw = false;
  try { fn(); }
  catch (e) {
    threw = true;
    if (msgContains && !e.message.includes(msgContains))
      throw new Error(`Expected error containing "${msgContains}" but got "${e.message}"`);
  }
  if (!threw) throw new Error("Expected function to throw but it did not");
}

function summary() {
  console.log(`\n${"─".repeat(50)}`);
  if (failures.length) {
    console.log("\nFailed tests:");
    failures.forEach(f => console.log(`  ✗ [${f.suite}] ${f.name}\n    ${f.msg}`));
  }
  console.log(`\n${passed} passed, ${failed} failed\n`);
  if (failed > 0) process.exit(1);
}

module.exports = { describe, it, expect, expectThrow, summary };
