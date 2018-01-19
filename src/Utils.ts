

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
     * @param str 
     */
    camelCase(str: string) {

        return str.replace(/([\:\-\_\.]+(.))/g, (_, separator, letter, offset) => {

            return offset ? letter.toUpperCase() : letter;
        });
    },

    /**
     * Hypenate a camelcased string
     * @param str 
     */
    hyphenate(str: string, sep: string = '-') {

        return String(str)
            .replace(/[A-Z]/g, (match) => {
                return (sep + match.charAt(0).toLowerCase());
            })
            .replace(new RegExp(`^${sep}`), '');


    }

};
