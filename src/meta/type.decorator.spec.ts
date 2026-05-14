import 'reflect-metadata';
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { MakeTypeDecorator } from './type.decorator';
import { GetTypeMetadata, GetTypeOwnMetadata } from './meta.common';

describe('MakeTypeDecorator', () => {
    test('returns a factory function', () => {
        const MyDec = MakeTypeDecorator('MyDec');
        assert.equal(typeof MyDec, 'function');
    });

    test('decorator pushes metadata onto class', () => {
        const MyDec = MakeTypeDecorator('MyDec', (label: string) => ({ label }));

        @MyDec('hello')
        class Target {}

        const meta = GetTypeMetadata(Target);
        assert.equal(meta.length, 1);
        assert.equal((meta[0] as any).label, 'hello');
    });

    test('sets decoratorName on prototype', () => {
        const MyDec = MakeTypeDecorator('TestName');
        assert.equal((MyDec as any).prototype.decoratorName, 'TestName');
    });

    test('can be used with new to create instance', () => {
        const MyDec = MakeTypeDecorator('MyDec', (x: number) => ({ x }));
        const instance = new MyDec(10);
        assert.equal(instance.x, 10);
    });

    test('calls optional fn hook after decorating', () => {
        let hookCalled = false;
        const MyDec = MakeTypeDecorator('MyDec', undefined, undefined, (cls, meta) => {
            hookCalled = true;
        });

        @MyDec()
        class Target {}

        assert.equal(hookCalled, true);
    });

    test('multiple decorators stack on the same class', () => {
        const DecA = MakeTypeDecorator('A', (v: string) => ({ v }));
        const DecB = MakeTypeDecorator('B', (v: string) => ({ v }));

        @DecB('b')
        @DecA('a')
        class Target {}

        const meta = GetTypeMetadata(Target);
        assert.equal(meta.length, 2);
    });

    test('own metadata is isolated per class', () => {
        const MyDec = MakeTypeDecorator('MyDec', (v: string) => ({ v }));

        @MyDec('parent')
        class Parent {}

        @MyDec('child')
        class Child extends Parent {}

        const parentOwn = GetTypeOwnMetadata(Parent);
        const childOwn = GetTypeOwnMetadata(Child);
        assert.equal(parentOwn.length, 1);
        assert.equal(childOwn.length, 1);
        assert.equal((childOwn[0] as any).v, 'child');
    });

    test('inherits from parentClass when provided', () => {
        class Base { baseMethod() { return true; } }
        const MyDec = MakeTypeDecorator('MyDec', undefined, Base);
        const instance = new MyDec();
        assert.equal(instance instanceof Base, true);
    });
});