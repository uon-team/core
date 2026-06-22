# @uon/core

A modular application framework for TypeScript with dependency injection, decorator-based metadata, and async lifecycle management. Inspired by Angular's architecture, designed to be lightweight and framework-agnostic.

## Table of Contents

- [Installation](#installation)
- [Quick Start](#quick-start)
- [Modules](#modules)
- [Dependency Injection](#dependency-injection)
  - [Providers](#providers)
  - [Injecting Dependencies](#injecting-dependencies)
  - [Injection Tokens](#injection-tokens)
  - [Injectors](#injectors)
- [Application](#application)
  - [Bootstrapping](#bootstrapping)
  - [Initialization Tasks](#initialization-tasks)
  - [Module References](#module-references)
- [Metadata & Decorators](#metadata--decorators)
  - [Built-in Decorators](#built-in-decorators)
  - [Custom Decorators](#custom-decorators)
- [Event System](#event-system)
- [Utilities](#utilities)

---

## Installation

```bash
npm install @uon/core
```

`@uon/core` requires TypeScript with experimental decorators and decorator metadata enabled:

```jsonc
// tsconfig.json
{
  "compilerOptions": {
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true
  }
}
```

---

## Quick Start

```typescript
import { Application, Module, Injectable } from '@uon/core';

@Injectable()
class GreetingService {
  greet(name: string) {
    return `Hello, ${name}!`;
  }
}

@Module({
  providers: [GreetingService],
})
class AppModule {
  constructor(private greeting: GreetingService) {}

  async onStart() {
    console.log(this.greeting.greet('World'));
  }
}

const app = Application.Bootstrap(AppModule);
await app.start();
```

---

## Modules

Modules are the primary building blocks of a `@uon/core` application. Each module groups a related set of providers and can import other modules to consume their providers.

```typescript
import { Module } from '@uon/core';

@Module({
  imports: [DatabaseModule, LoggingModule],
  providers: [UserService, AuthService],
  declarations: [UserController],
})
export class AppModule {}
```

**Module options:**

| Option | Type | Description |
|--------|------|-------------|
| `imports` | `Type[]` | Other modules whose providers become available |
| `providers` | `Provider[]` | Services and values to register in this module's injector |
| `declarations` | `Type[]` | Types owned by this module (tracked in `app.declarations`) |

### Module Hierarchy

Imported modules form a tree. Each module gets its own injector that inherits from its parent module's injector, so providers flow down the tree.

```typescript
@Module({ providers: [DatabaseService] })
class DatabaseModule {}

@Module({
  imports: [DatabaseModule],  // DatabaseService is available here
  providers: [UserService],
})
class AppModule {}
```

### ModuleWithProviders

For configurable modules that accept runtime options:

```typescript
import { Module, ModuleWithProviders, InjectionToken } from '@uon/core';

const DB_OPTIONS = new InjectionToken<DbOptions>('DB_OPTIONS');

@Module({ providers: [DatabaseService] })
class DatabaseModule {
  static withConfig(options: DbOptions): ModuleWithProviders<DatabaseModule> {
    return {
      module: DatabaseModule,
      providers: [{ token: DB_OPTIONS, value: options }],
    };
  }
}

@Module({
  imports: [DatabaseModule.withConfig({ host: 'localhost', port: 5432 })],
})
class AppModule {}
```

---

## Dependency Injection

### Providers

Providers define how a dependency is created when requested from the injector. There are five provider types.

#### TypeProvider

Pass a class directly. The injector instantiates it on demand and caches the instance.

```typescript
import { Injectable } from '@uon/core';

@Injectable()
class MyService {}

@Module({ providers: [MyService] })
class AppModule {}
```

#### ValueProvider

Provide a static value under a token.

```typescript
import { InjectionToken } from '@uon/core';

const API_URL = new InjectionToken<string>('API_URL');

@Module({
  providers: [
    { token: API_URL, value: 'https://api.example.com' },
  ],
})
class AppModule {}
```

#### FactoryProvider

Use a factory function to create the value. Declare dependencies with `deps`.

```typescript
const HTTP_CLIENT = new InjectionToken<HttpClient>('HTTP_CLIENT');

@Module({
  providers: [
    {
      token: HTTP_CLIENT,
      factory: (url: string) => new HttpClient(url),
      deps: [API_URL],
    },
  ],
})
class AppModule {}
```

Factories can be `async`:

```typescript
{
  token: DATABASE,
  factory: async (config: DbConfig) => {
    const db = new Database(config);
    await db.connect();
    return db;
  },
  deps: [DB_CONFIG],
}
```

#### ClassProvider

Bind a token to a concrete implementation. Useful for substituting classes behind an interface-like token.

```typescript
abstract class Logger {}

@Injectable()
class ConsoleLogger extends Logger {}

@Module({
  providers: [
    { token: Logger, type: ConsoleLogger },
  ],
})
class AppModule {}
```

#### AliasProvider

Create an alias from one token to another already-registered provider.

```typescript
@Module({
  providers: [
    ConsoleLogger,
    { token: 'Logger', use: ConsoleLogger },
  ],
})
class AppModule {}
```

#### Multi Providers

Set `multi: true` to collect multiple values under a single token as an array.

```typescript
const PLUGINS = new InjectionToken<Plugin[]>('PLUGINS');

@Module({
  providers: [
    { token: PLUGINS, value: new PluginA(), multi: true },
    { token: PLUGINS, value: new PluginB(), multi: true },
  ],
})
class AppModule {}

// Resolves as [PluginA, PluginB]
```

#### Provider Helpers

Two helpers build common provider shapes for an `InjectionToken`:

```typescript
import { ProvideInjectable, ProvideValue } from '@uon/core';

@Module({
  providers: [
    // instantiate MyService (with DI) for the token, optionally multi
    ProvideInjectable(SERVICE_TOKEN, MyService),
    // bind a static value to the token
    ProvideValue(CONFIG_TOKEN, { debug: true }),
  ],
})
class AppModule {}
```

---

### Injecting Dependencies

Mark a class as injectable with `@Injectable()` to enable constructor injection.

```typescript
import { Injectable, Inject, Optional, Self, InjectionToken } from '@uon/core';

const CONFIG = new InjectionToken<AppConfig>('CONFIG');

@Injectable()
class UserService {
  constructor(
    // Type-based injection — resolved by class type
    private db: DatabaseService,

    // Explicit token injection — use @Inject for non-class tokens
    @Inject(CONFIG) private config: AppConfig,

    // Optional — resolves to null if not provided
    @Optional() private logger?: Logger,

    // Self — only looks in the local injector, not parent injectors
    @Self() private local?: LocalCache,
  ) {}
}
```

**Parameter decorators:**

| Decorator | Description |
|-----------|-------------|
| `@Inject(token)` | Resolve by an explicit token instead of the parameter type |
| `@Optional()` | Return `null` if the dependency is not found instead of throwing |
| `@Self()` | Only search the current injector, not parent injectors |

---

### Injection Tokens

Use `InjectionToken<T>` for non-class dependencies (strings, numbers, objects, interfaces). Each token instance is unique regardless of its description.

```typescript
import { InjectionToken } from '@uon/core';

export const MAX_RETRIES = new InjectionToken<number>('MAX_RETRIES');
export const APP_CONFIG = new InjectionToken<AppConfig>('APP_CONFIG');
```

Tokens prevent collisions from minification since they use reference equality, not string matching.

---

### Injectors

The `Injector` is responsible for resolving and caching provider instances.

```typescript
import { Injector } from '@uon/core';

const injector = Injector.Create([
  MyService,
  { token: API_URL, value: 'https://api.example.com' },
]);

const service = await injector.getAsync(MyService);
```

**Injector methods:**

| Method | Description |
|--------|-------------|
| `get<T>(token, defaultValue?)` | Synchronously resolve a dependency. Throws if unresolved and no `defaultValue` is given. |
| `getAsync<T>(token, defaultValue?)` | Asynchronously resolve a dependency (awaits async factories/deps). Rejects if unresolved and no `defaultValue` is given. |
| `instanciate<T>(type)` | Synchronously instantiate a type with injected constructor args. |
| `instanciateAsync<T>(type)` | Instantiate a type with injected constructor args, awaiting async deps. |
| `invokeAsync<T>(func)` | Call a function with injected arguments. Argument tokens are read from the function's emitted `design:paramtypes` (and `@Inject`/`@Optional`/`@Self`); there is no `deps` parameter. |

> When a token cannot be resolved, `get`/`getAsync` throw/reject unless you pass a
> `defaultValue`. Pass `null` (commonly via `@Optional()`) to opt out of throwing.

Child injectors inherit from a parent and can override providers:

```typescript
const child = Injector.Create([ChildService], parentInjector);
```

**Additional injector exports:**

- `Injector.NULL` / `NullInjector` — the terminal injector at the top of every chain; resolving a required token here throws (sync) or rejects (async).
- `StaticInjector` — the concrete `Injector` returned by `Injector.Create`.
- `THROW_IF_NOT_FOUND` — sentinel default-value meaning "throw if the token is unresolved".
- `GetInjectionTokens(typeOrFn)` — extract the ordered constructor/function parameter tokens (merging `@Inject`/`@Optional`/`@Self`) as `DependencyRecord[]`.
- `IsInjectable(type)` — `true` when a class is decorated with `@Injectable()`.

---

## Application

### Bootstrapping

`Application.Bootstrap()` takes a root module and builds the full module tree.

```typescript
import { Application } from '@uon/core';

const app = Application.Bootstrap(AppModule);
const mainRef = await app.start();
```

`app.start()` runs all `APP_INITIALIZER` callbacks, then instantiates every module in import order.

**Application properties:**

| Property | Type | Description |
|----------|------|-------------|
| `app.main` | `Type` | The root module class |
| `app.modules` | `ModuleRef[]` | All loaded module references |
| `app.declarations` | `Map<Type, ModuleRef>` | Maps declared types to their owning module |

---

### Initialization Tasks

Register async tasks that run before any module is instantiated using `APP_INITIALIZER`.

```typescript
import { Module, APP_INITIALIZER } from '@uon/core';

@Module({
  providers: [
    {
      token: APP_INITIALIZER,
      factory: async () => {
        await loadConfiguration();
        console.log('Configuration loaded.');
      },
      multi: true,
    },
    {
      token: APP_INITIALIZER,
      factory: (db: DatabaseService) => db.connect(),
      deps: [DatabaseService],
      multi: true,
    },
  ],
})
class AppModule {}
```

All `APP_INITIALIZER` factories are resolved and awaited before `start()` returns. They execute in declaration order.

---

### Module References

Each loaded module is represented at runtime by a `ModuleRef<T>` instance.

```typescript
import { ModuleRef } from '@uon/core';

@Module({})
class FeatureModule {
  constructor(ref: ModuleRef<FeatureModule>) {
    console.log(ref.injector); // Injector for this module
    console.log(ref.instance); // The FeatureModule instance
  }
}
```

**ModuleRef properties:**

| Property | Type | Description |
|----------|------|-------------|
| `type` | `Type<T>` | The module class |
| `instance` | `T` | The instantiated module |
| `injector` | `Injector` | This module's injector |
| `module` | `Module` | The `@Module` metadata |

---

## Metadata & Decorators

### Built-in Decorators

#### `@Module(options)`

Marks a class as a module. See [Modules](#modules).

#### `@Injectable()`

Marks a class as an injectable service. Required for the DI system to read constructor parameter types.

```typescript
@Injectable()
class MyService {
  constructor(private dep: OtherService) {}
}
```

---

### Custom Decorators

`@uon/core` exposes factories to create custom type, parameter, and property decorators that integrate with the metadata system.

#### Type Decorators

```typescript
import { MakeTypeDecorator, GetTypeMetadata } from '@uon/core';

export interface RouteOptions { path: string; method: string; }

export const Route = MakeTypeDecorator(
  'Route',
  (options: RouteOptions) => options,
);

@Route({ path: '/users', method: 'GET' })
class GetUsersHandler {}

// Read the metadata
const annotations = GetTypeMetadata(GetUsersHandler);
const route = annotations.find(a => a instanceof Route);
// route.path === '/users'
```

#### Parameter Decorators

```typescript
import { MakeParameterDecorator, GetParametersMetadata } from '@uon/core';

export const Param = MakeParameterDecorator(
  'Param',
  (name: string) => ({ name }),
);

class MyController {
  handle(@Param('id') id: string) {}
}

const params = GetParametersMetadata(MyController, 'handle');
// params[0].name === 'id'
```

#### Property Decorators

```typescript
import { MakePropertyDecorator, GetPropertiesMetadata } from '@uon/core';

export const Column = MakePropertyDecorator(
  'Column',
  (options: { type: string }) => options,
);

class UserEntity {
  @Column({ type: 'varchar' })
  name: string;
}

const props = GetPropertiesMetadata(UserEntity.prototype);
// props['name'].type === 'varchar'
```

#### Metadata Utilities

| Function | Description |
|----------|-------------|
| `GetTypeMetadata<T>(type)` | All annotations on a class (including inherited) |
| `GetTypeOwnMetadata<T>(type)` | Only own annotations (not inherited) |
| `GetParametersMetadata(type, key?)` | Sparse array of parameter decorators |
| `GetPropertiesMetadata(proto)` | Map of property decorators (including inherited) |
| `GetPropertiesOwnMetadata(proto)` | Map of property decorators (own only) |
| `FindMetadataOfType<T>(key, obj, type)` | Find a specific annotation instance by type |
| `GetOrDefineMetadata(key, target, factory)` | Get or lazily initialize metadata |

---

## Event System

`EventSource` is an async event emitter with priority-ordered listeners.

```typescript
import { EventSource } from '@uon/core';

const events = new EventSource();

// Subscribe
const unsubscribe = events.on('userCreated', async (user) => {
  await sendWelcomeEmail(user);
}, /* priority = */ 100);

// One-time subscription
events.once('userCreated', (user) => {
  console.log('First user:', user.name);
});

// Emit — awaits all listeners sequentially
await events.emit('userCreated', { name: 'Alice', email: 'alice@example.com' });

// Remove a specific listener
events.removeListener('userCreated', handler);

// Remove all listeners for an event
events.removeListeners('userCreated');
```

**Priority:** Listeners with a lower priority number run first. Listeners at the same priority level run in subscription order. Each listener is fully awaited before the next begins.

---

## Utilities

### Deferred Promises

```typescript
import { MakeDeferred, ResolveAfterMs, RejectAfterMs } from '@uon/core';

const deferred = MakeDeferred<string>();
deferred.resolve('done');
await deferred.promise;

await ResolveAfterMs(500, 'value');   // resolves after 500ms
await RejectAfterMs(1000, new Error('timeout'));
```

### Type Utilities

```typescript
import { IsFunction, IsObject, IsPromise, IsDate, IsType } from '@uon/core';

IsFunction(fn)    // true if fn is a function
IsObject(obj)     // true if obj is a plain object (not null, array, date, etc.)
IsPromise(p)      // true if p has a .then method
IsDate(d)         // true if d is a valid Date
IsType(T)         // true if T is a class constructor
```

### MakeUnique

Create a global singleton by name. Subsequent calls with the same name return the same instance.

```typescript
import { MakeUnique } from '@uon/core';

const registry = MakeUnique('MyRegistry', () => new Map<string, any>());
```

> `MakeUnique` stores its singleton on the global object (see `GLOBAL` below) under a
> `Symbol.for(id)` key, so the instance is shared even across duplicate copies of a module.

### GLOBAL

A cross-environment reference to the global object (`globalThis` in modern runtimes,
falling back to `self`/`global`). Used internally by `MakeUnique`.

```typescript
import { GLOBAL } from '@uon/core';
```

### TypeScript Helpers

```typescript
import type {
  Type<T>,                     // interface { new(...args): T }
  UnaryFunction<A, R>,         // (a: A) => R
  BinaryFunction<A, B, R>,     // (a: A, b: B) => R
  TernaryFunction<A, B, C, R>, // (a: A, b: B, c: C) => R
  PropertyNamesOfType<T, P>,   // keys of T whose value extends P
  PropertyNamesNotOfType<T, P>,
  Unpack<T>,                   // element type of an array type
  Include<M, T, U>,            // conditional type helper
} from '@uon/core';
```

## License

MIT — see [LICENSE](LICENSE) for details.