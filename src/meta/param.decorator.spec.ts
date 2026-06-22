import 'reflect-metadata';
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { MakeParameterDecorator } from './param.decorator';
import { GetParametersMetadata } from './meta.common';

describe('MakeParameterDecorator', () => {
    test('returns a factory function', () => {
        const MyParam = MakeParameterDecorator('MyParam');
        assert.equal(typeof MyParam, 'function');
    });

    test('sets decoratorName on prototype', () => {
        const MyParam = MakeParameterDecorator('TestParam');
        assert.equal((MyParam as any).prototype.decoratorName, 'TestParam');
    });

    test('can be used with new to create instance', () => {
        const MyParam = MakeParameterDecorator('MyParam', (token: any) => ({ token }));
        const instance = new (MyParam as any)(String);
        assert.equal(instance.token, String);
    });

    test('stores metadata at correct parameter index', () => {
        const MyParam = MakeParameterDecorator('MyParam', (v: string) => ({ v }));

        class Target {
            constructor(
                @MyParam('first') a: string,
                b: number,
                @MyParam('third') c: boolean
            ) {}
        }

        const params = GetParametersMetadata(Target);
        assert.ok(Array.isArray(params[0]));
        assert.equal((params[0][0] as any).v, 'first');
        assert.ok(!params[1] || params[1] === null);
        assert.ok(Array.isArray(params[2]));
        assert.equal((params[2][0] as any).v, 'third');
    });

    test('multiple decorators on the same param are stacked', () => {
        const DecA = MakeParameterDecorator('A', (v: string) => ({ v }));
        const DecB = MakeParameterDecorator('B', (v: string) => ({ v }));

        class Target {
            constructor(
                @DecB('b')
                @DecA('a')
                x: string
            ) {}
        }

        const params = GetParametersMetadata(Target);
        assert.equal(params[0].length, 2);
    });

    test('calls optional fn hook', () => {
        let hookIdx = -1;
        const MyParam = MakeParameterDecorator('MyParam', undefined, undefined, (cls, meta, index) => {
            hookIdx = index;
        });

        class Target {
            constructor(@MyParam() x: string) {}
        }

        assert.equal(hookIdx, 0);
    });

    test('inherits from parentClass when provided', () => {
        class Base {}
        const MyParam = MakeParameterDecorator('MyParam', undefined, Base);
        const instance = new MyParam();
        assert.equal(instance instanceof Base, true);
    });
});