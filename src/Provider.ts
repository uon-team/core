

import { Type } from './Type';
import { InjectionToken } from './Injectable';
import { Injector } from './Injector';




export interface ValueProvider {

    token: any;

    value: any;

    multi?: boolean;
}

export interface ClassProvider {

    token: any;

    type: Type<any>;

    multi?: boolean;

}

export interface FactoryProvider {

    token: any;

    factory: Function;

    deps?: any[];

    multi?: boolean;
}

export interface TypeProvider extends Type<any> { }



export type Provider = TypeProvider | ValueProvider | ClassProvider | FactoryProvider;



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
