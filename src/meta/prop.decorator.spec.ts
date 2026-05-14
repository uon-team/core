import 'reflect-metadata';
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { MakePropertyDecorator } from './prop.decorator';
import { GetPropertiesMetadata } from './meta.common';

describe('MakePropertyDecorator', () => {
    test('returns a factory function', () => {
        const MyProp = MakePropertyDecorator('MyProp');
        assert.equal(typeof MyProp, 'function');
    });

    test('sets decoratorName on prototype', () => {
        const MyProp = MakePropertyDecorator('TestProp');
        assert.equal((MyProp as any).prototype.decoratorName, 'TestProp');
    });

    test('can be used with new to create instance', () => {
        const MyProp = MakePropertyDecorator('MyProp', (label: string) => ({ label }));
        const instance = new (MyProp as any)('test');
        assert.equal(instance.label, 'test');
    });

    test('stores metadata keyed by property name', () => {
        const MyProp = MakePropertyDecorator('MyProp', (label: string) => ({ label }));

        class Target {
            @(MyProp('myLabel') as any)
            myProp: string;
        }

        const props = GetPropertiesMetadata(Target.prototype);
        assert.ok(Array.isArray(props['myProp']));
        assert.equal((props['myProp'][0] as any).label, 'myLabel');
    });

    test('multiple decorators on same property are stacked', () => {
        const DecA = MakePropertyDecorator('A', (v: string) => ({ v }));
        const DecB = MakePropertyDecorator('B', (v: string) => ({ v }));

        class Target {
            @(DecB('b') as any)
            @(DecA('a') as any)
            myProp: string;
        }

        const props = GetPropertiesMetadata(Target.prototype);
        assert.equal(props['myProp'].length, 2);
    });

    test('decorators on different properties are stored separately', () => {
        const MyProp = MakePropertyDecorator('MyProp', (v: number) => ({ v }));

        class Target {
            @(MyProp(1) as any)
            first: string;

            @(MyProp(2) as any)
            second: string;
        }

        const props = GetPropertiesMetadata(Target.prototype);
        assert.equal((props['first'][0] as any).v, 1);
        assert.equal((props['second'][0] as any).v, 2);
    });

    test('calls optional fn hook', () => {
        let hookKey: string | symbol = '';
        const MyProp = MakePropertyDecorator('MyProp', undefined, undefined, (cls, meta, key) => {
            hookKey = key;
        });

        class Target {
            @(MyProp() as any)
            hookProp: string;
        }

        assert.equal(hookKey, 'hookProp');
    });

    test('inherits from parentClass when provided', () => {
        class Base {}
        const MyProp = MakePropertyDecorator('MyProp', undefined, Base);
        const instance = new (MyProp as any)();
        assert.equal(instance instanceof Base, true);
    });
});