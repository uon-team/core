# UON CORE

A modular application framework with dependency injection. Based on @angular application structure.

## Usage
```shell
npm i @uon/core
```

## Application Structure

An application built with @uon/core is structured similarly to an @angular application.

Modules are instanciated only once regardless of how many times it is imported in the application. However, you can also import a ModuleWithProviders which is not affected by that rule.

### Modules

Application modules are defined with the @Module decorator.

```typescript
import { Module } from '@uon/core';

@Module({
    imports: [],
    providers: []
})
export class MyModule {}

```

### Providers

Declaring a list of providers make them available to the dependency injector. Unlike @angular, providers declared in any imported module makes them available in the root injector (application-wide).

Providers are referenced my their token. A token can be any comparable value; however, for code minification purposes, we recommend using either an InjectionToken or a type (class).

There are multiple ways of declaring a provider :

```typescript
import { Module } from '@uon/core';

@Module({
    imports: [],
    providers: [
        // TypeProvider
        MyService, 

        // ValueProvider
        {
            token: 'MY_VALUE_PROVIDER',
            value: 1234
        },

        // FactoryProvider
        {
            token: 'MY_FACTORY_PROVIDER',
            factory: (service: MyService) => {
                return service.getStuff();
            },
            deps: [MyService]
        },

        // ClassProvider
        {
            token: 'MY_CLASS_PROVIDER',
            type: MyClass
        }
    ]
})
export class MyModule {}

```

#### TypeProvider & ClassProvider

You can provide a type as a provider. The injector will instanciate the class with DI the first time it is requested.

```typescript
// MyService.ts
import { Injectable } from '@uon/core';

@Injectable()
export class MyService {

    constructor(private myOtherService: OtherService) {}
}

```

#### FactoryProvider
*stub*

#### ValueProvider
*stub*

### Application init tasks

If you wish to execute tasks before the application modules are instanciated. You can add a factory provider with the APP_INITIALIZER injection token.


```typescript
import { Module, APP_INITIALIZER } from '@uon/core';

@Module({
    providers: [
        {
            token: APP_INITIALIZER,
            factory: () => {
                console.log('do stuff');
            },
            multi: true
        }
    ]
})
export class MyModule {}
```

More coming soon.
