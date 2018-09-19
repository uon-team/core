

import { Type } from './Type';
import { Module, ModuleRef, ModuleWithProviders } from './Module';
import { Injector } from './Injector';
import { CreateMetadataCtor, GetOrDefineMetadata, META_PROPERTIES, META_ANNOTATIONS, GetMetadata, FindMetadataOfType } from './Metadata';
import { Injectable } from './Injectable';
import { PathUtils } from './Utils';



export interface Controller {
    path: string;
    priority?: number;
    parent?: Type<any>;

}

export interface Handler {
    path: string;

}


/**
 * The result of a match operation
 */
export interface RouteMatch {

    path: string;
    router: RouterInfo<any, any>;
    route: RouteInfo<any>;
    params: { [k: string]: string };

}


export interface RouterInfo<T extends Controller, H extends Handler> {
    path: string;
    type: Type<any>;
    metadata: T;
    router?: Router<T,H>;
    routes?: RouteInfo<any>[];
    module?: ModuleRef<any>;
}

export interface RouteInfo<T> {
    regex: RegExp;
    metadata: T;
    keys: any[];
}

/**
 * The internal route storage
 */
export interface RouterRecord<T extends Controller, H extends Handler> {

    // the original route object
    route: RouterInfo<T, H>;

    // the regex to test the path with
    regex: RegExp;

}

export type RouteMatchFunction = (ri: RouteInfo<any>, data: any) => boolean;



const EMPTY_OBJECT = {};

/**
 * The Router type
 */
export class Router<T extends Controller, H extends Handler>  {


    readonly records: RouterRecord<T, H>[] = [];

    /**
     * Create a new router with provided routes
     * @param routes 
     */
    constructor(private controllerType: Type<T>, 
        private handlerType:Type<H>, 
        private matchFunctions: RouteMatchFunction[] = []) {

    }

    /**
     * Adds an entry to this router
     * @param type 
     * @param moduleRef 
     */
    add(type: Type<any>, moduleRef?: ModuleRef<any>) {

        const properties = GetMetadata(META_PROPERTIES, type.prototype) || EMPTY_OBJECT;
        const ctrl: T = FindMetadataOfType(META_ANNOTATIONS, type, this.controllerType);

        const this_ctor: any = this.constructor;

        if (ctrl) {

            let handlers: RouteInfo<H>[] = [];

            // go over all properties to find HttpRoutes
            for (let name in properties) {
                if (Array.isArray(properties[name])) {
                    properties[name].forEach((p: any) => {
                        if (p instanceof this.handlerType) {

                            let h = p as H;
                            let param_keys: string[] = [];

                            // build regex
                            let regex = PathUtils.pathToRegex(PathUtils.join(ctrl.path, h.path) || '/', param_keys);

                            handlers.push({
                                regex: regex,
                                metadata: h,
                                keys: param_keys
                            });

                        }
                    });
                }
            }

            // we only create an entry if path is defined
            if (ctrl.path) {

                let rbase: Router<T, H> = this;

                // find parent if needed
                if (ctrl.parent) {

                    for (let j = 0; j < this.records.length; ++j) {

                        if (this.records[j].route.type === ctrl.parent) {
                            rbase = this.records[j].route.router as Router<T, H>;
                            break;
                        }
                    }

                    if (rbase === this) {
                        throw new Error(`Couldnt find parent with type ${ctrl.parent.name}. Make sure it has been added first.`);
                    }

                }

                let keys: string[] = [];
                let regex = PathUtils.pathToRegex(ctrl.path + '(.*)', keys);

                rbase.records.push({
                    route: {
                        type: type,
                        path: ctrl.path,
                        metadata: ctrl,
                        router: new this_ctor(this.controllerType, this.handlerType, this.matchFunctions),
                        routes: handlers,
                        module: moduleRef
                    },
                    regex: regex
                });
            }
        }

        this.sort((a, b) => {
            return a.route.metadata.priority - b.route.metadata.priority;
        });

    }

    /**
     * Remove all routes coming from a controller
     * @param type 
     */
    remove(type: Type<any>) {


        const records = this.records;

        for(let i = records.length - 1; i >= 0; --i) {

            let r = records[i];
            if(r.route.type === type) {
                records.splice(i, 1);
                break;
            }
            else {
                r.route.router.remove(type);
            }
        }

    }

    /**
     * Match the path with the local records
     * @param path 
     */
    match(path: string, data: any = null, output: RouteMatch[] = []) {

        // iterate over all records
        for (let i = 0; i < this.records.length; ++i) {

            let r = this.records[i];
            let routes = r.route.routes;

            // check if we match the base path
            if (!r.regex.test(path)) {
                continue;
            }
            

            // check routes to see if they match
            for (let j = 0; j < routes.length; ++j) {

                let h = routes[j];

                // match user provided funcs and data
                if(!this.matchUserData(h, data)) {
                    continue;
                }

                // finally test the path of the handler
                if (h.regex.test(path)) {
                    output.push({
                        path: path,
                        router: r.route,
                        params: ExtractParams(h, path),
                        route: h
                    });
                }

            }

            // compute new path
            let new_path = PathUtils.join('/', r.regex.exec(path)[1]) || '/';

            // do the match on the child router
            r.route.router.match(new_path, data, output);

        }

        return output;
    }


    /**
     * Sort router records recursively
     * @param compareFn 
     */
    sort(compareFn: (a: RouterRecord<T, H>, b: RouterRecord<T, H>) => number) {


        this.records.sort(compareFn);

        for (let i = 0; i < this.records.length; ++i) {
            this.records[i].route.router.sort(compareFn);
        }
    }


    /**
     * Test user data against match functions
     * @param handler 
     * @param data 
     */
    private matchUserData(handler: RouteInfo<any>, data: any) {

        if (!data) {
            return true;
        }

        const match_funcs = this.matchFunctions;
        const match_funcs_count = match_funcs.length;

        for (let k = 0; k < match_funcs_count; ++k) {
            if (!match_funcs[k](handler, data)) {
                return false;

            }
        }

        return true;

    }



}


/**
 * Extracts the parameters from the supplied path
 * @param record
 * @param path 
 */
function ExtractParams(route: RouteInfo<any>, path: string) {

    let named = route.keys;
    let result: { [k: string]: string } = {};
    let params = path.match(route.regex);
    
    for (let i = 0; i < named.length; i++) {
        let key = named[i].name;
        result[key] = params[i + 1];

    }


    return result;
}
