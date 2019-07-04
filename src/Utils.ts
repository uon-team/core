
declare var global: any;
declare var self: any;

/**
 * Reference to the global object, either window or global
 */
export const GLOBAL = (typeof self === 'object' && self.self === self && self) ||
    (typeof global === 'object' && global.global === global && global) ||
    this;


/**
 * Some Object manipulation utility functions
 */
export const ObjectUtils = {

    /**
     * Does a shallow merge of ...others with target
     * @deprecated Use Object.assign() or spread operator instead
     */
    extend(target: any, ...others: any[]) {
        let i, l, key, source;

        for (i = 0, l = others.length; i < l; i++) {
            source = others[i];
            for (key in source) {
                target[key] = source[key];
            }
        }

        return target;

    },

    /**
     * Create a new object keeping only specified key/value pairs from
     * target.
     * @param target 
     * @param fields 
     */
    filter(target: any, fields: string[]) {
        let result: any = {};
        for (let i = 0; i < fields.length; ++i) {
            let field = fields[i];
            result[field] = target[field];
        }

        return result;
    }

};

/**
 * Some array manipulation utility functions
 */
export const ArrayUtils = {


    /**
     * Add an element to an array if it isn't already contained.
     * Uses strict equality as a predicate
     * @param target 
     * @param obj 
     */
    include<T>(target: T[], obj: T) {
        if (target.indexOf(obj) === -1) {
            target.push(obj);
        }

        return target;
    },

    /**
     * Remove an element from an array by reference
     * @param target 
     * @param obj 
     * @returns true if an element was removed, false otherwise 
     */
    erase<T>(target: T[], obj: T) {
        let index = target.indexOf(obj);
        if (index > -1) {
            target.splice(index, 1);
            return true;
        }

        return false;
    }


};

/**
 * A collection of string manipulation functions
 */
export const StringUtils = {

    /**
     * Transform an hypenated(with : - _ .) to camelcase
     * @param str the subject
     * @param upperCamelCase if true, capitalize the first letter
     */
    camelCase(str: string, upperCamelCase?: boolean) {

        return str.replace(/([\:\-\_\.]+(.))/g, (_, separator, letter, offset) => {

            return offset || upperCamelCase ? letter.toUpperCase() : letter;
        });
    },

    /**
     * Hypenate a camelcased string
     * @param str the camelCase string
     * @param sep the separator to use, defaults to '-'
     */
    hyphenate(str: string, sep: string = '-') {

        return String(str)
            .replace(/[A-Z]/g, (match) => {
                return (sep + match.charAt(0).toLowerCase());
            })
            .replace(new RegExp(`^${sep}`), '');

    },

    /**
     * Quotes a string and escapes quotation marks
     * @param str 
     */
    quote(str: string) {
        return `"${str.replace(/"/g, '\"')}"`;
    },

    /**
     * Unquotes a string only if it starts and ends with "
     * This will also unescape quotation marks
     * @param str 
     */
    unquote(str: string) {
        if (str.charAt(0) === '"' && str.charAt(str.length - 1) === '"') {
            return str.substr(1, str.length - 2).replace(/\\"/g, '"');
        }

        return str;
    },

    /**
     * Hashes a string to a number, taken from the Java implementation
     * @param s 
     */
    hash(s: string) {
        var h = 0, l = s.length, i = 0;
        if (l > 0)
            while (i < l)
                h = (h << 5) - h + s.charCodeAt(i++) | 0;
        return h;
    },

    /**
     * Format a string with {0}, {1} etc..
     * @param str 
     * @param args 
     */
    format(str: string, ...args: any[]) {

        return str.replace(/{(\d+)}/g, (ss, index) => {
            return typeof args[index] != 'undefined'
                ? args[index]
                : ss
                ;
        });
    },

    /**
     * Pad a string or number from the left side.
     * If {padWith} length does not execatly fit it is sliced from the back.
     * @param val 
     * @param maxLen Thelength of the resulting string
     * @param padWith The content to pad with, can be longer then 1 character
     */
    padLeft(val: number | string, maxLen: number, padWith: string) {

        const str = String(val);
        const str_len = str.length;
        const pad_len = padWith.length;
        const padding_width = maxLen - str_len;
        const pad_count = Math.floor(padding_width / pad_len);
        const remainder_len = padding_width % pad_len;
        let result = remainder_len ? padWith.slice(-remainder_len) : '';

        for (let i = 0; i < pad_count; ++i) {
            result += padWith;
        }

        return result + str;

    },

    /**
     * Pad a string or number to the right
     * @param val 
     * @param maxLen 
     * @param padWith 
     */
    padRight(val: number | string, maxLen: number, padWith: string) {

        const str = String(val);
        const str_len = str.length;
        const pad_len = padWith.length;
        const padding_width = maxLen - str_len;
        const pad_count = Math.floor(padding_width / pad_len);
        const remainder_len = padding_width % pad_len;
        let result = str;

        for (let i = 0; i < pad_count; ++i) {
            result += padWith;
        }

        return result + (remainder_len ? padWith.substr(0, remainder_len) : '');

    },

    /**
     * Compute the similarity of 2 strings using the cosine algorithm
     * @param str1 
     * @param str2 
     */
    similarity(str1: string, str2: string): number {

        if (str1 === str2) return 1.0;
        if (str1.length == 0 || str2.length == 0) return 0.0;

        let v1 = SimilarityVector(str1);
        let v2 = SimilarityVector(str2);

        let dot = SimilarityDot(v1, v2);

        let magnitude = SimilarityMag(v1) * SimilarityMag(v2);

        return dot / magnitude;
    }

};

function SimilarityVector(str: string): { [k: string]: number } {

    const res: { [k: string]: number } = {};

    for (let i = 0; i < str.length; ++i) {
        res[str[i]] = (res[str[i]] || 0) + 1;
    }

    return res;
}

function SimilarityDot(v1: { [k: string]: number }, v2: { [k: string]: number }) {
    let product = 0;

    for (let k in v1) {
        product += v1[k] * (v2[k] || 0);
    }

    return product;
}

function SimilarityMag(v: { [k: string]: number }) {

    let product = 0;

    for (let k in v) {
        product += v[k] * v[k];
    }

    return Math.sqrt(product);
}


const PATH_DELIMITER = '/';

export const PathUtils = {

    /**
     * Joins path parts with '/' delimiter
     * @param parts 
     */
    join(...paths: string[]) {

        let parts: string[] = [];
        let new_parts: string[] = [];

        // split each path into it's parts and add em to the list
        for (var i = 0, l = paths.length; i < l; i++) {
            parts = parts.concat(paths[i].split(PATH_DELIMITER));
        }

        // put all the parts back together
        for (i = 0, l = parts.length; i < l; i++) {

            let part = parts[i];

            // ignore empty parts
            if (!part) {
                continue;
            }


            new_parts.push(part);
        }

        // if the first part started with a slash, we want to keep it
        if (parts[0] === "") {
            new_parts.unshift("");
        }

        // turn back into a single string path
        return new_parts.join(PATH_DELIMITER);

    }


}


// type utilities

/**
 * Get the array element type
 */
export type Unpack<T> = T extends (infer U)[] ? U : T;

/**
 * Returns U if M extends T
 */
export type Include<M, T, U> = M extends T ? U : never;

/**
 * Extract property names of type P
 */
export type PropertyNamesOfType<T, P> = { [K in keyof T]: T[K] extends P ? K : never }[keyof T];

/**
 * Extract property names not of type P
 */
export type PropertyNamesNotOfType<T, P> = { [K in keyof T]: T[K] extends P ? never : K }[keyof T];
