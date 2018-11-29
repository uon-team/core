import { GLOBAL } from "./Utils";


export function MakeUnique<T>(id: string, value: T): T {

    const symbol = Symbol.for(id);

    if (!GLOBAL[symbol]) {
        GLOBAL[symbol] = value;
    }

    return GLOBAL[symbol];

}