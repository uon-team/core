

declare var global: any;
declare var window: any;

const GLOBAL: any = global || window;

export function MakeUnique<T>(id: string, value: T): T {

    const symbol = Symbol.for(id);

    if (!GLOBAL[symbol]) {
        GLOBAL[symbol] = value;
    }

    return GLOBAL[symbol];

}