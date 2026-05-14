import 'reflect-metadata';
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { ProvideInjectable, ProvideValue } from './provider';
import { InjectionToken, Injectable } from './injectable';
import { Injector } from './injector';

describe('ProvideValue', () => {
    test('creates a ValueProvider with the given token and value', () => {
        const TOKEN = new InjectionToken<string>('PV');
        const p = ProvideValue(TOKEN, 'hello') as any;
        assert.equal(p.token, TOKEN);
        assert.equal(p.value, 'hello');
    });

    test('multi defaults to false', () => {
        const TOKEN = new InjectionToken<number>('PV2');
        const p = ProvideValue(TOKEN, 1) as any;
        assert.equal(p.multi, false);
    });

    test('multi can be set to true', () => {
        const TOKEN = new InjectionToken<number>('PV3');
        const p = ProvideValue(TOKEN, 1, true) as any;
        assert.equal(p.multi, true);
    });

    test('provider resolves correctly via injector', () => {
        const TOKEN = new InjectionToken<string>('PV_INJ');
        const inj = Injector.Create([ProvideValue(TOKEN, 'world')]);
        assert.equal(inj.get(TOKEN), 'world');
    });
});

describe('ProvideInjectable', () => {
    test('creates a FactoryProvider using the injector', () => {
        const TOKEN = new InjectionToken<any>('PI');

        @(Injectable() as any)
        class Svc {}

        const p = ProvideInjectable(TOKEN, Svc) as any;
        assert.equal(p.token, TOKEN);
        assert.equal(typeof p.factory, 'function');
    });

    test('multi defaults to false', () => {
        const TOKEN = new InjectionToken<any>('PI2');

        @(Injectable() as any)
        class Svc {}

        const p = ProvideInjectable(TOKEN, Svc) as any;
        assert.equal(p.multi, false);
    });

    test('provider resolves instance via injector', () => {
        const TOKEN = new InjectionToken<any>('PI_INJ');

        @(Injectable() as any)
        class Svc {}

        const inj = Injector.Create([Svc, ProvideInjectable(TOKEN, Svc)]);
        const instance = inj.get(TOKEN);
        assert.ok(instance instanceof Svc);
    });

    test('multi can be set to true', () => {
        const TOKEN = new InjectionToken<any>('PI3');

        @(Injectable() as any)
        class Svc {}

        const p = ProvideInjectable(TOKEN, Svc, true) as any;
        assert.equal(p.multi, true);
    });
});