import { Type } from '../util/type.utils';
import { MakeUnique } from '../util/unique';
import { GetMetadata, GetTypeMetadata } from '../meta/meta.common';
import { TypeDecorator, MakeTypeDecorator } from '../meta/type.decorator';
import { ParamDecorator, MakeParameterDecorator } from '../meta/param.decorator';


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
    MakeUnique("@uon/core/Injectable",
        MakeTypeDecorator(
            'Injectable', // name
            (token: any) => ({ token }), // properties
            null, // parent
            (cls: any, meta: any) => {
                meta.token = GetMetadata('design:type', cls);
            }
        ));

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
    MakeUnique("@uon/core/Inject",
        MakeParameterDecorator(
            'Inject',
            (token: any) => ({ token }),
            null,
            (cls: any, meta: Inject, index: number) => {
                if (!meta.token) {
                    meta.token = (GetMetadata('design:paramtypes', cls) as any[])[index];
                }
            }
        ));

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
    MakeUnique("@uon/core/Optional",
        MakeParameterDecorator('Optional'));



/**
 * SelfDecorator
 */
export interface SelfDecorator {
    (): ParamDecorator;
    new(): any;
}

/**
 * Limit the provider search to the local injector only, no parents
 */
export const Self: SelfDecorator =
    MakeUnique("@uon/core/Self",
        MakeParameterDecorator('Self'));