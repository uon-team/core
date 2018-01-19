

import 'reflect-metadata';
import { Type } from './Type';
import { CreateMetadataCtor, GetOrDefineMetadata, META_ANNOTATIONS, META_PROPERTIES, META_PARAMETERS } from './Metadata';

/**
 * Use InjectionToken as unique symbol
 */
export class InjectionToken<T> {

    constructor(protected desc: string) { }

    toString(): string { return `InjectionToken ${this.desc}`; }
}



/**
 * The Injectable interface
 */
export interface Injectable {
    token: any;
}

/**
 * Annotates a class as injectable
 */
export function Injectable() {

    const meta_ctor = CreateMetadataCtor((token: any) => ({ token }));
    if (this instanceof Injectable) {
        meta_ctor.apply(this, arguments);
        return this;
    }

    return function InjectableDecorator(target: any) {

        let annotations = GetOrDefineMetadata(META_ANNOTATIONS, target, []);

        // create the metadata with either a privided token or the class type
        let meta_instance = new (<any>Injectable)(target);

        // push the metadata
        annotations.push(meta_instance);

        return target;
    }

}

export function IsInjectable(type: Type<any>) {

    let annotations: any[] = Reflect.getMetadata(META_ANNOTATIONS, type);

    if (annotations) {
        for (let i = 0; i < annotations.length; ++i) {
            if (annotations[i] instanceof Injectable) {
                return true;
            }

        }
    }

    return false;

}

/**
 * The Inject interface
 */
export interface Inject {
    token: any;
}

/**
 * Mark a member or parameter to inject a value
 * @param token 
 */
export function Inject(token?: any) {

    const meta_ctor = CreateMetadataCtor((token: any) => ({ token }));
    if (this instanceof Inject) {
        meta_ctor.apply(this, arguments);
        return this;
    }

    return function InjectDecorator(target: any, key: string, index?: number) {

        // get the member parameter type
        let type: any;
        let annotation_key: string;

        if (index === undefined) {
            // no index provided, must be member
            type = Reflect.getMetadata('design:type', target, key);
            annotation_key = META_PROPERTIES;
        }
        else {
            // we got an index, get param types
            type = Reflect.getMetadata('design:paramtypes', target)[index];
            annotation_key = META_PARAMETERS;
        }

        // create a metadata object, if a token was provided, use that instead of the reflected type
        let meta_instance = new (<any>Inject)(token || type);

        // grab the metadata from the target
        let annotations: any = GetOrDefineMetadata(annotation_key, target, index === undefined ? {} : []);

        // in the case of members, just push the metadata
        if (index === undefined) {

            annotations[key] = meta_instance;
        }
        else {
            // for ctor parameters, insert the annotation in its own array
            while (annotations.length <= index) {
                annotations.push(null);
            }

            annotations[index] = annotations[index] || [];
            annotations[index].push(meta_instance)

        }
    }
}


export function Optional() {

    if (this instanceof Optional) {
        return this;
    }

    return function OptionalDecorator(target: any, key: string, index: number) {


        // we got an index, get param types
        let type = Reflect.getMetadata('design:paramtypes', target)[index];
        // create a metadata object, if a token was provided, use that instead of the reflected type
        let meta_instance = new (<any>Optional)();

        // grab the metadata from the target
        let annotations: any = GetOrDefineMetadata(META_PARAMETERS, target, []);


        // for ctor parameters, insert the annotation in its own array
        while (annotations.length <= index) {
            annotations.push(null);
        }

        annotations[index] = annotations[index] || [];
        annotations[index].push(meta_instance)

    }
}


