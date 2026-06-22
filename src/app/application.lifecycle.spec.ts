import 'reflect-metadata';
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { Application } from './application';
import { Module } from './module';
import { InjectionToken } from '../di/injectable';

describe('Application lifecycle', () => {
    test('awaits onStart() on the main module', async () => {
        let started = false;

        @Module({})
        class Main {
            async onStart() {
                await new Promise(r => setTimeout(r, 10));
                started = true;
            }
        }

        const app = new Application(Main);
        await app.start();
        assert.equal(started, true);
    });

    test('start() resolves even when the main module has no onStart', async () => {
        @Module({})
        class Main {}

        const app = new Application(Main);
        await assert.doesNotReject(app.start());
    });

    test('every loaded module gets an instance after start()', async () => {
        @Module({})
        class Child {}

        @Module({ imports: [Child] })
        class Main {}

        const app = new Application(Main);
        await app.start();
        for (const ref of app.modules) {
            assert.ok(ref.instance instanceof ref.type);
        }
    });

    test('ModuleWithProviders extra providers are available in the importing tree', () => {
        const TOKEN = new InjectionToken<string>('mwp.token');

        @Module({})
        class Feature {}

        @Module({
            imports: [{ module: Feature, providers: [{ token: TOKEN, value: 'extra' }] }]
        })
        class Main {}

        const app = new Application(Main);
        const mainRef = app.modules.find(m => m.type === Main)!;
        assert.equal(mainRef.injector.get(TOKEN), 'extra');
    });

    test('Bootstrap throws a descriptive error for a non-@Module startup type', () => {
        class NotAModule {}
        assert.throws(() => Application.Bootstrap(NotAModule), /was not decorated with @Module/);
    });
});
