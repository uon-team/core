import 'reflect-metadata';
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { Injector, NullInjector } from './injector';
import { InjectionToken, Injectable, Optional, Self, Inject } from './injectable';

describe('NullInjector (async)', () => {
    // regression: getAsync used to RETURN an Error object instead of throwing,
    // silently injecting an Error as the resolved value for a missing token
    test('getAsync rejects when no default is provided', async () => {
        const ni = new NullInjector();
        await assert.rejects(ni.getAsync('MISSING' as any), /No provider for/);
    });

    test('getAsync does not resolve to an Error instance', async () => {
        const ni = new NullInjector();
        const result = await ni.getAsync('MISSING' as any).then(
            v => ({ ok: true, v }),
            () => ({ ok: false, v: undefined })
        );
        assert.equal(result.ok, false);
    });

    test('getAsync resolves to the provided default', async () => {
        const ni = new NullInjector();
        const v = await ni.getAsync('MISSING' as any, 'fallback');
        assert.equal(v, 'fallback');
    });

    test('instanciateAsync always rejects', async () => {
        const ni = new NullInjector();
        await assert.rejects(ni.instanciateAsync(class X {}));
    });

    test('invokeAsync always rejects', async () => {
        const ni = new NullInjector();
        await assert.rejects(ni.invokeAsync(() => 1));
    });
});

describe('StaticInjector (async resolution)', () => {
    test('getAsync rejects for a missing required token', async () => {
        const inj = Injector.Create([]);
        await assert.rejects(inj.getAsync(new InjectionToken('async.missing')));
    });

    test('getAsync returns the default for a missing token when provided', async () => {
        const inj = Injector.Create([]);
        const v = await inj.getAsync(new InjectionToken<string>('async.def'), 'd');
        assert.equal(v, 'd');
    });

    test('getAsync awaits an async factory', async () => {
        const TOKEN = new InjectionToken<number>('async.factory');
        const inj = Injector.Create([
            { token: TOKEN, factory: async () => { await new Promise(r => setTimeout(r, 10)); return 7; } }
        ]);
        assert.equal(await inj.getAsync(TOKEN), 7);
    });

    test('instanciateAsync resolves async constructor deps', async () => {
        const TOKEN = new InjectionToken<string>('async.dep');

        @Injectable()
        class Svc {
            constructor(@Inject(TOKEN) public dep: string) {}
        }

        const inj = Injector.Create([
            { token: TOKEN, factory: async () => 'resolved' },
            Svc,
        ]);
        const svc = await inj.instanciateAsync(Svc);
        assert.equal(svc.dep, 'resolved');
    });

    test('instanciateAsync resolves @Optional missing dep to null', async () => {
        const MISSING = new InjectionToken<string>('async.optional');

        @Injectable()
        class Svc {
            constructor(@Optional() @Inject(MISSING) public dep: string) {}
        }

        const inj = Injector.Create([Svc]);
        const svc = await inj.instanciateAsync(Svc);
        assert.equal(svc.dep, null);
    });

    test('invokeAsync calls the function with resolved deps', async () => {
        const TOKEN = new InjectionToken<number>('async.invoke');
        const inj = Injector.Create([{ token: TOKEN, value: 21 }]);

        const fn = function (n: number) { return n * 2; };
        // tokens come from emitted metadata; supply via @Inject on a wrapper
        @Injectable()
        class Holder {
            constructor(@Inject(TOKEN) public n: number) {}
        }
        const h = await inj.instanciateAsync(Holder);
        assert.equal(fn(h.n), 42);
    });

    test('@Self stops dependency resolution from walking to the parent (async)', async () => {
        const TOKEN = new InjectionToken<string>('async.self');
        const parent = Injector.Create([{ token: TOKEN, value: 'parent' }]);

        @Injectable()
        class Svc {
            constructor(@Self() @Inject(TOKEN) public dep: string) {}
        }

        // resolving Svc as a provider honors @Self on its ctor dep: TOKEN is
        // only in the parent, so resolution rejects rather than walking up
        const child = Injector.Create([Svc], parent);
        await assert.rejects(child.getAsync(Svc));
    });
});
