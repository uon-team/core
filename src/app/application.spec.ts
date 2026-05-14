import 'reflect-metadata';
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { Application, APP_INITIALIZER } from './application';
import { Module, ModuleRef } from './module';
import { InjectionToken } from '../di/injectable';
import { Injectable } from '../di/injectable';

@(Module({ providers: [] }) as any)
class SimpleModule {}

describe('Application', () => {
    describe('constructor / Bootstrap', () => {
        test('Bootstrap returns an Application instance', () => {
            const app = Application.Bootstrap(SimpleModule);
            assert.ok(app instanceof Application);
        });

        test('main property returns the startup module type', () => {
            const app = new Application(SimpleModule);
            assert.equal(app.main, SimpleModule);
        });

        test('modules list includes the main module', () => {
            const app = new Application(SimpleModule);
            const found = app.modules.find(m => m.type === SimpleModule);
            assert.ok(found);
        });

        test('throws when type is not decorated with @Module', () => {
            class BadModule {}
            assert.throws(() => new Application(BadModule));
        });
    });

    describe('imports', () => {
        @(Module({ providers: [] }) as any)
        class ChildModule {}

        @(Module({ imports: [ChildModule] }) as any)
        class ParentModule {}

        test('imported modules are added to the modules list', () => {
            const app = new Application(ParentModule);
            const types = app.modules.map(m => m.type);
            assert.ok(types.includes(ChildModule));
        });

        test('throws on duplicate imports within the same module', () => {
            @(Module({ imports: [ChildModule, ChildModule] }) as any)
            class DupModule {}

            assert.throws(() => new Application(DupModule), /imported twice/);
        });
    });

    describe('declarations', () => {
        class DeclA {}
        class DeclB {}

        @(Module({ declarations: [DeclA, DeclB] }) as any)
        class DeclModule {}

        test('declarations map is populated', () => {
            const app = new Application(DeclModule);
            assert.ok(app.declarations.has(DeclA));
            assert.ok(app.declarations.has(DeclB));
        });

        test('declaration points to the correct module ref', () => {
            const app = new Application(DeclModule);
            const ref = app.declarations.get(DeclA);
            assert.equal(ref.type, DeclModule);
        });

        test('throws when a declaration is redeclared in another module', () => {
            class Shared {}

            @(Module({ declarations: [Shared] }) as any)
            class ModA {}

            @(Module({ imports: [ModA], declarations: [Shared] }) as any)
            class ModB {}

            assert.throws(() => new Application(ModB), /redeclare/);
        });
    });

    describe('providers', () => {
        const TOKEN = new InjectionToken<string>('APP_STR');

        @(Module({ providers: [{ token: TOKEN, value: 'hello' }] }) as any)
        class ProviderModule {}

        test('module providers are available in the module injector', () => {
            const app = new Application(ProviderModule);
            const ref = app.modules.find(m => m.type === ProviderModule)!;
            assert.equal(ref.injector.get(TOKEN), 'hello');
        });

        test('Application instance is available via the Application token', async () => {
            const app = new Application(SimpleModule);
            await app.start();
            const ref = app.modules.find(m => m.type === SimpleModule)!;
            assert.ok(ref.injector.get(Application) instanceof Application);
        });
    });

    describe('start()', () => {
        test('returns the main ModuleRef', async () => {
            const app = new Application(SimpleModule);
            const ref = await app.start();
            assert.ok(ref instanceof ModuleRef);
            assert.equal(ref.type, SimpleModule);
        });

        test('sets instance on the module ref', async () => {
            @(Module({}) as any)
            class InstanceModule {}

            const app = new Application(InstanceModule);
            const ref = await app.start();
            assert.ok(ref.instance instanceof InstanceModule);
        });

        test('APP_INITIALIZER callbacks are awaited before start resolves', async () => {
            let ran = false;

            @(Module({
                providers: [{
                    token: APP_INITIALIZER,
                    value: (async () => { ran = true; })(),
                    multi: true,
                }]
            }) as any)
            class InitModule {}

            const app = new Application(InitModule);
            await app.start();
            assert.equal(ran, true);
        });
    });

    describe('APP_INITIALIZER token', () => {
        test('is an InjectionToken', () => {
            assert.ok(APP_INITIALIZER instanceof InjectionToken);
        });

        test('toString includes APP_INIT', () => {
            assert.ok(APP_INITIALIZER.toString().includes('APP_INIT'));
        });
    });
});