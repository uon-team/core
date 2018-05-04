

export const META_ANNOTATIONS = "uon:annotations";
export const META_PARAMETERS = "uon:parameters";
export const META_PROPERTIES = "uon:properties";
export const META_MODULE = "uon:module";

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

export function GetOrDefineMetadata(metadataKey: string, obj: any, defaultValue: any = []): any {

    let annot: any = Reflect.getMetadata(metadataKey, obj);

    if (!annot) {
        annot = defaultValue;
        Reflect.defineMetadata(metadataKey, annot, obj);
    }

    return annot;
}

export function GetMetadata(metadataKey: string, obj: any) {
    return Reflect.getMetadata(metadataKey, obj);
}

export function FindMetadataOfType(metadataKey: string, obj: any, type: any) {

    let data = Reflect.getMetadata(metadataKey, obj);

    if (!data || !data.length) {
        return null;
    }

    for(let i = 0; i < data.length; ++i) {
        if(data[i] instanceof type) {
            return data[i];
        }
    }

    return null;


}