

import { Type } from './Type';


/**
 * Module definition options
 */
export interface ModuleOptions {

    // An optional name for the module
    name?: string

    // Modules dependencies
    imports?: Type<any>[],

    // Other modules to expose
    exports?: Function[],

    // A list of providers
    providers?: any[]

}


/**
 * A modules metadata
 */
export interface ModuleMetadata {

    // An opaque id for the module
    id?: string;

    // The module's class
    type?: Type<any>;

    // Modules dependencies
    imports?: Type<any>[];

    // Other modules to expose
    exports?: Function[];


    deps?: Type<any>[]

}



/**
 * Defines a module with it's dependencies
 * @param options 
 */
export function Module(options?: ModuleOptions): any {


    return function ModuleDecorator<T>(target: Type<T>) {


        return target;
    }

}
