import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { MakeUnique } from './unique';

describe('MakeUnique', () => {
    test('returns the initial value on first call', () => {
        const val = { x: 1 };
        const result = MakeUnique('test.unique.first', val);
        assert.equal(result, val);
    });

    test('returns the same instance on subsequent calls', () => {
        const first = MakeUnique('test.unique.singleton', { x: 1 });
        const second = MakeUnique('test.unique.singleton', { x: 2 });
        assert.equal(first, second);
    });

    test('different ids produce different singletons', () => {
        const a = MakeUnique('test.unique.a', 'valueA');
        const b = MakeUnique('test.unique.b', 'valueB');
        assert.equal(a, 'valueA');
        assert.equal(b, 'valueB');
        assert.notEqual(a, b);
    });

    test('works with primitive values', () => {
        const result = MakeUnique('test.unique.number', 99);
        assert.equal(result, 99);
    });

    // regression: a falsy singleton (0, '', false) must be preserved, not
    // re-created on subsequent calls (previously used a !value truthy check)
    test('preserves a falsy singleton value across calls', () => {
        const first = MakeUnique('test.unique.falsy', 0);
        const second = MakeUnique('test.unique.falsy', 42);
        assert.equal(first, 0);
        assert.equal(second, 0);
    });

    test('preserves an empty-string singleton across calls', () => {
        const first = MakeUnique('test.unique.emptystr', '');
        const second = MakeUnique('test.unique.emptystr', 'replaced');
        assert.equal(first, '');
        assert.equal(second, '');
    });

    test('preserves a false singleton across calls', () => {
        const first = MakeUnique('test.unique.false', false);
        const second = MakeUnique('test.unique.false', true);
        assert.equal(first, false);
        assert.equal(second, false);
    });
});