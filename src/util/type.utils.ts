

/**
 * Checks whether a value is promise-like 
 * @param val 
 */
export function IsPromise(v: any): v is PromiseLike<any> {
    return !!v && typeof v.then === 'function';
}

/**
 * Checks whether a value  is a date of a valid number
 * @param val 
 */
export function IsDate(v: any): v is Date {
    return v instanceof Date && !isNaN(v as any);
}

/**
 * Checks whether the value is a function
 * @param v 
 */
export function IsFunction(v: any): v is Function {
    return typeof v === 'function';
}

/**
 * Checks whether the value is an object
 * @param v 
 */
export function IsObject(v: any): v is Object {
    return typeof v === 'object';
}

/**
 * Represents a class
 */
export interface Type<T> extends Function { new(...args: any[]): T; }

export const Type = Function;

export function IsType(v: any): v is Type<any> {
    return typeof v === 'function';
}



/**
 * Represents a function with a single argument
 */
export interface UnaryFunction<A, R> { (a: A): R; }

/**
 * Represents a function with 2 arguments
 */
export interface BinaryFunction<A, B, R> { (a: A, b: B): R; }

/**
 * Represents a function with 3 arguments
 */
export interface TernaryFunction<A, B, C, R> { (a: A, b: B, c: C): R; }


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
