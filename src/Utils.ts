
declare var global: any;

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
     */
    extend(target: any, ...others: any[]) {

        var i, l, key, source;

        for (i = 0, l = others.length; i < l; i++) {
            source = others[i];
            for (key in source) {
                target[key] = source[key];
            }
        }

        return target;

    },

};

/**
 * Some array manipulation utility functions
 */
export const ArrayUtils = {


    /**
     * Add an element to an array if it isn't already contained
     * @param target 
     * @param obj 
     */
    include(target: any[], obj: any) {

        if (target.indexOf(obj) !== -1) {
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
    erase(target: any[], obj: any) {

        let index = target.indexOf(obj);
        if (index > -1) {

            target.splice(index, 1);
            return true;
        }

        return false;
    }


};

/**
 * Some string manipulation utility function
 */
export const StringUtils = {

    /**
     * Transform an hypenated(with : - _ .) to camelcase
     * @param str the subject
     * @param upperCamelCase wheter to capitalize the first letter
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
    }

};


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

        // Turn back into a single string path.
        return new_parts.join(PATH_DELIMITER);

    }


}

