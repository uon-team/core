/*! *******************************************************************************
Copyright (C) Gabriel Roy <g@uon.io>. All rights reserved.

MIT License

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

********************************************************************************* */
/*! @uon/core */

export { Module, ModuleRef, ModuleWithProviders } from './src/Module';
export { Application, APP_INITIALIZER } from './src/Application';
export { Injectable, Inject, InjectionToken, IsInjectable, Optional } from './src/Injectable';
export { Injector, GetInjectionTokens } from './src/Injector';
export { Provider, ClassProvider, ValueProvider, TypeProvider, FactoryProvider } from './src/Provider';
export { Controller } from './src/Controller';
export { Type } from './src/Type';
export { EventSource } from './src/EventSource';
export { Router, RouteMatch, RouterInfo, RouteInfo } from './src/Router';
export { ObjectUtils, ArrayUtils, StringUtils, PathUtils } from './src/Utils';
export { CreateMetadataCtor, GetOrDefineMetadata, GetMetadata, FindMetadataOfType, META_ANNOTATIONS, META_PARAMETERS, META_PROPERTIES } from './src/Metadata';
