declare var global: any;
declare var self: any;

/**
 * Reference to the global object (globalThis / window / global).
 *
 * Prefers the standard `globalThis`, falling back to `self` (browsers/workers)
 * and `global` (node). The previous module-scope `this` fallback is unreliable
 * under strict mode / ES modules where `this` is `undefined`.
 */
export const GLOBAL = (typeof globalThis === 'object' && globalThis) ||
    (typeof self === 'object' && self.self === self && self) ||
    (typeof global === 'object' && global.global === global && global);
