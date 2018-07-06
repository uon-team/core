

import 'reflect-metadata';
import { Type } from './Type';
import { ParamDecorator, TypeDecorator, MakeParameterDecorator, MakeTypeDecorator, GetMetadata, META_ANNOTATIONS } from './Metadata';

/**
 * Use InjectionToken as unique symbol
 */
export class InjectionToken<T> {

    constructor(protected desc: string) { }

    toString(): string { return `InjectionToken ${this.desc}`; }
}


export interface InjectableDecorator {
    (): TypeDecorator;
    new(): Injectable;
}

/**
 * The Injectable interface
 */
export interface Injectable {
    token: any;
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
 * Check if a type has injectable metadata
 * @param type 
 */
export function IsInjectable(type: Type<any>) {

    let annotations: any[] = GetMetadata(META_ANNOTATIONS, type);

    if (annotations) {
        for (let i = 0; i < annotations.length; ++i) {
            if (annotations[i] instanceof Injectable) {
                return true;
            }

        }
    }

    return false;

}


export interface InjectDecorator {

    (token: any): ParamDecorator;
    new(token: any): Inject;
}
/**
 * The Inject interface
 */
export interface Inject {
    token: any;
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


export interface OptionalDecorator {
    (): ParamDecorator;
    new(): any;
}

export const Optional: OptionalDecorator =
    MakeParameterDecorator('Optional');


