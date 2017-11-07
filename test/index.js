'use strict';

const stuck = require('../');
const vm = require('vm');
const assert = require('assert');
const util = require('util');

function assertIsScope(scope) {
  assert(['local', 'global', 'block', 'closure'].includes(scope.type),
         `scope.type = ${scope.type}`);
  assert.strictEqual(typeof scope.object, 'object');
}

function assertIsStack(stack) {
  assert(Array.isArray(stack));
  for (const frame of stack) {
    assert.strictEqual(typeof frame.functionName, 'string');
    assert.strictEqual(typeof frame.url, 'string');
    assert.strictEqual(typeof frame.line, 'number');
    assert.strictEqual(typeof frame.column, 'number');
    assert(Array.isArray(frame.scopes));
    for (const scope of frame.scopes) {
      assertIsScope(scope);
    }
  }
}

function assertDeepSubset(a, b, seen = new Set(), path = '') {
  if (seen.has(a)) return;
  seen.add(a);
  if (typeof a !== 'object' || typeof b !== 'object' ||
      a === null || b === null) {
    return assert(Object.is(a, b), `${String(a)} === ${String(b)} at ${path}`);
  }

  const keys = Object.keys(a);
  for (const key of keys) {
    assert(Object.prototype.hasOwnProperty.call(b, key),
           `${util.inspect(b)} lacks ${key}`);
    assertDeepSubset(a[key], b[key], seen, `${path}.${key}`);
  }
}

describe('stuck', function() {
  it('returns a stack trace', function() {
    assertIsStack(stuck());
  });

  it('returns a stack trace that matches reality', function() {
    this.timeout(4000);
    function f() {
      const a = 10;
      let b = 2;
      {
        var c = { key: 'value' };
        const z = [ null ];
        return g.call('str', 42); // `this` can be a primitive
        function g(p) {
          b = a + b * p;
          return stuck();
        }
      }
    }

    const stack = f();
    assertIsStack(stack);
    assertDeepSubset({
      functionName: 'g',
      url: __filename,
      this: 'str',
      scopes: [
        {
          type: 'local',
          object: {
            p: 42
          }
        },
        {
          type: 'closure',
          object: {
            a: 10,
            b: 94
          }
        },
        {
          type: 'closure',
          object: {
            stuck
          }
        },
        {
          type: 'global',
          object: global
        }
      ]
    }, stack[0]);
    assertDeepSubset({
      functionName: 'f',
      url: __filename,
      this: undefined,
      scopes: [
        {
          type: 'block',
          object: {
            z: [ null ]
          }
        },
        {
          type: 'local',
          object: {
            a: 10,
            b: 94,
            c: { key: 'value' }
          }
        },
        {
          type: 'closure',
          object: {
            stuck
          }
        },
        {
          type: 'global',
          object: global
        }
      ]
    }, stack[1]);
  });

  it('works across vm context boundaries', function() {
    const call = vm.runInNewContext('(function call(fn) { return fn(); })');
    const stack = call(stuck);
    assertIsStack(stack);
  });
});
