

import { Type } from './Type';




export function Controller() {

    return function ControllerDecorator(target: Type<any>) {

        return target;
    }
}