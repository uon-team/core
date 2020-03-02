
// typedef for event handler function
export type EventHandler = (...args: any[]) => Promise<any> | any;

/// internal
interface EventContainer {
    func: EventHandler;
    priority: number;
}

/// internal
type EventMap = { [k: string]: EventContainer[] };


/**
 * An async event emiter implementation, 
 * When emit is called, all listeners are executed sequentially
 */
export class EventSource {

    private __l: EventMap = {};

    /**
     * 
     */
    constructor() {}

    /**
     * Attach an event listener
     * @param type 
     * @param func 
     * @param priority 
     */
    on(type: string, func: EventHandler, priority: number = 100): void {

        let list = this.__l[type];
        if (!list) {
            list = this.__l[type] = [];
        }

        list.push({ func, priority });
        list.sort((a, b) => {
            return a.priority - b.priority;
        });
    }

    /**
     * Attach an event listener that will only be executed once
     * @param type 
     * @param func 
     * @param priority 
     */
    once(type: string, func: EventHandler, priority: number = 100) {

        let f = (...args: any[]) => {
            func.apply(this, args);
            this.removeListener(type, f);
        };
        return this.on(type, f, priority);
    }


    /**
     * Remove an event listener
     * @param type 
     * @param func 
     */
    removeListener(type: string, func: EventHandler) {
        const list = this.__l[type];
        if (list) {
            let obj: EventContainer = null;
            for (let i = 0, l = list.length; i < l; ++i) {
                let o = list[i];
                if (o.func === func) {
                    list.splice(i, 1);
                    break;
                }
            }

        }

    }

    /**
     * Remove all listeners for an event type
     * @param type 
     */
    removeListeners(type: string) {
        delete this.__l[type];
    }

    /**
     * Emit an event, this will execute all listeners sequentially.
     * Returns a Promise that resolves when all listeners themselves have resolved
     * @param type 
     * @param args 
     */
    async emit(type: string, ...args: any[]): Promise<void> {

        const list = this.__l[type];
        if (!list) {
            return;
        }

        for (let i = 0, l = list.length; i < l; ++i) {
            let e = list[i];
            await e.func.apply(this, args);
        }

    }
}