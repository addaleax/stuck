stuck
==============

[![NPM Version](https://img.shields.io/npm/v/stuck.svg?style=flat)](https://npmjs.org/package/stuck)
[![NPM Downloads](https://img.shields.io/npm/dm/stuck.svg?style=flat)](https://npmjs.org/package/stuck)
[![Build Status](https://travis-ci.org/addaleax/stuck.svg?style=flat&branch=master)](https://travis-ci.org/addaleax/stuck?branch=master)
[![Coverage Status](https://coveralls.io/repos/addaleax/stuck/badge.svg?branch=master)](https://coveralls.io/r/addaleax/stuck?branch=master)
[![Dependency Status](https://david-dm.org/addaleax/stuck.svg?style=flat)](https://david-dm.org/addaleax/stuck)

Make all values on the current stack available.

**This is a debugging utility.** Don’t rely on it for anything else.

It requires the Node.js Inspector API, which is available in Node.js 8 and
above, and is considered experimental at the time of writing (November 2017).

Install:
`npm install stuck`

```js
const stuck = require('stuck');

const stack = stuck();  // Array of stack frames.
const frame = stack[0];
console.log(`${frame.functionName} at ${frame.url}:${frame.column}:${frame.line}`);
const scopes = stack[0].scopes;  // Array of scopes.
const scope = scopes[0];
console.log(scope.type);  // One of: local, global, block, closure.
console.log(scope.object);  // Object with scope variables as properties.
```

License
=======

MIT
