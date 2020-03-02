import { Type } from '../util/type.utils';
import { META_PROPERTIES, GetOrDefineMetadata, CreateMetadataCtor } from './meta.common';



export interface PropDecorator {
    (target: Object, propertyKey: string | symbol): void;
}


/**
 * Create a property decorator
 * @param name The name of the decorator
 * @param props Function that returns a key/value map of the meta object properties
 * @param parentClass The parent class of this decorator, can be null
 * @param fn A function call after the metadata instance has been created
 */
export function MakePropertyDecorator(
    name: string,
    props?: (...args: any[]) => any,
    parentClass?: Type<any>,
    fn?: (cls: any, meta: any, key: string | symbol) => void) {


    const meta_ctor = CreateMetadataCtor(props);

    function PropertyDecoratorFactory(...args: any[]): PropDecorator {

        if (this instanceof PropertyDecoratorFactory) {
            meta_ctor.call(this, ...args);
            return this;
        }

        const meta_instance = new (<any>PropertyDecoratorFactory)(...args);

        function PropDecorator(cls: any, key: string | symbol) {

            fn && fn(cls, meta_instance, key);

            let annotations = GetOrDefineMetadata(META_PROPERTIES, cls, undefined, {});

            annotations[key] = annotations[key] || [];
            annotations[key].push(meta_instance)

        };

        return PropDecorator;
    }

    if (parentClass) {
        PropertyDecoratorFactory.prototype = Object.create(parentClass.prototype);
    }

    PropertyDecoratorFactory.prototype.decoratorName = name;

    return PropertyDecoratorFactory as any;
}