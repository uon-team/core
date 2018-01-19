

import { Type } from './Type';
import { Controller, ControllerRef, GetControllerMetadata } from './Controller';
import { Module, ModuleRef, ModuleWithProviders } from './Module';
import { Injector } from './Injector';
import { CreateMetadataCtor, GetOrDefineMetadata, META_PROPERTIES, META_ANNOTATIONS } from './Metadata';
import { Injectable } from './Injectable';


/**
 * The result of a match operation
 */
export interface RouteMatch {

    path: string;
    router: RouterInfo;
    handler: HandlerInfo;
    params: { [k: string]: string };

}


export interface RouterInfo {
    path: string;
    type: Type<any>;
    controller: Controller;
    router?: Router;
    handlers?: HandlerInfo[];
    module?: ModuleRef<any>;
}

export interface HandlerInfo {
    regex: RegExp;
    methods?: string[];
    handler: RouteHandler;
    keys: string[],
}

/**
 * The internal route storage
 */
interface RouterRecord {

    // the original route object
    route: RouterInfo;

    // the regex to test the path with
    regex: RegExp;

}


/**
 * The Router type
 */
export class Router {


    private records: RouterRecord[] = [];

    /**
     * Create a new router with provided routes
     * @param routes 
     */
    constructor() {

    }

    /**
     * Create a Router hierachy from 
     * @param refs 
     */
    static FromModuleRefs(moduleRefs: Map<Type<any>, ModuleRef<any>>) {

        const root = new Router();
        const entries: RouterInfo[] = [];

        // go over all the loaded modules
        for (let [module_type, module_ref] of moduleRefs) {

            let declarations = module_ref.module.declarations;
            // go over all declaration
            if (declarations) {
                for (let i = 0; i < declarations.length; ++i) {

                    let decl_type = declarations[i];

                    let properties = Reflect.getMetadata(META_PROPERTIES, decl_type.prototype);
                    let ctrl: Controller = GetControllerMetadata(decl_type, Controller);

                    if (ctrl) {

                        let handlers: HandlerInfo[] = [];

                        // go ever all properties to find RouteHandlers
                        if (properties) {
                            for (let name in properties) {
                                if (Array.isArray(properties[name])) {
                                    properties[name].forEach((p: any) => {
                                        if (p instanceof RouteHandler) {

                                            let h = p as RouteHandler;
                                            let param_keys: string[] = [];
                                            let methods: string[];

                                            if (h.method) {
                                                methods = h.method.trim().toUpperCase().split(/\ +/);

                                            }

                                            handlers.push({
                                                regex: BuildRegexForPath(ctrl.path + h.path, param_keys),
                                                handler: h,
                                                methods: methods,
                                                keys: param_keys
                                            });

                                        }
                                    });
                                }
                            }
                        }

                        // we only create an entry if path is defined
                        if (ctrl.path) {
                            entries.push({
                                type: decl_type,
                                path: ctrl.path,
                                controller: ctrl,
                                router: new Router(),
                                handlers: handlers,
                                module: module_ref
                            });
                        }

                    }
                }
            }
        }


        // we have to make sense of all those entries, add the orphan ctrl to the root router
        // but first let's sort all the entries
        entries.sort((a, b) => {

            if (!a.controller.parent) return -1;
            if (!b.controller.parent) return 1;

            if (a.controller.parent === b.type) return 1;
            if (b.controller.parent === a.type) return -1;

            return 0;
        });

        // do the magic
        for (let i = 0; i < entries.length; ++i) {
            let e = entries[i];

            let keys: string[] = [];
            let regex = BuildRegexForPath(e.path, keys);

            if (!e.controller.parent) {
                root.records.push({
                    route: e,
                    regex: regex
                });
            }
            else {

                // find parent entry
                let parent_entry: RouterInfo = null;
                for (let j = 0; j < entries.length; ++j) {

                    if (entries[j].type === e.controller.parent) {
                        parent_entry = entries[j];
                        break;
                    }
                }

                if (!parent_entry) {
                    throw new Error(`Couldnt find entry with type ${e.controller.parent.name}. Check that it is in a module declarations.`);
                }

                parent_entry.router.records.push({
                    route: e,
                    regex: regex
                });
            }

        }


        return root;
    }


    /**
     * Match the path with the local records
     * @param path 
     */
    match(method: string, path: string, output: RouteMatch[] = []) {

        for (let i = 0; i < this.records.length; ++i) {

            let r = this.records[i];
            let handlers = r.route.handlers;

            // check if we the path matches
            if (!r.regex.test(path)) {
                continue;
            }

            // check handlers to see if they match
            for (let j = 0; j < handlers.length; ++j) {

                let h = handlers[j];

                // check if method matches, if defined
                if (h.methods && h.methods.indexOf(method) === -1) {
                    continue;
                }

                // finally test the path of the handler
                if (h.regex.test(path)) {
                    output.push({
                        path: path,
                        router: r.route,
                        params: ExtractParams(h.regex, r.route.path + h.handler.path, path),
                        handler: h
                    });
                }

            }


            // do the match on the child router
            let new_path = path.replace(r.regex, '');
            r.route.router.match(method, new_path, output);

        }


        return output;
    }




}





export interface RouteHandler {

    // an HTTP method, can be a comma separated list
    method?: string;

    // The path to test with parameters (ie. /my/path/:withId/*)
    path: string;

    // the method name, do not set this as it with be overridden
    key?: string;
}

/**
 * RouteHandler decorator for controller methods
 * @param meta 
 */
export function RouteHandler(meta: RouteHandler) {


    let meta_ctor = CreateMetadataCtor((meta: RouteHandler) => meta);
    if (this instanceof RouteHandler) {
        meta_ctor.apply(this, arguments);
        return this;
    }

    return function RouteHandlerDecorator(target: Type<any>, key: string) {

        let annotations = GetOrDefineMetadata(META_PROPERTIES, target, {});

        // set the method key
        meta.key = key;

        // create the metadata with either a privided token or the class type
        let meta_instance = new (<any>RouteHandler)(meta);

        // push the metadata
        annotations[key] = annotations[key] || [];
        annotations[key].push(meta_instance);

        return target;
    }

}




/**
 * Extracts the parameters from the supplied path
 * @param record
 * @param path 
 */
function ExtractParams(regex: RegExp, routePath: string, path: string) {

    let params = regex.exec(path).slice(1);
    let named = routePath.match(/(\(\?)?:\w+/g);
    let result: { [k: string]: string } = {};
    if (named) {
        for (var i = 0; i < named.length; i++) {
            var key = named[i].replace(':', '');
            result[key] = params[i];

        }
    }

    return result;
}
/**
 * Create a regex with a cucumber path
 * @param path 
 */
function BuildRegexForPath(path: string, keys: string[]): RegExp {


    if (path === '/') {
        return /^\/?$/;
    }
    path = path
        //.concat('/?')
        .replace(/\/\(/g, '(?:/')
        .replace(/(\/)?(\.)?:(\w+)(?:(\(.*?\)))?(\?)?|\*/g, function (_, slash, format, key, capture, optional) {
            if (_ === "*") {
                keys.push(undefined);
                return _;
            }

            keys.push(key);
            slash = slash || '';
            return ''
                + (optional ? '' : slash)
                + '(?:'
                + (optional ? slash : '')
                + (format || '') + (capture || '([^/]+?)') + ')'
                + (optional || '');
        })
        .replace(/([\/.])/g, '\\$1')
        .replace(/\*/g, '(.*)');

    return new RegExp('^' + path + '(?=/|$)', 'i');
}
