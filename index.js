'use strict';
const assert = require('assert');
const util = require('util');

let saveTarget;
const kSaveTarget = Symbol.for('__unstack_internal_stack_save_target');
Object.defineProperty(global, kSaveTarget, {
  value: function(value) {
    saveTarget = value;
  },
  writable: false,
  enumerable: false,
  configurable: false
});

function getRealObjectForId(session, { value, objectId }) {
  if (typeof objectId === 'undefined')
    return value;
  session.post('Runtime.callFunctionOn', {
    objectId,
    functionDeclaration: `function(value) {
      global[Symbol.for('__unstack_internal_stack_save_target')](value);
    }`,
    arguments: [{ objectId }],
    silent: true
  }, (error) => {
    assert.strictEqual(error, null);
  });
  return saveTarget;
}

function __getStack() {
  let session;
  let stack;

  try {
    const inspector = require('inspector');
    const scripts = new Map();
    let callFrames;

    session = new inspector.Session();
    session.connect();
    session.on('Debugger.scriptParsed', (info) => {
      const {
        scriptId,
        url
      } = info.params;
      scripts.set(scriptId, { url });
    });
    session.post('Debugger.enable', (error) => {
      assert.strictEqual(error, null);
    });
    session.post('Debugger.setSkipAllPauses', { skip: false }, (error) => {
      assert.strictEqual(error, null);
    });
    session.once('Debugger.paused', (obj) => {
      callFrames = obj.params.callFrames;
    });
    session.post('Debugger.pause', (error, result) => {
      assert.strictEqual(error, null);
    });
    for (let i = 0; i < callFrames.length; i++) {
      if (callFrames[i].functionName === '__getStack') {
        callFrames = callFrames.slice(i + 1);
        break;
      }
    }
    stack = callFrames.map((frame) => {
      const { scopeChain, functionName, location, this: this_ } = frame;
      const { url } = scripts.get(location.scriptId) || { url: '<unknown>' };
      const line = location.lineNumber + 1;
      const column = location.columnNumber + 1;

      return {
        functionName,
        url,
        line,
        column,
        this: getRealObjectForId(session, this_),
        scopes: scopeChain.map(({ type, object: objectReference }) => {
          const object = getRealObjectForId(session, objectReference);

          return {
            type,
            object
          };
        })
      };
    });
  } finally {
    try { session.disconnect(); } catch (e) {}
  }
  return stack;
}

module.exports = __getStack;
