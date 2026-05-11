/* ---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *-------------------------------------------------------------------------------------------- */

export { SyncDescriptor } from "@core/di/descriptors.js";
export type { SyncDescriptor0 } from "@core/di/descriptors.js";
export { getSingletonServiceDescriptors, InstantiationType, registerSingleton } from "@core/di/extensions.js";
export { Graph, Node } from "@core/di/graph.js";
export { InstantiationService } from "@core/di/instantiation-service.js";
export { _util, createDecorator, IInstantiationService, refineServiceDecorator } from "@core/di/instantiation.js";
export type { BrandedService, GetLeadingNonServiceArgs, ServiceIdentifier, ServicesAccessor } from "@core/di/instantiation.js";
export { Disposable, DisposableStore, dispose, isDisposable, toDisposable } from "@core/di/lifecycle.js";

export type { IDisposable } from "@core/di/lifecycle.js";
// Internal utilities
export { LinkedList } from "@core/di/linked-list.js";

export { ServiceCollection } from "@core/di/service-collection.js";
