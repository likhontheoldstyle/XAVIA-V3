globalThis.shutdown = (c = 1) => process.exit(c);
if (typeof global === 'undefined') globalThis.global = globalThis;
await import('./_build.js');
