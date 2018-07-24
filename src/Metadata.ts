
import { Type } from './Type';


export const META_ANNOTATIONS = "uon:annotations";
export const META_PARAMETERS = "uon:parameters";
export const META_PROPERTIES = "uon:properties";
export const META_MODULE = "uon:module";


export interface TypeDecorator {
    <T extends Type<any>>(type: T): T;
}

export interface ParamDecorator {
    (target: Object, propertyKey: string | symbol, parameterIndex: number): void;
}

export interface PropDecorator {
    (target: Object, propertyKey: string | symbol): void;
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

            let annotations = GetOrDefineMetadata(META_ANNOTATIONS, cls, []);
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

            let annotations = GetOrDefineMetadata(META_PARAMETERS, cls, []);

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
    
                let annotations = GetOrDefineMetadata(META_PROPERTIES, cls, {});
    
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

/**
 * 
 * @param properties A function that return a key-value map
 */
export function CreateMetadataCtor(properties?: (...args: any[]) => any) {
    return function ctor(...args: any[]) {
        if (properties) {
            const values = properties(...args);
            for (const name in values) {
                this[name] = values[name];
            }

        }
    }

}

/**
 * Retrieve metadata and/or define it
 * @param metadataKey 
 * @param obj 
 * @param defaultValue 
 */
export function GetOrDefineMetadata(metadataKey: string, obj: any, defaultValue: any = []): any {

    let annot: any = Reflect.getMetadata(metadataKey, obj);

    if (!annot) {
        annot = defaultValue;
        Reflect.defineMetadata(metadataKey, annot, obj);
    }

    return annot;
}

/**
 * Retrieve metadata on an object with the given key
 * @param metadataKey 
 * @param obj 
 */
export function GetMetadata(metadataKey: string, obj: any, key?: string) {
    return Reflect.getMetadata(metadataKey, obj, key);
}


/**
 * Find an annotation of a certain type on an object
 * @param metadataKey 
 * @param obj 
 * @param type 
 */
export function FindMetadataOfType<T>(metadataKey: string, obj: any, type: Type<T>): T {

    const data = Reflect.getMetadata(metadataKey, obj);

    if (!data || !data.length) {
        return null;
    }

    for (let i = 0; i < data.length; ++i) {
        if (data[i] instanceof type) {
            return data[i];
        }
    }

    return null;


}