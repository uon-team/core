

import { Type } from './Type';
import { Provider } from './Provider';
import { Injector } from './Injector';
import { TypeDecorator, MakeTypeDecorator } from './Metadata';

/**
 * A ModuleRef represents a Module instanciation
 */
export class ModuleRef<T> {

    module: Module;
    type: Type<any>;
    instance: T;
    injector: Injector;
}


/**
 * A module with extra providers
 */
export interface ModuleWithProviders {
    module: Type<any>;
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
    MakeTypeDecorator('Module', (meta: Module) => meta);


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
     * Application level providers.
     * Providers declared here are available application-wide
     */
    providers?: Provider[];

    /**
     * List of types to export with the module
     */
    declarations?: Type<any>[];

}