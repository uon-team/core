import 'reflect-metadata';
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { Module, ModuleRef } from './module';
import { Injector } from '../di/injector';
import { GetTypeMetadata, FindMetadataOfType, META_ANNOTATIONS } from '../meta/meta.common';

describe('Module decorator', () => {
    test('stores Module metadata on the decorated class', () => {
        @Module({ id: 'm1', providers: [] })
        class M {}

        const meta = GetTypeMetadata(M).find(m => m instanceof Module);
        assert.ok(meta);
        assert.equal(meta.id, 'm1');
    });

    test('is discoverable via FindMetadataOfType', () => {
        @Module({ id: 'm2' })
        class M {}

        const meta = FindMetadataOfType(META_ANNOTATIONS, M, Module);
        assert.ok(meta instanceof Module);
        assert.equal((meta as any).id, 'm2');
    });

    test('can be used with new to build a Module metadata instance', () => {
        const m = new Module({ id: 'm3', imports: [] });
        assert.ok(m instanceof Module);
        assert.equal(m.id, 'm3');
    });

    test('preserves imports / providers / declarations fields', () => {
        class Dep {}
        @Module({ imports: [], providers: [{ token: 'T', value: 1 }], declarations: [Dep] })
        class M {}

        const meta = GetTypeMetadata(M).find(m => m instanceof Module);
        assert.equal(meta.declarations[0], Dep);
        assert.equal(meta.providers.length, 1);
    });
});

describe('ModuleRef', () => {
    test('holds module / type / instance / injector fields', () => {
        const ref = new ModuleRef<any>();
        class M {}
        const inj = Injector.Create([]);
        ref.type = M;
        ref.injector = inj;
        ref.instance = new M();

        assert.equal(ref.type, M);
        assert.equal(ref.injector, inj);
        assert.ok(ref.instance instanceof M);
    });
});
