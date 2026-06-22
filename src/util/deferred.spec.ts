import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { MakeDeferred, ResolveAfterMs, RejectAfterMs } from './deferred';

describe('MakeDeferred', () => {
    test('is a Promise', () => {
        const d = MakeDeferred<number>();
        assert.ok(d instanceof Promise);
    });

    test('resolves with the given value', async () => {
        const d = MakeDeferred<number>();
        d.resolve(42);
        const result = await d;
        assert.equal(result, 42);
    });

    test('rejects with the given reason', async () => {
        const d = MakeDeferred<number>();
        d.reject(new Error('fail'));
        await assert.rejects(d, /fail/);
    });

    test('resolve and reject are functions', () => {
        const d = MakeDeferred<void>();
        assert.equal(typeof d.resolve, 'function');
        assert.equal(typeof d.reject, 'function');
    });
});

describe('ResolveAfterMs', () => {
    test('resolves after the given delay', async () => {
        const start = Date.now();
        await ResolveAfterMs(50);
        assert.ok(Date.now() - start >= 40);
    });

    test('resolves with the given value', async () => {
        const result = await ResolveAfterMs(10, 'hello');
        assert.equal(result, 'hello');
    });
});

describe('RejectAfterMs', () => {
    test('rejects after the given delay', async () => {
        const start = Date.now();
        await assert.rejects(RejectAfterMs(50));
        assert.ok(Date.now() - start >= 40);
    });

    test('rejects with the given error', async () => {
        const err = new Error('timeout');
        await assert.rejects(RejectAfterMs(10, err), (e: Error) => {
            assert.equal(e, err);
            return true;
        });
    });
});