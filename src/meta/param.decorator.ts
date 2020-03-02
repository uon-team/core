import { Type } from '../util/type.utils';
import { CreateMetadataCtor, GetOrDefineMetadata, META_PARAMETERS } from './meta.common';


export interface ParamDecorator {
    (target: Object, propertyKey: string | symbol, parameterIndex: number): void;
}


/**
 * Create a function parameter decorator
 * @param name 
 * @param props 
 * @param parentClass 
 * @param fn 
 */
export function MakeParameterDecorator(
    name: string,
    props?: (...args: any[]) => any,
    parentClass?: Type<any>,
    fn?: (cls: any, meta: any, index: number) => void) {

    const meta_ctor = CreateMetadataCtor(props);

    function ParameterDecoratorFactory(...args: any[]): ParamDecorator {

        if (this instanceof ParameterDecoratorFactory) {
            meta_ctor.call(this, ...args);
            return this;
        }

        const meta_instance = new (<any>ParameterDecoratorFactory)(...args);

        function ParamDecorator(cls: any, key: string | symbol, index: number) {

            fn && fn(cls, meta_instance, index);

            let annotations = GetOrDefineMetadata(META_PARAMETERS, cls, key, []);

            // insert the annotation in its own array, 
            // but first pad array with null values
            while (annotations.length <= index) {
                annotations.push(null);
            }

            annotations[index] = annotations[index] || [];
            annotations[index].push(meta_instance)

        };

        return ParamDecorator;
    }

    if (parentClass) {
        ParameterDecoratorFactory.prototype = Object.create(parentClass.prototype);
    }

    ParameterDecoratorFactory.prototype.decoratorName = name;

    return ParameterDecoratorFactory as any;

}