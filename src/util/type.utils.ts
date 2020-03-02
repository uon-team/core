

export const Type = Function;

export function IsType(v: any): v is Type<any> {
    return typeof v === 'function';
}

export interface Type<T> extends Function { new(...args: any[]): T; }


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
