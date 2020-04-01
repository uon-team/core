

import { Type } from '../util/type.utils';
import { Module, ModuleRef, ModuleWithProviders } from './module';
import { Injector } from '../di/injector';
import { GetTypeMetadata } from '../meta/meta.common';
import { InjectionToken } from '../di/injectable';
import { Provider } from '../di/provider';

// the token to use for async initialization
export const APP_INITIALIZER = new InjectionToken<any>("APP_INIT");

/**
 * The application class is used to start all dependent 
 * modules and their providers
 */
export class Application {

    /** The main module */
    private _main: Type<any>;

    /** Flat list of loaded module */
    private _m: ModuleRef<any>[] = [];

    /** The application's root injector */
    private _i: Injector;

    /** A map of types (declarations) linked to a loaded module */
    private _d: Map<Type<any>, ModuleRef<any>> = new Map();


    /**
     * Creates a new application
     * @param startup The startup module type
     */
    constructor(startup: Type<any>) {

        this._main = startup;

        // the root provider list, start with the default providers
        let providers: any[] = [{
            token: Application,
            value: this
        }];

        // create the root injector
        this._i = Injector.Create(providers);

        // get providers form main module
        let mod: Module = GetTypeMetadata(this._main).find(m => m instanceof Module);

        // finally load all modules
        this._rlm(this._main, this._i, mod.providers);

    }

    /**
     * Get a map of all module refs loaded
     */
    get modules() {
        return this._m;
    }

    /**
     * Get the entrypoint module type
     */
    get main() {
        return this._main;
    }

    /**
     * Get map of association between declaration -> ModuleRef
     */
    get declarations() {
        return this._d;
    }

    /**
     * Start the application
     */
    async start(): Promise<ModuleRef<any>> {

        let main_ref: ModuleRef<any> = null;

        // instanciate modules
        for (let i = 0; i < this._m.length; ++i) {

            let ref = this._m[i];

            const initializers = ref.injector.get(APP_INITIALIZER, []);

            // chain initializers
            for (let i = 0; i < initializers.length; ++i) {
                await initializers[i];
            }

            // create the module instance
            let instance = ref.injector.instanciate(ref.type);
            ref.instance = instance;


            if(ref.type === this._main) {
                main_ref = ref;
            }

        }

        return main_ref;
    }


    /**
     * Load all modules recursively
     * @param type 
     */
    private _rlm(type: Type<any> | ModuleWithProviders, parentInjector: Injector, initialProviders: Provider[] = []) {

        // get module's meta data
        let module_type: Type<any> = (type as ModuleWithProviders).module || (type as Type<any>);
        let mod: Module = GetTypeMetadata(module_type).find(m => m instanceof Module);


        if (!mod) {
            throw new Error(`${module_type} was not decorated with @Module()`)
        }

        // create a module ref
        const ref = <ModuleRef<any>>({
            module: mod,
            type: module_type
        });


        let providers: Provider[] = initialProviders
            .concat([{ token: ModuleRef, value: ref }]);

        // providers from imports should be available in this module
        if (mod.imports && mod.imports.length) {

            const loaded_imports: any[] = [];

            mod.imports.forEach((m) => {

                // get module type
                let module_type: Type<any> = (m as ModuleWithProviders).module || (m as Type<any>);

                // check for duplicates
                if (loaded_imports.indexOf(module_type) > -1) {
                    throw new Error(`${module_type} is imported twice in the same module. If you must import this module twice, move the second occurence to another module.`)
                }

                loaded_imports.push(module_type)

                // get module metadata
                let mod: Module = GetTypeMetadata(module_type).find(m => m instanceof Module);

                // get import providers
                let extra_providers = (m as ModuleWithProviders).providers || [];
                let import_providers = (mod.providers || []).concat(extra_providers);

                // append to list
                providers.push(...import_providers);

            });

        }

        // create an injector for the module
        const injector = Injector.Create(providers, parentInjector);

        // set the injector into module ref
        ref.injector = injector;

        // add to module list
        this._m.push(ref);

        if(mod.declarations && mod.declarations.length) {

            for (let i = 0; i < mod.declarations.length; i++) {
                const decl = mod.declarations[i];

                const at_module = this._d.get(decl);
                if(at_module) {
                    throw new Error(`Cannot redeclare ${decl.name} in module ${module_type}, it is already declared in module ${at_module.type.name}`)
                }

                this._d.set(decl, ref);
            }
        }


        // load imported modules
        if (mod.imports && mod.imports.length) {
            mod.imports.forEach((m) => {
                this._rlm(m, injector);
            });
        }


    }


    /**
     * Creates an application with the main module
     * @param module The startup module for the application
     */
    static Bootstrap(module: Type<any>) {

        return new Application(module);
    }
}


