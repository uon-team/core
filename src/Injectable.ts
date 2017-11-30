

import { Type } from './Type';

export function Injectable() {

    return function InjectableDecorator(target: Type<any>) {

        return target;
    }
}
