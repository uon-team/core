declare var global: any;
declare var self: any;

/**
 * Reference to the global object, either window or global
 */
export const GLOBAL = (typeof self === 'object' && self.self === self && self) ||
    (typeof global === 'object' && global.global === global && global) ||
    this;
