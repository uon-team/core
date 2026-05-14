import { Type } from '../util/type.utils';
import { InjectionToken } from './injectable';
import { Injector } from './injector';


export interface BaseProvider {

	token: any;

	multi?: boolean;
}

/**
 * Provides a static value
 */
export interface ValueProvider extends BaseProvider {
    value: any;
}

/**
 * Provides a class type for instanciation by injector
 */
export interface ClassProvider extends BaseProvider {
    type: Type<any>;
}

/**
 * Provides an existing provider with a different token
 */
export interface AliasProvider extends BaseProvider {
    use: Type<any>;
}

/**
 * Provides a factory called by the injector
 */
export interface FactoryProvider extends BaseProvider {
    factory: Function;
    deps?: any[];
}

/**
 * Provides a type to be instantiated by the injector
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
 * @param type the type to instantiate
 * @param multi whether this is a multi provider
 */
export function ProvideInjectable<T>(token: InjectionToken<T>, type: Type<T>, multi: boolean = false): Provider {

    return {
        token,
        factory: (i: Injector) => {
            return i.instanciate(type);
        },
        deps: [Injector],
        multi
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
