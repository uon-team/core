/*!
*******************************************************************************
@uon/core
Copyright (C) 2020 uon-team <g@uon.io>
MIT Licensed
*********************************************************************************
*/

//import './meta/reflect.polyfill';

import 'reflect-metadata';

export * from './app/application';
export * from './app/module';

export * from './di/injectable';
export * from './di/injector';
export * from './di/provider';

export * from './meta/meta.common';
export * from './meta/param.decorator';
export * from './meta/prop.decorator';
export * from './meta/type.decorator';

export * from './util/global';
export * from './util/unique';
export * from './util/type.utils';
export * from './util/event-source';
export * from './util/deferred';

