

declare var global: any;
declare var window: any;

var GLOBAL: any;
try {
    GLOBAL = global;
}
catch {
    GLOBAL = window;
}


export function MakeUnique<T>(id: string, value: T): T {

    const symbol = Symbol.for(id);

    if (!GLOBAL[symbol]) {
        GLOBAL[symbol] = value;
    }

    return GLOBAL[symbol];

}