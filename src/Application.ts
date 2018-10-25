

import 'reflect-metadata';
import { Type } from './Type';
import { Module, ModuleRef, ModuleWithProviders } from './Module';
import { Injector } from './Injector';
import { GetTypeMetadata } from './Metadata';
import { InjectionToken } from './Injectable';
import { Provider } from './Provider';

// the token to use for async initialization
export const APP_INITIALIZER = new InjectionToken<any>("Application async initializers");

/**
 * The application class is used to start all dependent 
 * modules and their providers
 */
export class Application {

    /// the main module
    private mainModuleClass: Type<any>;

    /// the loaded modules map
    private _modules: Map<Type<any>, ModuleRef<any>> = new Map();

    /// the primary (root) injector
    private _injector: Injector;

    // flattened declarations
    private _declarations: any[] = [];


    /**
     * Creates a new application
     * @param startup The startup module type
     */
    constructor(startup: Type<any>) {

        this.mainModuleClass = startup;

        // the root provider list, start with the default providers
        let providers: any[] = [
            {
                token: Application,
                value: this
            }
        ];

        // append all the modules' providers
        Application.RecursivelyGetModuleProviders(startup, providers);

        Application.RecursivelyGetModuleDeclarations(startup, this._declarations);

        // create the root injector
        this._injector = Injector.Create(providers);

        // finally load all modules
        this.recursivelyLoadModules(this.mainModuleClass);

    }

    /**
     * Get a map of all module refs loaded
     */
    get modules() {
        return this._modules;
    }

    get mainModuleType() {
        return this.mainModuleClass;
    }

    get declarations() {
        return this._declarations;
    }

    /**
     * Start the application
     */
    start(): Promise<boolean> {

        // get the initializer list

        const initializers = this._injector.get(APP_INITIALIZER, []);
        let promise_chain = Promise.resolve();

        // chain initializers if they return a promise
        for (let i = 0; i < initializers.length; ++i) {

            let initer = initializers[i];

            if (initer instanceof Promise) {
                promise_chain = promise_chain.then(() => {
                    return initer;
                });
            }

        }

        // wait until it's all resolved and return true
        return promise_chain.then(() => {


            // instanciate modules

            for (let [mt, ref] of this._modules) {
                // create the module instance
                let instance = ref.injector.instanciate(mt);
                ref.instance = instance;
            }

            return true;
        });
    }


    /**
     * Load all modules recursively
     * @param type 
     */
    private recursivelyLoadModules(type: Type<any> | ModuleWithProviders) {

        // get module's meta data

        let module: Module = null;
        let module_type: Type<any> = (type as ModuleWithProviders).module || (type as Type<any>);
        let annotations: any[] = GetTypeMetadata(module_type);

        for (let i = 0; i < annotations.length; ++i) {

            let a = annotations[i];
            if (a instanceof Module) {

                let mod = a as Module;
                let module_ref = this._modules.get(module_type);

                if (!module_ref) {

                    const ref = <ModuleRef<any>>({
                        module: mod,
                        type: module_type
                    });

                    // create an injector for the module
                    const injector = Injector.Create([{ token: ModuleRef, value: ref }], this._injector);

                    // set the injector into module ref
                    ref.injector = injector;

                    // assign the module
                    this._modules.set(module_type, ref);

                    // load imported modules
                    if (mod.imports && mod.imports.length) {
                        mod.imports.forEach((m) => {
                            this.recursivelyLoadModules(m);
                        });
                    }

                }

            }

        }

    }

    static RecursivelyGetModuleProviders(moduleType: Type<any> | ModuleWithProviders, out: any[]) {

        let module: Module = null;
        let module_type: Type<any> = (moduleType as ModuleWithProviders).module || (moduleType as Type<any>);
        let extra_providers: Provider[] = (moduleType as ModuleWithProviders).providers;
        let annotations: any[] = GetTypeMetadata(module_type);

        for (let i = 0; i < annotations.length; ++i) {
            let a = annotations[i];
            if (a instanceof Module) {

                let mod = a as Module;
                let providers: Provider[] = [];
                let imports = mod.imports;


                // if other providers were declared in the module metadata
                if (mod.providers && mod.providers.length) {
                    providers = providers.concat(mod.providers);
                }

                // if module is a ModuleWithProviders, concat the providers to the list
                if (extra_providers) {
                    providers = providers.concat(extra_providers);
                }

                // go thru all imports
                if (imports && imports.length) {
                    for (let j = 0; j < imports.length; ++j) {
                        this.RecursivelyGetModuleProviders(imports[j], out);
                    }
                }

                // finally add own providers
                if (providers && providers.length) {
                    for (let j = 0; j < providers.length; ++j) {
                        if (out.indexOf(providers[j]) === -1) {
                            out.push(providers[j])
                        }
                    }
                }

            }

        }

    }


    static RecursivelyGetModuleDeclarations(moduleType: Type<any> | ModuleWithProviders, out: any[]) {

        let module: Module = null;
        let module_type: Type<any> = (moduleType as ModuleWithProviders).module || (moduleType as Type<any>);
        //let extra_providers: Provider[] = (moduleType as ModuleWithProviders).providers;
        let annotations: any[] = GetTypeMetadata(module_type);

        for (let i = 0; i < annotations.length; ++i) {
            let a = annotations[i];
            if (a instanceof Module) {

                let mod = a as Module;
                let declarations: Type<any>[] = [];
                let imports = mod.imports;


                // if other providers were declared in the module metadata
                if (mod.declarations && mod.declarations.length) {
                    declarations = declarations.concat(mod.declarations);
                }


                // go thru all imports
                if (imports && imports.length) {
                    for (let j = 0; j < imports.length; ++j) {
                        this.RecursivelyGetModuleDeclarations(imports[j], out);
                    }
                }

                // finally add own declarations
                if (declarations && declarations.length) {
                    for (let j = 0; j < declarations.length; ++j) {
                        if (out.indexOf(declarations[j]) === -1) {
                            out.push(declarations[j])
                        }
                    }
                }

            }

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


