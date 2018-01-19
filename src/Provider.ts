

import { Type } from './Type';




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

export interface TypeProvider extends Type<any> {}



export type Provider = TypeProvider | ValueProvider | ClassProvider | FactoryProvider;