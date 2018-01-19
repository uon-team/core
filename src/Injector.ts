

import { Type } from './Type'
import { Provider, ValueProvider, FactoryProvider, ClassProvider } from './Provider';
import { InjectionToken, Inject, Optional } from './Injectable';
import { META_ANNOTATIONS, META_PROPERTIES, META_PARAMETERS } from './Metadata'

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
            throw new Error(`NullInjectorError: No provider for ${token.name}!`);
        }
        return defaultValue;
    }

    instanciate(type: Type<any>): any {
        throw new Error(`NullInjectorError: Cannot instaciate on a NullInjector`);
    }
}

/**
 * Base class for injectors
 */
export abstract class Injector {

    static readonly NULL = new NullInjector();


    abstract get<T>(token: Type<any> | InjectionToken<any>, defaultValue?: T): T;

    abstract instanciate<T>(type: Type<T>): T;

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
                        deps.push(this.resolveToken(dep_record.token, child_rec, dep_record.optional ? null : THROW_IF_NOT_FOUND))

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
            deps =  GetInjectionTokens(provider);

            // get manual injections with @Inject
            //deps = deps.concat(this.resolveInjections(provider));

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
}

interface DependencyRecord {
    token: any
    optional?: boolean 
}

/**
 * Extracts the constructor's parameter tokens
 * @param type The class to extract ctor parameter tokens from
 */
function GetInjectionTokens(type: Type<any>): DependencyRecord[] {
    
        let param_types = Reflect.getMetadata('design:paramtypes', type);
        let params: any[] = Reflect.getMetadata(META_PARAMETERS, type) || [];
    
        let result: DependencyRecord[] = [];
        if (param_types) {
            for (let i = 0; i < param_types.length; ++i) {
    
                let token = param_types[i];
                let optional  = false;
                let annotations: any[] = params[i];
                if (annotations && annotations.length) {
                    for (let j = 0; j < annotations.length; ++j) {
                        if (annotations[j] instanceof Inject) {
                            token = (annotations[j] as Inject).token;
                        } 
                        else if(annotations[j] instanceof Optional) {
                            optional = true;
                        }
                    }
                }
    
                result.push({token, optional});
            }
        }
    
    
        return result;
    }

