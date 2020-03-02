import { Type } from '../util/type.utils';
import { InjectionToken } from './injectable';
import { Injector } from './injector';

/**
 * Provides a static value
 */
export interface ValueProvider {

    token: any;

    value: any;

    multi?: boolean;
}

/**
 * Provides a class type for instanciation by injector
 */
export interface ClassProvider {

    token: any;

    type: Type<any>;

    multi?: boolean;

}

/**
 * Provides an existing provider with a diffent token
 */
export interface AliasProvider {

    token: any;

    use: Type<any>;

    multi?: boolean;

}

/**
 * Provides a factory called by the injector
 */
export interface FactoryProvider {

    token: any;

    factory: Function;

    deps?: any[];

    multi?: boolean;
}

/**
 * Provides a type to be instanciated by the injector 
 * using the type itself as the token
 */
export interface TypeProvider extends Type<any> { }

/**
 * The Provider type describes the ways a provider can be defined
 */
export type Provider = TypeProvider | ValueProvider | ClassProvider | AliasProvider | FactoryProvider;


/**
 * Utility function for providing a dependency-injected 
 * class instance for a given token
 * @param token the token for which to provide
 * @param type the type to instanciate
 * @param multi whether this is a multi provider
 */
export function ProvideInjectable<T>(token: InjectionToken<T>, type: Type<T>, multi: boolean = false): Provider {

    return {
        token,
        multi,
        factory: (i: Injector) => {
            return i.instanciate(type);
        },
        deps: [Injector]
    };

}

/**
 * Utility function for providing a static value
 * @param token 
 * @param value 
 */
export function ProvideValue<T>(token: InjectionToken<T>, value: T, multi: boolean = false): Provider {
    return {
        token, 
        value,
        multi
    };
}
