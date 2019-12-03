

import { Type } from './Type';
import { Module, ModuleRef, ModuleWithProviders } from './Module';
import { Injector } from './Injector';
import { GetTypeMetadata } from './Metadata';
import { InjectionToken } from './Injectable';
import { Provider } from './Provider';

// the token to use for async initialization
export const APP_INITIALIZER = new InjectionToken<any>("Application async initializers");


declare var console: any;
/**
 * The application class is used to start all dependent 
 * modules and their providers
 */
export class Application {

    /// the main module
    private mainModuleClass: Type<any>;

    /// the loaded modules map
    //private _modules: Map<Type<any>, ModuleRef<any>> = new Map();
    private _modules: ModuleRef<any>[] = [];

    /// the primary (root) injector
    private _injector: Injector;

    // declarations associations with ModuleRef
    private _declarations: Map<Type<any>, ModuleRef<any>> = new Map();


    /**
     * Creates a new application
     * @param startup The startup module type
     */
    constructor(startup: Type<any>) {

        this.mainModuleClass = startup;

        // the root provider list, start with the default providers
        let providers: any[] = [{
            token: Application,
            value: this
        }];


        // create the root injector
        this._injector = Injector.Create(providers);

        // get providers form main module
        let mod: Module = GetTypeMetadata(this.mainModuleClass).find(m => m instanceof Module);

        // finally load all modules
        this.recursivelyLoadModules(this.mainModuleClass, this._injector, mod.providers);

    }

    /**
     * Get a map of all module refs loaded
     */
    get modules() {
        return this._modules;
    }

    /**
     * Get the entrypoint module type
     */
    get mainModuleType() {
        return this.mainModuleClass;
    }

    /**
     * Get map of association between declaration -> ModuleRef
     */
    get declarations() {
        return this._declarations;
    }

    /**
     * Start the application
     */
    async start(): Promise<boolean> {

        // instanciate modules
        for (let i = 0; i < this._modules.length; ++i) {

            let ref = this._modules[i];

            const initializers = ref.injector.get(APP_INITIALIZER, []);

            // chain initializers
            for (let i = 0; i < initializers.length; ++i) {
                await initializers[i];
            }

            // create the module instance
            let instance = ref.injector.instanciate(ref.type);
            ref.instance = instance;

        }

        return true;
    }


    /**
     * Load all modules recursively
     * @param type 
     */
    private recursivelyLoadModules(type: Type<any> | ModuleWithProviders, parentInjector: Injector, initialProviders: Provider[] = []) {

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
        this._modules.push(ref);

        if(mod.declarations && mod.declarations.length) {

            for (let i = 0; i < mod.declarations.length; i++) {
                const decl = mod.declarations[i];

                const at_module = this._declarations.get(decl);
                if(at_module) {
                    throw new Error(`Cannot redeclare ${decl.name} in module ${module_type}, it is already declared in module ${at_module.type.name} `)
                }

                this._declarations.set(decl, ref);
            }
        }


        // load imported modules
        if (mod.imports && mod.imports.length) {
            mod.imports.forEach((m) => {
                this.recursivelyLoadModules(m, injector);
            });
        }


    }


    static RecursivelyGetModuleDeclarations(moduleType: Type<any> | ModuleWithProviders, out: any[]) {


        let module_type: Type<any> = (moduleType as ModuleWithProviders).module || (moduleType as Type<any>);
        let mod: Module = GetTypeMetadata(module_type).find(m => m instanceof Module);

        if (!mod) {
            throw new Error(`${module_type} was not decoratored with @Module()`)
        }

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



    /**
     * Creates an application with the main module
     * @param module The startup module for the application
     */
    static Bootstrap(module: Type<any>) {

        return new Application(module);
    }
}


