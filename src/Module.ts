

import { Type } from './Type';
import { Provider } from './Provider';
import { Injector } from './Injector';
import { TypeDecorator, MakeTypeDecorator } from './Metadata';
import { MakeUnique } from './Unique';

/**
 * A ModuleRef represents a Module instanciation
 */
export class ModuleRef<T> {

    module: Module;
    type: Type<T>;
    instance: T;
    injector: Injector;
}


/**
 * A module with extra providers
 */
export interface ModuleWithProviders<T = any> {
    module: Type<T>;
    providers: Provider[];
}


/**
 * ModuleDecorator
 */
export interface ModuleDecorator {
    (meta: Module): TypeDecorator;
    new(meta: Module): Module
}


/**
 * Module decorator
 */
export const Module: ModuleDecorator =
    MakeUnique('@uon/core/Module',
        MakeTypeDecorator('Module', (meta: Module) => meta));


/**
 * The modules interface
 */
export interface Module {

    /**
     *  An opaque id for the module
     */
    id?: string;

    /**
     * Modules on which this one depends
     */
    imports?: Array<Type<any> | ModuleWithProviders>;

    /**
     * Module level providers.
     * Providers declared here are available in this
     * module's parent injector
     */
    providers?: Provider[];

    /**
     * List of types to export with the module
     */
    declarations?: Type<any>[];

}