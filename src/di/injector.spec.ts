import 'reflect-metadata';
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { Injector, GetInjectionTokens } from './injector';
import { InjectionToken, Injectable, Inject, Optional, Self } from './injectable';

describe('NullInjector', () => {
    test('get throws when no default', () => {
        assert.throws(() => Injector.NULL.get(String), /No provider/);
    });

    test('get returns defaultValue when provided', () => {
        assert.equal(Injector.NULL.get(String, 'fallback'), 'fallback');
    });

    test('instanciate always throws', () => {
        assert.throws(() => (Injector.NULL as any).instanciate(class {}), /NullInjector/);
    });
});

describe('StaticInjector – TypeProvider', () => {
    test('instantiates a class by its type', () => {
        @Injectable()
        class Svc {}

        const inj = Injector.Create([Svc]);
        assert.ok(inj.get(Svc) instanceof Svc);
    });

    test('returns same singleton on subsequent get()', () => {
        @Injectable()
        class Svc {}

        const inj = Injector.Create([Svc]);
        assert.equal(inj.get(Svc), inj.get(Svc));
    });

    test('Injector token resolves to the injector itself', () => {
        const inj = Injector.Create([]);
        assert.equal(inj.get(Injector as any), inj);
    });
});

describe('StaticInjector – ValueProvider', () => {
    test('returns the static value', () => {
        const TOKEN = new InjectionToken<number>('NUM');
        const inj = Injector.Create([{ token: TOKEN, value: 42 }]);
        assert.equal(inj.get(TOKEN), 42);
    });

    test('returns falsy static values correctly', () => {
        const TOKEN = new InjectionToken<number>('ZERO');
        const inj = Injector.Create([{ token: TOKEN, value: 0 }]);
        assert.equal(inj.get(TOKEN), 0);
    });
});

describe('StaticInjector – FactoryProvider', () => {
    test('calls factory and returns result', () => {
        const TOKEN = new InjectionToken<string>('STR');
        const inj = Injector.Create([{ token: TOKEN, factory: () => 'hello' }]);
        assert.equal(inj.get(TOKEN), 'hello');
    });

    test('factory receives declared deps', () => {
        const A = new InjectionToken<number>('A');
        const B = new InjectionToken<number>('B');
        const SUM = new InjectionToken<number>('SUM');
        const inj = Injector.Create([
            { token: A, value: 3 },
            { token: B, value: 7 },
            { token: SUM, factory: (a: number, b: number) => a + b, deps: [A, B] },
        ]);
        assert.equal(inj.get(SUM), 10);
    });
});

describe('StaticInjector – ClassProvider', () => {
    test('instantiates the given type for the token', () => {
        @Injectable()
        class Impl {}

        const TOKEN = new InjectionToken<Impl>('IMPL');
        const inj = Injector.Create([{ token: TOKEN, type: Impl }]);
        assert.ok(inj.get(TOKEN) instanceof Impl);
    });
});

describe('StaticInjector – AliasProvider', () => {
    test('resolves alias to the target class', () => {
        @Injectable()
        class Real {}

        @Injectable()
        class Alias {}

        const inj = Injector.Create([Real, { token: Alias, use: Real }]);
        assert.equal(inj.get(Alias), inj.get(Real));
    });
});

describe('StaticInjector – multi provider', () => {
    test('collects multiple values into an array', () => {
        const TOKEN = new InjectionToken<string>('MULTI');
        const inj = Injector.Create([
            { token: TOKEN, value: 'a', multi: true },
            { token: TOKEN, value: 'b', multi: true },
        ]);
        const result = inj.get(TOKEN);
        assert.ok(Array.isArray(result));
        assert.equal(result.length, 2);
        assert.ok(result.includes('a'));
        assert.ok(result.includes('b'));
    });

    test('throws when mixing multi and non-multi for same token', () => {
        const TOKEN = new InjectionToken<string>('BAD');
        assert.throws(() => {
            Injector.Create([
                { token: TOKEN, value: 'a', multi: true },
                { token: TOKEN, value: 'b' },
            ]);
        }, /Multi-provider/);
    });
});

describe('StaticInjector – parent injector', () => {
    test('falls back to parent for unknown tokens', () => {
        const TOKEN = new InjectionToken<string>('PARENT');
        const parent = Injector.Create([{ token: TOKEN, value: 'from-parent' }]);
        const child = Injector.Create([], parent);
        assert.equal(child.get(TOKEN), 'from-parent');
    });

    test('child overrides parent for same token', () => {
        const TOKEN = new InjectionToken<string>('OVERRIDE');
        const parent = Injector.Create([{ token: TOKEN, value: 'parent' }]);
        const child = Injector.Create([{ token: TOKEN, value: 'child' }], parent);
        assert.equal(child.get(TOKEN), 'child');
    });
});

describe('StaticInjector – @Optional', () => {
    test('optional missing dep resolves to null', () => {
        const OPT = new InjectionToken<string>('OPT');

        @Injectable()
        class Svc {
            constructor(@(Inject(OPT) as any) @(Optional() as any) public val: string) {}
        }

        const inj = Injector.Create([Svc]);
        const svc = inj.get(Svc);
        assert.equal(svc.val, null);
    });
});

describe('StaticInjector – circular dependency detection', () => {
    test('throws on circular dependency', () => {
        const A = new InjectionToken<any>('A');
        const B = new InjectionToken<any>('B');

        const inj = Injector.Create([
            { token: A, factory: (b: any) => b, deps: [B] },
            { token: B, factory: (a: any) => a, deps: [A] },
        ]);

        assert.throws(() => inj.get(A), /Circular dependency/);
    });
});

describe('StaticInjector – instanciate', () => {
    test('creates a new instance with injected deps', () => {
        const TOKEN = new InjectionToken<string>('VAL');

        @Injectable()
        class Svc {
            constructor(@(Inject(TOKEN) as any) public val: string) {}
        }

        const inj = Injector.Create([{ token: TOKEN, value: 'test' }]);
        const svc = inj.instanciate(Svc);
        assert.ok(svc instanceof Svc);
        assert.equal(svc.val, 'test');
    });
});

describe('StaticInjector – getAsync / instanciateAsync', () => {
    test('getAsync resolves token', async () => {
        const TOKEN = new InjectionToken<number>('ASYNC_VAL');
        const inj = Injector.Create([{ token: TOKEN, value: 99 }]);
        const result = await inj.getAsync(TOKEN);
        assert.equal(result, 99);
    });

    test('instanciateAsync creates instance', async () => {
        @Injectable()
        class AsyncSvc {}

        const inj = Injector.Create([]);
        const svc = await inj.instanciateAsync(AsyncSvc);
        assert.ok(svc instanceof AsyncSvc);
    });
});

describe('StaticInjector – invokeAsync', () => {
    test('calls function with resolved deps', async () => {
        const TOKEN = new InjectionToken<number>('N');

        function handler(n: number) {
            return n * 2;
        }

        // manually register parameter metadata since decorators can't apply to plain functions
        const injectMeta = new (Inject as any)(TOKEN);
        Reflect.defineMetadata('design:paramtypes', [Number], handler);
        Reflect.defineMetadata('uon:parameters', [[injectMeta]], handler);

        const inj = Injector.Create([{ token: TOKEN, value: 5 }]);
        const result = await inj.invokeAsync(handler);
        assert.equal(result, 10);
    });
});

describe('StaticInjector – defaultValue', () => {
    test('returns defaultValue for missing token', () => {
        const TOKEN = new InjectionToken<string>('MISS');
        const inj = Injector.Create([]);
        assert.equal(inj.get(TOKEN, 'default'), 'default');
    });

    test('throws for missing token with no default', () => {
        const TOKEN = new InjectionToken<string>('MISS2');
        const inj = Injector.Create([]);
        assert.throws(() => inj.get(TOKEN), /No provider/);
    });
});

describe('StaticInjector – invalid provider', () => {
    test('throws for completely invalid provider', () => {
        assert.throws(() => Injector.Create([42 as any]), /Invalid provider/);
    });
});

describe('GetInjectionTokens', () => {
    test('returns empty array for class with no params', () => {
        class Empty {}
        const tokens = GetInjectionTokens(Empty);
        assert.deepEqual(tokens, []);
    });

    test('reflects constructor parameter types', () => {
        @Injectable()
        class Dep {}

        @Injectable()
        class Consumer {
            constructor(public dep: Dep) {}
        }

        const tokens = GetInjectionTokens(Consumer);
        assert.equal(tokens.length, 1);
        assert.equal(tokens[0].token, Dep);
    });

    test('respects @Inject token override', () => {
        const TOKEN = new InjectionToken<string>('X');

        class Consumer {
            constructor(@Inject(TOKEN) public val: string) {}
        }

        const tokens = GetInjectionTokens(Consumer);
        assert.equal(tokens[0].token, TOKEN);
    });

    test('marks @Optional params', () => {
        const TOKEN = new InjectionToken<string>('Y');

        class Consumer {
            constructor(
                @Inject(TOKEN) @Optional() public val: string
            ) {}
        }

        const tokens = GetInjectionTokens(Consumer);
        assert.equal(tokens[0].optional, true);
    });

    test('marks @Self params', () => {
        @Injectable()
        class Dep {}

        class Consumer {
            constructor(@Self() public dep: Dep) {}
        }

        const tokens = GetInjectionTokens(Consumer);
        assert.equal(tokens[0].self, true);
    });
});