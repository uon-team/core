

import { Type } from './Type';
import { Module, ModuleRef, ModuleWithProviders } from './Module';
import { Injector } from './Injector';
import { CreateMetadataCtor, GetOrDefineMetadata, META_PROPERTIES, META_ANNOTATIONS } from './Metadata';
import { Injectable } from './Injectable';
import { PathUtils } from './Utils';


/**
 * The result of a match operation
 */
export interface RouteMatch {

    path: string;
    router: RouterInfo<any>;
    route: RouteInfo<any>;
    params: { [k: string]: string };

}


export interface RouterInfo<T> {
    path: string;
    type: Type<any>;
    metadata: T;
    router?: Router<T>;
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
export interface RouterRecord<T> {

    // the original route object
    route: RouterInfo<T>;

    // the regex to test the path with
    regex: RegExp;

}

export type RouteMatchFunction = (ri: RouteInfo<any>, data: any) => boolean;


/**
 * The Router type
 */
export class Router<T>  {


    readonly records: RouterRecord<T>[] = [];

    /**
     * Create a new router with provided routes
     * @param routes 
     */
    constructor(private matchFunctions: RouteMatchFunction[] = []) {

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
    sort(compareFn: (a: RouterRecord<T>, b: RouterRecord<T>) => number) {


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
