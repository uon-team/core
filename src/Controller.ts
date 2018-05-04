

import { Type } from './Type';
import { Injector } from './Injector';
import { Provider } from './Provider';
import { CreateMetadataCtor, GetOrDefineMetadata, META_ANNOTATIONS, GetMetadata } from './Metadata';
import { ModuleRef } from './Module';
import { Router } from './Router';


export class ControllerRef<T> {
    controller: Controller;
    instance: T;
    module: ModuleRef<any>;
}


export interface Controller {

    // optional controller name
    name?: string;

    // the controller's parent controller
    parent?: Type<any>;

    // the base path for route handling
    path?: string;

    // the order in which the controller's are executed
    // lower numbers have priority, defaults to 1000
    priority?: number;

}


export function Controller<T extends Controller>(ctrl: T) {

    let meta_ctor = CreateMetadataCtor((ctrl: T) => ctrl);
    if (this instanceof Controller) {
        meta_ctor.apply(this, arguments);
        return this;
    }

    return function ControllerDecorator(target: Type<any>) {

        if (ctrl.parent) {

            let parent_ctrl: Controller = GetControllerMetadata(ctrl.parent, Controller);

            if (!parent_ctrl) {
                throw new Error(`Controller: parent was defined 
                with ${ctrl.parent.name} but doesn't have 
                Controller metadata attached`);
            }

        }

        // get annotations array for this type
        let annotations = GetOrDefineMetadata(META_ANNOTATIONS, target, []);

        // set default priority
        if (ctrl.priority === undefined) {
            ctrl.priority = 1000;
        }

        // create the metadata with either a privided token or the class type
        let meta_instance = new (<any>Controller)(ctrl);


        // push the metadata
        annotations.push(meta_instance);


        return target;
    }
}

export function GetControllerMetadata<T>(type: Type<T>, metaType: Function): any {

    let annotations = GetMetadata(META_ANNOTATIONS, type);

    if (annotations && annotations.length) {
        for (let i = 0, l = annotations.length; i < l; ++i) {
            if (annotations[i] instanceof metaType) {
                return annotations[i];
            }
        }
    }

    return null;

}
