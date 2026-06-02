/* ---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *-------------------------------------------------------------------------------------------- */

export { Disposable, DisposableStore, dispose, isDisposable, toDisposable } from "../lifecycle";
export type { IDisposable } from "../lifecycle";
export { SyncDescriptor } from "./Descriptors";
export type { SyncDescriptor0 } from "./Descriptors";
export { getSingletonServiceDescriptors, InstantiationType, registerSingleton } from "./extensions";
export { Graph, Node } from "./Graph";
export { _util, createDecorator, IInstantiationService, refineServiceDecorator } from "./instantiation";

export type { BrandedService, GetLeadingNonServiceArgs, ServiceIdentifier, ServicesAccessor } from "./instantiation";
export { InstantiationService } from "./InstantiationService";
// Internal utilities
export { LinkedList } from "./LinkedList";

export { ServiceCollection } from "./ServiceCollection";
