/* ---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *-------------------------------------------------------------------------------------------- */

export { SyncDescriptor } from "./descriptors.js";
export type { SyncDescriptor0 } from "./descriptors.js";
export { getSingletonServiceDescriptors, InstantiationType, registerSingleton } from "./extensions.js";
export { Graph, Node } from "./graph.js";
export { _util, createDecorator, IInstantiationService, refineServiceDecorator } from "./instantiation.js";
export type { BrandedService, GetLeadingNonServiceArgs, ServiceIdentifier, ServicesAccessor } from "./instantiation.js";
export { InstantiationService } from "./instantiationService.js";
export { Disposable, DisposableStore, dispose, isDisposable, toDisposable } from "./lifecycle.js";

export type { IDisposable } from "./lifecycle.js";
// Internal utilities
export { LinkedList } from "./linkedList.js";

export { ServiceCollection } from "./serviceCollection.js";
