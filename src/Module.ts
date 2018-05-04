

import { Type } from './Type';
import { Provider } from './Provider';
import { Injector } from './Injector';
import { CreateMetadataCtor, GetOrDefineMetadata, META_ANNOTATIONS } from './Metadata';


export class ModuleRef<T> {

    module: Module;
    type: Type<any>;
    instance: T;
    injector: Injector;
}


export interface ModuleWithProviders {
    module: Type<any>;
    providers: Provider[];
}


/**
 * The modules interface
 */
export interface Module {

    // An opaque id for the module
    id?: string;

    // Modules dependencies
    imports?: Array<Type<any> | ModuleWithProviders>;

    // Application level providers
    providers?: Provider[];

    // List of types to export with the module
    declarations?: Type<any>[];

}


/**
 * Defines a module with it's dependencies
 * @param options 
 */
export function Module(meta: Module): any {

    const meta_ctor = CreateMetadataCtor((meta: Module) => meta);
    if (this instanceof Module) {
        meta_ctor.apply(this, arguments);
        return this;
    }


    return function ModuleDecorator<T>(target: Type<T>) {

        let annotations = GetOrDefineMetadata(META_ANNOTATIONS, target, []);

        // create the metadata with either a privided token or the class type
        let meta_instance = new (<any>Module)(meta);

        // push the metadata
        annotations.push(meta_instance);

        return target;
    }

}
