/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

export { createDecorator, refineServiceDecorator, IInstantiationService, _util } from './instantiation.js';
export type { ServiceIdentifier, ServicesAccessor, BrandedService, GetLeadingNonServiceArgs } from './instantiation.js';
export { InstantiationService } from './instantiationService.js';
export { ServiceCollection } from './serviceCollection.js';
export { SyncDescriptor } from './descriptors.js';
export type { SyncDescriptor0 } from './descriptors.js';
export { Graph, Node } from './graph.js';
export { registerSingleton, getSingletonServiceDescriptors, InstantiationType } from './extensions.js';

export { Disposable, DisposableStore, isDisposable, dispose, toDisposable } from './lifecycle.js';
export type { IDisposable } from './lifecycle.js';

// Internal utilities
export { LinkedList } from './linkedList.js';
