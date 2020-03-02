import { Type } from '../util/type.utils';
import { GetOrDefineMetadata, META_ANNOTATIONS, CreateMetadataCtor } from './meta.common';


export interface TypeDecorator<DT = any> {
    <T extends Type<DT>>(type: T): T;
}


/**
 * Create a generic type decorator
 * @param name 
 * @param props 
 * @param parentClass 
 */
export function MakeTypeDecorator(
    name: string,
    props?: (...args: any[]) => any,
    parentClass?: Type<any>,
    fn?: (cls: any, meta: any) => void) {

    const meta_ctor = CreateMetadataCtor(props);

    function TypeDecoratorFactory(...args: any[]): TypeDecorator {

        if (this instanceof TypeDecoratorFactory) {
            meta_ctor.call(this, ...args);
            return this;
        }

        const meta_instance = new (<any>TypeDecoratorFactory)(...args);

        const TypeDecorator = function TypeDecorator(cls: any) {

            fn && fn(cls, meta_instance);

            let annotations = GetOrDefineMetadata(META_ANNOTATIONS, cls, undefined, []);
            annotations.push(meta_instance);
            return cls;
        };

        return TypeDecorator;
    }

    if (parentClass) {
        TypeDecoratorFactory.prototype = Object.create(parentClass.prototype);
    }

    TypeDecoratorFactory.prototype.decoratorName = name;

    return TypeDecoratorFactory as any;
}