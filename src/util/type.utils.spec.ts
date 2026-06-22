import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { IsPromise, IsDate, IsFunction, IsObject, IsType } from './type.utils';

describe('IsPromise', () => {
    test('returns true for a real Promise', () => {
        assert.equal(IsPromise(Promise.resolve()), true);
    });

    test('returns true for a thenable', () => {
        assert.equal(IsPromise({ then: () => {} }), true);
    });

    test('returns false for null', () => {
        assert.equal(IsPromise(null), false);
    });

    test('returns false for a plain object', () => {
        assert.equal(IsPromise({}), false);
    });

    test('returns false for a string', () => {
        assert.equal(IsPromise('promise'), false);
    });
});

describe('IsDate', () => {
    test('returns true for a valid Date', () => {
        assert.equal(IsDate(new Date()), true);
    });

    test('returns false for an invalid Date', () => {
        assert.equal(IsDate(new Date('invalid')), false);
    });

    test('returns false for a number', () => {
        assert.equal(IsDate(Date.now()), false);
    });

    test('returns false for a date string', () => {
        assert.equal(IsDate('2024-01-01'), false);
    });
});

describe('IsFunction', () => {
    test('returns true for a function', () => {
        assert.equal(IsFunction(() => {}), true);
    });

    test('returns true for a class', () => {
        assert.equal(IsFunction(class {}), true);
    });

    test('returns false for an object', () => {
        assert.equal(IsFunction({}), false);
    });

    test('returns false for null', () => {
        assert.equal(IsFunction(null), false);
    });
});

describe('IsObject', () => {
    test('returns true for a plain object', () => {
        assert.equal(IsObject({}), true);
    });

    test('returns false for null', () => {
        assert.equal(IsObject(null), false);
    });

    test('returns true for an array', () => {
        assert.equal(IsObject([]), true);
    });

    test('returns false for a string', () => {
        assert.equal(IsObject('str'), false);
    });

    test('returns false for a number', () => {
        assert.equal(IsObject(42), false);
    });

    test('returns false for a function', () => {
        assert.equal(IsObject(() => {}), false);
    });
});

describe('IsType', () => {
    test('returns true for a class constructor', () => {
        class Foo {}
        assert.equal(IsType(Foo), true);
    });

    test('returns true for a plain function', () => {
        assert.equal(IsType(function () {}), true);
    });

    test('returns false for an object', () => {
        assert.equal(IsType({}), false);
    });

    test('returns false for null', () => {
        assert.equal(IsType(null), false);
    });
});