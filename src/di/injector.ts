/**
 * Some code borrowed from @angular/core. Distributed under the same license
 */

import { Type } from '../util/type.utils';
import { Provider, ValueProvider, FactoryProvider, ClassProvider, AliasProvider } from './provider';
import { InjectionToken, Inject, Optional, Self } from './injectable';
import { GetParametersMetadata, GetMetadata } from '../meta/meta.common';

export const THROW_IF_NOT_FOUND = Object.freeze({});

const IDENTITY = (val: any) => { return val };
const EMPTY_VALUE: any[] = [];
const CIRCULAR_VALUE = {};
const MULTIPROVIDER_FUNC = function (): any[] { return Array.prototype.slice.call(arguments) };


/**
 * A NullInjector always returns the default or can throw
 */
export class NullInjector implements Injector {

    get(token: any, defaultValue: any = THROW_IF_NOT_FOUND): any {
        if (defaultValue === THROW_IF_NOT_FOUND) {

            throw new Error(`No provider for ${token.name || token.toString()}!`);
        }
        return defaultValue;
    }

    async getAsync(token: any, defaultValue: any = THROW_IF_NOT_FOUND) {

        if (defaultValue === THROW_IF_NOT_FOUND) {
            return new Error(`No provider for ${token}!`);
        }
        return defaultValue;

    }

    instanciate(type: Type<any>): any {
        throw new Error(`Cannot instanciate on a NullInjector`);
    }

    async instanciateAsync<T>(type: Type<any>): Promise<any> {
        throw new Error(`Cannot instanciate on a NullInjector`);
    }

    async invokeAsync<T extends (...args: any[]) => any>(func: T): Promise<ReturnType<T>> {
        throw new Error(`Cannot invoke on a NullInjector`);
    }
}

/**
 * Base class for injectors
 */
export abstract class Injector {

    static readonly NULL = new NullInjector();

    /**
     * Retrieve or instanciate a value associated with a token.
     * @param token 
     * @param defaultValue 
     */
    abstract get<T>(token: Type<T> | InjectionToken<T>, defaultValue?: any): T;


    /**
     * Asyncronously retrieve or instanciate a value associated with a token.
     * @param token 
     * @param defaultValue 
     */
    abstract getAsync<T>(token: Type<T> | InjectionToken<T>, defaultValue?: any): Promise<T>;


    /**
     * Instanciate a class 
     * @param type 
     */
    abstract instanciate<T>(type: Type<T>): T;

    /**
     * Asyncronoulsy instanciate a class 
     * @param type 
     */
    abstract instanciateAsync<T>(type: Type<T>): Promise<T>;


    /**
     * Asyncronoulsy instanciate a class 
     * @param type 
     */
    abstract invokeAsync<T extends (...args: any[]) => any>(func: T): Promise<ReturnType<T>>;


    /**
     * Create an injector with a list of providers and optionally
     * a parent injector.
     * @param providers 
     * @param parent 
     */
    static Create(providers: Provider[], parent?: Injector) {
        return new StaticInjector(providers, parent);
    }
}


/**
 * The default injector type
 */
export class StaticInjector implements Injector {

    readonly parent: Injector;
    private records: Map<any, InjectionRecord>;

    constructor(providers: Provider[], parent: Injector = Injector.NULL) {

        this.parent = parent;
        this.records = new Map<any, InjectionRecord>();

        // add self as record
        this.records.set(Injector, { func: IDENTITY, deps: EMPTY_VALUE, value: this, instanciate: false });

        // process all providers
        this.recursivelyResolveProviders(providers);
    }

    get<T>(token: Type<T> | InjectionToken<T>, defaultValue: any = THROW_IF_NOT_FOUND): T {

        const record = this.records.get(token);

        return this.resolveToken(token, record, defaultValue);
    }

    /**
     * 
     * @param token 
     * @param defaultValue 
     */
    async getAsync<T>(token: Type<T> | InjectionToken<T>, defaultValue: any = THROW_IF_NOT_FOUND): Promise<T> {

        const record = this.records.get(token);

        const val = await this.resolveTokenAsync(token, record, defaultValue);
        return val;
    }

    instanciate<T>(type: Type<T>): T {

        // get deps for ctor
        let dep_records = GetInjectionTokens(type);
        let deps: any[] = [];

        dep_records.forEach((it) => {
            deps.push(this.get(it.token, it.optional ? null : THROW_IF_NOT_FOUND));
        });

        return new (type as any)(...deps);

    }

    async instanciateAsync<T>(type: Type<T>): Promise<T> {

        let p = Promise.resolve();

        let dep_records = GetInjectionTokens(type);
        let deps: any[] = [];

        for (let i = 0, l = dep_records.length; i < l; ++i) {
            const it = dep_records[i];
            const val = await this.getAsync(it.token, it.optional ? null : THROW_IF_NOT_FOUND);
            deps.push(val);
        }

        return new (type as any)(...deps);
    }

    async invokeAsync<T extends (...args: any[]) => any>(func: T): Promise<ReturnType<T>> {


        let dep_records = GetInjectionTokens(func);
        let deps: any[] = [];

        for (let i = 0, l = dep_records.length; i < l; ++i) {
            const it = dep_records[i];
            const val = await this.getAsync(it.token, it.optional ? null : THROW_IF_NOT_FOUND);
            deps.push(val);
        }

        return func(...deps);
    }

    /**
     * 
     * @param token 
     * @param record 
     * @param defaultValue 
     */
    private resolveToken(token: any, record: InjectionRecord, defaultValue: any, selfOnly?: boolean): any {

        if (record) {

            let value = record.value;

            if (value == CIRCULAR_VALUE) {
                throw new Error("Circular dependency");
            }
            else if (value === EMPTY_VALUE) {

                record.value = CIRCULAR_VALUE;

                let obj = undefined;
                let instanciate = record.instanciate;
                let func = record.func;
                let dep_records = record.deps;
                let deps = EMPTY_VALUE;

                if (dep_records.length) {
                    deps = [];
                    for (let i = 0; i < dep_records.length; ++i) {

                        const dep_record = dep_records[i];
                        const child_rec = this.records.get(dep_record.token);
                        const resolved_dep = this.resolveToken(
                            dep_record.token,
                            child_rec,
                            dep_record.optional ? null : THROW_IF_NOT_FOUND,
                            dep_record.self
                        );


                        deps.push(resolved_dep)

                    }

                }

                record.value = value = instanciate ? new (func as any)(...deps) : func.apply(obj, deps);

            }

            return record.value;

        }
        else if (selfOnly !== true) {
            // check parent
            return this.parent.get(token, defaultValue);
        }
        else {
            return Injector.NULL.get(token, defaultValue);
        }

    }

    /**
     * 
     * @param token 
     * @param record 
     * @param defaultValue 
     */
    private async resolveTokenAsync(token: any, record: InjectionRecord, defaultValue: any, selfOnly?: boolean): Promise<any> {

        if (record) {

            let value = record.value;

            if (value == CIRCULAR_VALUE) {
                throw new Error("Circular dependency");
            }
            else if (value === EMPTY_VALUE) {

                record.value = CIRCULAR_VALUE;

                let obj: any = undefined;
                let instanciate = record.instanciate;
                let func = record.func;
                let dep_records = record.deps;
                let deps: any[] = [];
                if (dep_records.length) {
                    for (let i = 0; i < dep_records.length; ++i) {

                        const dep_record = dep_records[i];
                        const child_rec = this.records.get(dep_record.token);

                        const resolved_dep = await this.resolveTokenAsync(
                            dep_record.token,
                            child_rec,
                            dep_record.optional ? null : THROW_IF_NOT_FOUND,
                            dep_record.self
                        );

                        deps.push(resolved_dep);

                    }

                }

                value = instanciate ? new (func as any)(...deps) : func.apply(obj, deps);
                record.value = value;
            }

            return record.value;

        }
        else if (selfOnly !== true) {
            // check parent
            return this.parent.getAsync(token, defaultValue);
        }
        else {
            return Injector.NULL.getAsync(token, defaultValue);
        }

    }

    private recursivelyResolveProviders(provider: Provider | Provider[]) {

        if (provider) {

            // load provider array
            if (provider instanceof Array) {
                for (let i = 0; i < provider.length; i++) {
                    this.recursivelyResolveProviders(provider[i]);
                }
            }
            // provider is a type
            else if (typeof provider === 'function') {

                let token = provider;
                const resolved = this.resolveProvider(provider);

                this.records.set(token, resolved);

            }
            // provider is an object
            else if (typeof provider === 'object' && provider.token) {

                let token = provider.token;
                const resolved = this.resolveProvider(provider);

                if (provider.multi === true) {
                    let multi_provider = this.records.get(token);
                    if (multi_provider) {
                        if (multi_provider.func !== MULTIPROVIDER_FUNC) {
                            throw new Error('Multi-provider error');
                        }
                    }
                    else {
                        multi_provider = {
                            deps: [],
                            instanciate: false,
                            func: MULTIPROVIDER_FUNC,
                            value: EMPTY_VALUE
                        };

                        this.records.set(token, multi_provider);
                    }

                    token = provider;
                    multi_provider.deps.push({ token: token });
                }

                const record = this.records.get(token);
                if (record && record.func === MULTIPROVIDER_FUNC) {
                    throw new Error('Multi-provider error');
                }

                this.records.set(token, resolved);

            }
            // invalid provider
            else {

                throw new Error('Invalid provider');
            }

        }
    }

    private resolveProvider(provider: Provider): InjectionRecord {

        const deps = this.resolveDependencies(provider);
        let value: any = EMPTY_VALUE;
        let func: Function = IDENTITY;
        let instanciate: boolean = false;
        let async: boolean = false;

        if (typeof provider === 'function') {
            func = provider;
            instanciate = true;
        }
        else if ('value' in provider) {
            value = (provider as ValueProvider).value;
        }
        else if ((provider as FactoryProvider).factory) {
            func = (provider as FactoryProvider).factory;
        }
        else if ((provider as ClassProvider).type) {
            func = (provider as ClassProvider).type;
            instanciate = true;
        }
        else if ((provider as AliasProvider).use) {
            func = () => { return this.get((provider as AliasProvider).use); };
            instanciate = false;
        }
        else {
            throw new Error('Not a Provider');
        }

        return { deps, func, value, instanciate };

    }

    private resolveDependencies(provider: Provider): DependencyRecord[] {

        let deps: DependencyRecord[] = [];

        const provider_deps: any[] = (provider as FactoryProvider & ClassProvider).deps;

        if (typeof provider === 'function') {

            // start with ctor deps
            deps = GetInjectionTokens(provider);

        }
        else if ((provider as ClassProvider).type) {

            // start with ctor deps
            deps = GetInjectionTokens((provider as ClassProvider).type);

        }
        else if (provider_deps && provider_deps.length) {

            // provided dependencies
            provider_deps.forEach((d) => {
                deps.push({ token: d });
            });

        }


        return deps;
    }

}


interface InjectionRecord {

    deps: DependencyRecord[];
    func: Function;
    value: any;
    instanciate: boolean;
    async?: boolean;
}

export interface DependencyRecord {
    token: any;
    optional?: boolean;
    self?: boolean;
}

/**
 * Extracts the constructor's parameter tokens
 * @param type The class to extract ctor parameter tokens from
 */
export function GetInjectionTokens(type: Type<any> | Function, key?: string): DependencyRecord[] {

    let param_types = GetMetadata('design:paramtypes', type, key);
    let params: any[] = GetParametersMetadata(type, key) || [];

    let result: DependencyRecord[] = [];
    if (param_types) {
        for (let i = 0; i < param_types.length; ++i) {

            let token = param_types[i];
            let optional = false;
            let self = false;
            let annotations: any[] = params[i];
            if (annotations && annotations.length) {
                for (let j = 0; j < annotations.length; ++j) {
                    if (annotations[j] instanceof Inject) {
                        token = annotations[j].token;
                    }
                    else if (annotations[j] instanceof Self) {
                        self = true;
                    }
                    else if (annotations[j] instanceof Optional) {
                        optional = true;
                    }
                }
            }

            result.push({ token, optional, self });
        }
    }


    return result;
}

