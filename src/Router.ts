

import { Type } from './Type';

export interface Route {

    path: string;
    controller: Type<any>;
    data?: any;
}


export class Router {

    constructor() {


    }

}
