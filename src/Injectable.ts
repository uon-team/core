

import 'reflect-metadata';
import { Type } from './Type';
import {
    ParamDecorator,
    TypeDecorator,
    MakeParameterDecorator,
    MakeTypeDecorator,
    GetMetadata,
    GetTypeMetadata
} from './Metadata';

/**
 * Use InjectionToken as unique symbol
 */
export class InjectionToken<T> {

    constructor(protected desc: string) { }

    toString(): string { return `InjectionToken ${this.desc}`; }
}


/**
 * InjectableDecorator
 */
export interface InjectableDecorator {
    (): TypeDecorator;
    new(): Injectable;
}


/**
 * Annotates a type as injectable
 */
export const Injectable: InjectableDecorator =
    MakeTypeDecorator(
        'Injectable', // name
        (token: any) => ({ token }), // properties
        null, // parent
        (cls: any, meta: any) => {
            meta.token = GetMetadata('design:type', cls);
        }
    );

/**
* The Injectable interface
*/
export interface Injectable {
    token: any;
}



/**
 * Check if a type has injectable metadata
 * @param type 
 */
export function IsInjectable(type: Type<any>) {

    let annotations: any[] = GetTypeMetadata(type);

    if (annotations) {
        for (let i = 0; i < annotations.length; ++i) {
            if (annotations[i] instanceof Injectable) {
                return true;
            }

        }
    }

    return false;

}


/**
 * InjectDecorator
 */
export interface InjectDecorator {

    (token: any): ParamDecorator;
    new(token: any): Inject;
}

/**
 * The Inject() parameter decorator
 */
export const Inject: InjectDecorator =
    MakeParameterDecorator(
        'Inject',
        (token: any) => ({ token }),
        null,
        (cls: any, meta: Inject, index: number) => {
            if (!meta.token) {
                meta.token = GetMetadata('design:paramtypes', cls)[index];
            }
        }
    );

/**
* The Inject interface
*/
export interface Inject {
    token: any;
}



/**
 * OptionalDecorator
 */
export interface OptionalDecorator {
    (): ParamDecorator;
    new(): any;
}

/**
 * Mark a parameter as optional
 */
export const Optional: OptionalDecorator =
    MakeParameterDecorator('Optional');


