


//export { Module } from './src/Module';

//export { Router } from './src/Router';


import { Service } from './src/Service';


@Service()
class MyInjectedService {

    constructor() {

    
    }
}

@Service()
class MyService {

    constructor(test: MyInjectedService) {

    
    }
}