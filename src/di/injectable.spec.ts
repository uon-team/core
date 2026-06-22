import 'reflect-metadata';
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { InjectionToken, Injectable, IsInjectable, Inject, Optional, Self } from './injectable';
import { GetTypeMetadata, GetParametersMetadata } from '../meta/meta.common';

describe('InjectionToken', () => {
    test('toString returns readable description', () => {
        const token = new InjectionToken('MY_TOKEN');
        assert.equal(token.toString(), 'InjectionToken MY_TOKEN');
    });

    test('two tokens with the same desc are distinct objects', () => {
        const a = new InjectionToken('X');
        const b = new InjectionToken('X');
        assert.notEqual(a, b);
    });
});

describe('Injectable decorator', () => {
    test('adds Injectable instance to class metadata', () => {
        @Injectable()
        class MyService {}

        const meta = GetTypeMetadata(MyService);
        const found = meta.find(m => m instanceof Injectable);
        assert.ok(found, 'expected Injectable metadata');
    });

    test('decorated class is returned unchanged', () => {
        @Injectable()
        class MyService {}

        const instance = new MyService();
        assert.ok(instance instanceof MyService);
    });
});

describe('IsInjectable', () => {
    test('returns true for an @Injectable class', () => {
        @Injectable()
        class Svc {}

        assert.equal(IsInjectable(Svc), true);
    });

    test('returns false for a plain class', () => {
        class Plain {}
        assert.equal(IsInjectable(Plain), false);
    });
});

describe('Inject decorator', () => {
    test('stores token metadata at the correct parameter index', () => {
        const TOKEN = new InjectionToken<string>('STR');

        class Target {
            constructor(@Inject(TOKEN) value: string) {}
        }

        const params = GetParametersMetadata(Target);
        assert.ok(Array.isArray(params[0]));
        const injectMeta = params[0].find((m: any) => m instanceof Inject);
        assert.ok(injectMeta);
        assert.equal((injectMeta as any).token, TOKEN);
    });

    test('can be used with new', () => {
        const TOKEN = new InjectionToken<number>('NUM');
        const instance = new (Inject as any)(TOKEN);
        assert.equal(instance.token, TOKEN);
    });
});

describe('Optional decorator', () => {
    test('stores Optional metadata at parameter index', () => {
        class Target {
            constructor(@Optional() x: string) {}
        }

        const params = GetParametersMetadata(Target);
        assert.ok(Array.isArray(params[0]));
        const optMeta = params[0].find((m: any) => m instanceof Optional);
        assert.ok(optMeta);
    });
});

describe('Self decorator', () => {
    test('stores Self metadata at parameter index', () => {
        class Target {
            constructor(@Self() x: string) {}
        }

        const params = GetParametersMetadata(Target);
        assert.ok(Array.isArray(params[0]));
        const selfMeta = params[0].find((m: any) => m instanceof Self);
        assert.ok(selfMeta);
    });
});