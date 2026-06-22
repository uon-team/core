import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { GLOBAL } from './global';

describe('GLOBAL', () => {
    test('is defined', () => {
        assert.ok(GLOBAL);
    });

    test('resolves to the global object (globalThis) in node', () => {
        assert.equal(GLOBAL, globalThis);
    });

    test('can store and retrieve a symbol-keyed value (used by MakeUnique)', () => {
        const sym = Symbol.for('test.global.value');
        GLOBAL[sym] = 123;
        assert.equal(GLOBAL[sym], 123);
        delete GLOBAL[sym];
    });
});
