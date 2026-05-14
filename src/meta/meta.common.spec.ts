import 'reflect-metadata';
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
    GetOrDefineMetadata,
    GetMetadata,
    GetOwnMetadata,
    GetTypeMetadata,
    GetTypeOwnMetadata,
    GetParametersMetadata,
    GetPropertiesMetadata,
    GetPropertiesOwnMetadata,
    FindMetadataOfType,
    CreateMetadataCtor,
    META_ANNOTATIONS,
    META_PARAMETERS,
    META_PROPERTIES,
} from './meta.common';

describe('GetOrDefineMetadata', () => {
    test('returns defaultValue when key is not set', () => {
        const obj = {};
        const result = GetOrDefineMetadata('test:key', obj, undefined, []);
        assert.deepEqual(result, []);
    });

    test('defines the metadata when not present', () => {
        const obj = {};
        const arr: any[] = [];
        GetOrDefineMetadata('test:def', obj, undefined, arr);
        assert.equal(GetOwnMetadata('test:def', obj), arr);
    });

    test('returns existing metadata without overwriting', () => {
        const obj = {};
        const first = GetOrDefineMetadata('test:exists', obj, undefined, ['a']);
        const second = GetOrDefineMetadata('test:exists', obj, undefined, ['b']);
        assert.deepEqual(first, ['a']);
        assert.deepEqual(second, ['a']);
    });
});

describe('GetMetadata / GetOwnMetadata', () => {
    test('GetMetadata retrieves inherited metadata', () => {
        const parent = {};
        Reflect.defineMetadata('test:inherit', 'hello', parent);
        const child = Object.create(parent);
        assert.equal(GetMetadata('test:inherit', child), 'hello');
    });

    test('GetOwnMetadata does not see inherited metadata', () => {
        const parent = {};
        Reflect.defineMetadata('test:own', 'hello', parent);
        const child = Object.create(parent);
        assert.equal(GetOwnMetadata('test:own', child), undefined);
    });
});

describe('GetTypeMetadata', () => {
    test('returns empty array when no annotations', () => {
        class Bare {}
        assert.deepEqual(GetTypeMetadata(Bare), []);
    });

    test('returns annotations array', () => {
        class Target {}
        const ann = { label: 'x' };
        Reflect.defineMetadata(META_ANNOTATIONS, [ann], Target);
        assert.deepEqual(GetTypeMetadata(Target), [ann]);
    });
});

describe('GetTypeOwnMetadata', () => {
    test('returns only own annotations, not inherited', () => {
        class Parent {}
        class Child extends Parent {}
        const parentAnn = { label: 'parent' };
        const childAnn = { label: 'child' };
        Reflect.defineMetadata(META_ANNOTATIONS, [parentAnn], Parent);
        Reflect.defineMetadata(META_ANNOTATIONS, [childAnn], Child);
        assert.deepEqual(GetTypeOwnMetadata(Child), [childAnn]);
    });
});

describe('GetParametersMetadata', () => {
    test('returns empty array when no parameter metadata', () => {
        function fn() {}
        assert.deepEqual(GetParametersMetadata(fn), []);
    });

    test('returns stored parameter metadata', () => {
        function fn() {}
        const meta = [null, [{ token: String }]];
        Reflect.defineMetadata(META_PARAMETERS, meta, fn);
        assert.deepEqual(GetParametersMetadata(fn), meta);
    });
});

describe('GetPropertiesMetadata / GetPropertiesOwnMetadata', () => {
    test('returns empty object when no properties metadata', () => {
        class Target {}
        assert.deepEqual(GetPropertiesMetadata(Target.prototype), {});
    });

    test('returns stored properties metadata', () => {
        class Target {}
        const meta = { myProp: [{ label: 'test' }] };
        Reflect.defineMetadata(META_PROPERTIES, meta, Target.prototype);
        assert.deepEqual(GetPropertiesMetadata(Target.prototype), meta);
    });

    test('GetPropertiesOwnMetadata does not see inherited', () => {
        class Parent {}
        class Child extends Parent {}
        const meta = { foo: [{ x: 1 }] };
        Reflect.defineMetadata(META_PROPERTIES, meta, Parent.prototype);
        assert.deepEqual(GetPropertiesOwnMetadata(Child.prototype), {});
    });
});

describe('FindMetadataOfType', () => {
    test('returns matching instance', () => {
        class Tag { name: string; }
        const instance = Object.assign(new Tag(), { name: 'test' });
        const obj = {};
        Reflect.defineMetadata(META_ANNOTATIONS, [instance], obj);
        const found = FindMetadataOfType(META_ANNOTATIONS, obj, Tag);
        assert.equal(found, instance);
    });

    test('returns null when not found', () => {
        class Tag {}
        const obj = {};
        Reflect.defineMetadata(META_ANNOTATIONS, [{}], obj);
        assert.equal(FindMetadataOfType(META_ANNOTATIONS, obj, Tag), null);
    });

    test('returns null when no metadata', () => {
        class Tag {}
        assert.equal(FindMetadataOfType(META_ANNOTATIONS, {}, Tag), null);
    });
});

describe('CreateMetadataCtor', () => {
    test('creates an object with properties from the factory', () => {
        const ctor = CreateMetadataCtor((name: string, value: number) => ({ name, value }));
        const obj: any = {};
        ctor.call(obj, 'hello', 42);
        assert.equal(obj.name, 'hello');
        assert.equal(obj.value, 42);
    });

    test('works without a properties factory', () => {
        const ctor = CreateMetadataCtor();
        const obj: any = {};
        assert.doesNotThrow(() => ctor.call(obj));
    });
});