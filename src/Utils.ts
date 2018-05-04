

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
const DEFAULT_DELIMITERS = './'

const PATH_REGEXP = new RegExp([
    // Match escaped characters that would otherwise appear in future matches.
    // This allows the user to escape special characters that won't transform.
    '(\\\\.)',
    // Match Express-style parameters and un-named parameters with a prefix
    // and optional suffixes. Matches appear as:
    //
    // "/:test(\\d+)?" => ["/", "test", "\d+", undefined, "?"]
    // "/route(\\d+)"  => [undefined, undefined, undefined, "\d+", undefined]
    '(?:\\:(\\w+)(?:\\(((?:\\\\.|[^\\\\()])+)\\))?|\\(((?:\\\\.|[^\\\\()])+)\\))([+*?])?'
].join('|'), 'g')

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

    },

    /**
     * Adapted from  https://www.npmjs.com/package/path-to-regexp
     * @param path the path to convert to regex
     * @param keys output's the keys found
     */
    pathToRegex(str: string, keys?: string[]) {


        let tokens: any[] = []
        let key = 0
        let index = 0
        let path = '';
        let path_escaped = false;
        let res: any = null;

        let delimiters = DEFAULT_DELIMITERS;

        while ((res = PATH_REGEXP.exec(str)) !== null) {

            let m = res[0];
            let escaped = res[1];
            let offset = res.index;
            path += str.slice(index, offset);
            index = offset + m.length;


            // Ignore already escaped sequences.
            if (escaped) {
                path += escaped[1]
                path_escaped = true
                continue
            }

            var prev = ''
            var next = str[index]
            var name = res[2]
            var capture = res[3]
            var group = res[4]
            var modifier = res[5]

            if (!path_escaped && path.length) {
                var k = path.length - 1

                if (delimiters.indexOf(path[k]) > -1) {
                    prev = path[k]
                    path = path.slice(0, k)
                }
            }

            // Push the current path onto the tokens.
            if (path) {
                tokens.push(path)
                path = ''
                path_escaped = false
            }

            var partial = prev !== '' && next !== undefined && next !== prev
            var repeat = modifier === '+' || modifier === '*'
            var optional = modifier === '?' || modifier === '*'
            var delimiter = prev || '/'
            var pattern = capture || group

            tokens.push({
                name: name || key++,
                prefix: prev,
                delimiter: delimiter,
                optional: optional,
                repeat: repeat,
                partial: partial,
                pattern: pattern ? escapeGroup(pattern) : '[^' + escapeString(delimiter) + ']+?'
            })
        }

        // Push any remaining characters.
        if (path || index < str.length) {
            tokens.push(path + str.substr(index))
        }



        var delimiter = escapeString(PATH_DELIMITER)

        var endsWith = '$';
        var route = ''
        var isEndDelimited = false

        // Iterate over the tokens and create our regexp string.
        for (var i = 0; i < tokens.length; i++) {
            var token = tokens[i]

            if (typeof token === 'string') {
                route += escapeString(token)
                isEndDelimited = i === tokens.length - 1 && delimiters.indexOf(token[token.length - 1]) > -1
            } else {
                var prefix = escapeString(token.prefix)
                var capture = token.repeat
                    ? '(?:' + token.pattern + ')(?:' + prefix + '(?:' + token.pattern + '))*'
                    : token.pattern

                if (keys) keys.push(token)

                if (token.optional) {
                    if (token.partial) {
                        route += prefix + '(' + capture + ')?'
                    } else {
                        route += '(?:' + prefix + '(' + capture + '))?'
                    }
                } else {
                    route += prefix + '(' + capture + ')'
                }
            }
        }




        route += endsWith === '$' ? '$' : '(?=' + endsWith + ')'


        return new RegExp('^' + route, 'i');

        //return tokens;

    }

}



/**
 * Escape a regular expression string.
 *
 * @param  {string} str
 * @return {string}
 */
function escapeString(str: string) {
    return str.replace(/([.+*?=^!:${}()[\]|/\\])/g, '\\$1')
}

/**
 * Escape the capturing group by escaping special characters and meaning.
 *
 * @param  {string} group
 * @return {string}
 */
function escapeGroup(group: string) {
    return group.replace(/([=!:$/()])/g, '\\$1')
}