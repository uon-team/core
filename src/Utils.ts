
declare var global: any;
declare var self: any;

/**
 * Reference to the global object, either window or global
 */
export const GLOBAL = (typeof self === 'object' && self.self === self && self) ||
    (typeof global === 'object' && global.global === global && global) ||
    this;

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
