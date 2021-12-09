


declare var setTimeout: Function;

export interface Deferred<T> extends Promise<T> {
    resolve: (value?: T | PromiseLike<T>) => void;
    reject: (reason?: any) => void;
}

export function MakeDeferred<T>(): Deferred<T> {
    let methods;
    const promise = new Promise<T>((resolve, reject): void => {
        methods = { resolve, reject };
    });
    return Object.assign(promise, methods) as Deferred<T>;
}

export function RejectAfterMs<T = any>(ms: number, err?: unknown) {
    return new Promise<T>((_, reject) => {
        setTimeout(reject, ms, err)
    });
}

export function ResolveAfterMs<T>(ms: number, value?: T) {
    return new Promise<T>((resolve, _) => {
        setTimeout(resolve, ms, value)
    });
}