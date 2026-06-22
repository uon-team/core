import { GLOBAL } from "./global";


/**
 * Assigns a value to a global symbol, if the symbol was
 * already set from a previous call to MakeUnique, the initial
 * value is returned.
 * @param id 
 * @param value 
 */
export function MakeUnique<T>(id: string, value: T): T {

    const symbol = Symbol.for(id);

    // use an explicit undefined check so falsy singletons (0, '', false)
    // are not re-created/overwritten on subsequent calls
    if (GLOBAL[symbol] === undefined) {
        GLOBAL[symbol] = value;
    }

    return GLOBAL[symbol];

}