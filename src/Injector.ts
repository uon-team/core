/**
 * Some code borrowed from @angular/core. Distributed under the same license
 */

import { Type } from './Type'
import { Provider, ValueProvider, FactoryProvider, ClassProvider } from './Provider';
import { InjectionToken, Inject, Optional } from './Injectable';
import { GetParametersMetadata } from './Metadata'

const _THROW_IF_NOT_FOUND = new Object();
export const THROW_IF_NOT_FOUND = _THROW_IF_NOT_FOUND;

const IDENTITY = (val: any) => { return val };
const EMPTY_VALUE: any[] = [];
const CIRCULAR_VALUE = {};
const MULTIPROVIDER_FUNC = function (): any[] { return Array.prototype.slice.call(arguments) };




/**
 * A NullInjector always returns the default or can throw
 */
export class NullInjector implements Injector {

    get(token: any, defaultValue: any = _THROW_IF_NOT_FOUND): any {
        if (defaultValue === _THROW_IF_NOT_FOUND) {
            
            throw new Error(`NullInjectorError: No provider for ${token.name || token.toString()}!`);
        }
        return defaultValue;
    }

    getAsync(token: any, defaultValue: any = _THROW_IF_NOT_FOUND) {

        if (defaultValue === _THROW_IF_NOT_FOUND) {
            return Promise.reject(new Error(`NullInjectorError: No provider for ${token}!`));
        }
        return Promise.resolve(defaultValue);

    }

    instanciate(type: Type<any>): any {
        throw new Error(`NullInjectorError: Cannot instanciate on a NullInjector`);
    }

    instanciateAsync<T>(type: Type<any>): Promise<any> {
        return Promise.reject(`NullInjectorError: Cannot instanciate on a NullInjector`);
    }
}

/**
 * Base class for injectors
 */
export abstract class Injector {

    static readonly NULL = new NullInjector();

    abstract get<T>(token: Type<any> | InjectionToken<any>, defaultValue?: T): T;

    abstract getAsync<T>(token: Type<any> | InjectionToken<any>, defaultValue?: T): Promise<T>;

    abstract instanciate<T>(type: Type<T>): T;

    abstract instanciateAsync<T>(type: Type<T>): Promise<T>;

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

    /**
     * Retrieve a value
     * @param token 
     * @param defaultValue 
     */
    get<T>(token: Type<T> | InjectionToken<T>, defaultValue?: T): T {

        const record = this.records.get(token);

        return this.resolveToken(token, record, defaultValue);
    }

    /**
     * 
     * @param token 
     * @param defaultValue 
     */
    getAsync(token: any, defaultValue: any = _THROW_IF_NOT_FOUND) {
        const record = this.records.get(token);

        return this.resolveTokenAsync(token, record, defaultValue).then((val) => {

            return val;
        });
    }


    /**
     * 
     * @param type Instanciate a class with dependencies
     */
    instanciate<T>(type: Type<T>): T {

        // get deps for ctor
        let dep_records = GetInjectionTokens(type);
        let deps: any[] = [];

        dep_records.forEach((it) => {
            deps.push(this.get(it.token, it.optional ? null : THROW_IF_NOT_FOUND));
        });

        return new (type as any)(...deps);

    }

    /**
     * Do the instaciation asynchronously
     * @param type 
     */
    instanciateAsync<T>(type: Type<T>): Promise<T> {

        let p = Promise.resolve();

        let dep_records = GetInjectionTokens(type);
        let deps: any[] = [];

        dep_records.forEach((it) => {

            p = p.then(() => {
                return this.getAsync(it.token, it.optional ? null : THROW_IF_NOT_FOUND);
            }).then((val) => {
                deps.push(val);
            });

        });

        // finally instanciate the object
        return p.then(() => {

            return new (type as any)(...deps);
        });
    }

    /**
     * 
     * @param token 
     * @param record 
     * @param defaultValue 
     */
    private resolveToken(token: any, record: InjectionRecord, defaultValue: any): any {

        let value;

        if (record) {

            value = record.value;

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
                        );


                        deps.push(resolved_dep)

                    }

                }
                record.value = value = instanciate ? new (func as any)(...deps) : func.apply(obj, deps);


            }

        }
        else {
            // check parent
            value = this.parent.get(token, defaultValue);
        }

        return value;

    }

    /**
     * 
     * @param token 
     * @param record 
     * @param defaultValue 
     */
    private resolveTokenAsync(token: any, record: InjectionRecord, defaultValue: any): Promise<any> {

        if (record) {

            return Promise.resolve().then(() => {

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
                    let deps_promises = Promise.resolve();
                    let deps: any[] = [];
                    if (dep_records.length) {
                        for (let i = 0; i < dep_records.length; ++i) {

                            const dep_record = dep_records[i];
                            const child_rec = this.records.get(dep_record.token);
                            const resolved_dep = this.resolveTokenAsync(
                                dep_record.token,
                                child_rec,
                                dep_record.optional ? null : THROW_IF_NOT_FOUND,
                            );
                            deps_promises = deps_promises.then(() => {
                                return resolved_dep.then((d) => {
                                    deps.push(d);
                                });
                            })


                        }

                    }

                    return deps_promises
                        .then(() => {
                            return instanciate ? new (func as any)(...deps) : func.apply(obj, deps);
                        })
                        .then((value) => {
                            record.value = value;
                            return value;
                        });

                }
                else {
                    return Promise.resolve(record.value);
                }


            });


        }
        else {
            // check parent
            return this.parent.getAsync(token, defaultValue);
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
            // provider is a class
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
                            throw new Error('Multi-provider mix up');
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
                    throw new Error('Multi-provider mix up');
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
        else {
            throw new Error('Provider must be TypeProvider, ValueProvider, FactoryProvider or ClassProvider');
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
}

/**
 * Extracts the constructor's parameter tokens
 * @param type The class to extract ctor parameter tokens from
 */
export function GetInjectionTokens(type: Type<any>): DependencyRecord[] {

    let param_types = Reflect.getMetadata('design:paramtypes', type);
    let params: any[] = GetParametersMetadata(type) || [];

    let result: DependencyRecord[] = [];
    if (param_types) {
        for (let i = 0; i < param_types.length; ++i) {

            let token = param_types[i];
            let optional = false;
            let annotations: any[] = params[i];
            if (annotations && annotations.length) {
                for (let j = 0; j < annotations.length; ++j) {
                    if (annotations[j] instanceof Inject) {
                        token = annotations[j].token;
                    }
                    else if (annotations[j] instanceof Optional) {
                        optional = true;
                    }
                }
            }

            result.push({ token, optional });
        }
    }


    return result;
}

