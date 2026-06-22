import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { EventSource } from './event-source';

describe('EventSource', () => {
    describe('on / emit', () => {
        test('calls registered listener', async () => {
            const es = new EventSource();
            let called = false;
            es.on('test', () => { called = true; });
            await es.emit('test');
            assert.equal(called, true);
        });

        test('passes arguments to listener', async () => {
            const es = new EventSource();
            let received: any[];
            es.on('test', (...args) => { received = args; });
            await es.emit('test', 1, 'two', true);
            assert.deepEqual(received, [1, 'two', true]);
        });

        test('emit on unknown type does nothing', async () => {
            const es = new EventSource();
            await assert.doesNotReject(es.emit('unknown'));
        });

        test('executes listeners in priority order (lower first)', async () => {
            const es = new EventSource();
            const order: number[] = [];
            es.on('test', () => { order.push(2); }, 200);
            es.on('test', () => { order.push(1); }, 100);
            es.on('test', () => { order.push(3); }, 300);
            await es.emit('test');
            assert.deepEqual(order, [1, 2, 3]);
        });

        test('executes async listeners sequentially', async () => {
            const es = new EventSource();
            const order: number[] = [];
            es.on('test', async () => {
                await new Promise(r => setTimeout(r, 30));
                order.push(1);
            });
            es.on('test', () => { order.push(2); });
            await es.emit('test');
            assert.deepEqual(order, [1, 2]);
        });

        test('multiple listeners on same event are all called', async () => {
            const es = new EventSource();
            let count = 0;
            es.on('test', () => { count++; });
            es.on('test', () => { count++; });
            await es.emit('test');
            assert.equal(count, 2);
        });
    });

    describe('once', () => {
        test('listener is called only once', async () => {
            const es = new EventSource();
            let count = 0;
            es.once('test', () => { count++; });
            await es.emit('test');
            await es.emit('test');
            assert.equal(count, 1);
        });
    });

    describe('removeListener', () => {
        test('removes specific listener', async () => {
            const es = new EventSource();
            let count = 0;
            const fn = () => { count++; };
            es.on('test', fn);
            es.removeListener('test', fn);
            await es.emit('test');
            assert.equal(count, 0);
        });

        test('does not remove other listeners', async () => {
            const es = new EventSource();
            let count = 0;
            const fn1 = () => { count++; };
            const fn2 = () => { count++; };
            es.on('test', fn1);
            es.on('test', fn2);
            es.removeListener('test', fn1);
            await es.emit('test');
            assert.equal(count, 1);
        });

        test('is a no-op for unknown type', () => {
            const es = new EventSource();
            assert.doesNotThrow(() => es.removeListener('unknown', () => {}));
        });
    });

    describe('removeListeners', () => {
        test('removes all listeners for a type', async () => {
            const es = new EventSource();
            let count = 0;
            es.on('test', () => { count++; });
            es.on('test', () => { count++; });
            es.removeListeners('test');
            await es.emit('test');
            assert.equal(count, 0);
        });
    });

    describe('regression: emit / once interaction', () => {
        // a once() listener removes itself mid-emit; emit must iterate a
        // snapshot so the following listener is not skipped or read as undefined
        test('emit does not crash and still calls the listener after a once()', async () => {
            const es = new EventSource();
            let onceCount = 0;
            let afterCount = 0;
            es.once('test', () => { onceCount++; });
            es.on('test', () => { afterCount++; });

            await assert.doesNotReject(es.emit('test'));
            assert.equal(onceCount, 1);
            assert.equal(afterCount, 1);
        });

        test('once() before two other listeners: all fire on first emit', async () => {
            const es = new EventSource();
            const order: string[] = [];
            es.once('test', () => { order.push('once'); });
            es.on('test', () => { order.push('a'); });
            es.on('test', () => { order.push('b'); });

            await es.emit('test');
            assert.deepEqual(order, ['once', 'a', 'b']);

            // once is gone on the second emit
            await es.emit('test');
            assert.deepEqual(order, ['once', 'a', 'b', 'a', 'b']);
        });

        test('once() awaits an async handler before emit resolves', async () => {
            const es = new EventSource();
            let done = false;
            es.once('test', async () => {
                await new Promise(r => setTimeout(r, 30));
                done = true;
            });
            await es.emit('test');
            assert.equal(done, true);
        });

        test('once() handler rejection propagates out of emit', async () => {
            const es = new EventSource();
            es.once('test', async () => { throw new Error('boom'); });
            await assert.rejects(es.emit('test'), /boom/);
        });

        test('a once() listener can be removed via the original handler before it fires', async () => {
            const es = new EventSource();
            let count = 0;
            const fn = () => { count++; };
            es.once('test', fn);
            es.removeListener('test', fn);
            await es.emit('test');
            assert.equal(count, 0);
        });

        test('emit iterates a snapshot: a listener added during emit is not called in the same emit', async () => {
            const es = new EventSource();
            let lateCalls = 0;
            es.on('test', () => {
                es.on('test', () => { lateCalls++; });
            });
            await es.emit('test');
            assert.equal(lateCalls, 0);
            await es.emit('test');
            assert.equal(lateCalls, 1);
        });
    });
});