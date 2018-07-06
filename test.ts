

import { PathUtils } from './src/Utils';


const path = '/all/come/too';

let keys: string[] = [];
let rx = PathUtils.pathToRegex('/:test([a-zA-Z]+)?/:test2/:test3', keys);

let result = rx.exec(path);

console.log(rx, keys, result);