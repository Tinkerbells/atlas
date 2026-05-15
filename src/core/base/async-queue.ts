/* ---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *-------------------------------------------------------------------------------------------- */

// Adapted from VS Code's async implementation for Atlas.

import type { URI } from "@platform/common/uri/uri";

import type { IExtUri } from "./resources";
import type { IDisposable } from "./lifecycle";

import { Emitter } from "./event";
import { extUri as defaultExtUri } from "./resources";

export interface ITask<T> {
  (): T;
}

export class DeferredPromise<T> {
  p: Promise<T>;

  private completeCallback!: (value: T | Promise<T>) => void;
  private errorCallback!: (err: unknown) => void;

  constructor() {
    this.p = new Promise<T>((c, e) => {
      this.completeCallback = c;
      this.errorCallback = e;
    });
  }

  complete(value: T | Promise<T>): void {
    this.completeCallback(value);
  }

  error(err: unknown): void {
    this.errorCallback(err);
  }
}

export class Barrier {
  private _isOpen = false;
  private _promise: Promise<boolean>;
  private _completePromise!: (v: boolean) => void;

  constructor() {
    this._promise = new Promise<boolean>((c) => {
      this._completePromise = c;
    });
  }

  isOpen(): boolean {
    return this._isOpen;
  }

  open(): void {
    this._isOpen = true;
    this._completePromise(true);
  }

  wait(): Promise<boolean> {
    return this._promise;
  }
}

export function retry<T>(task: ITask<Promise<T>>, delay: number, retries: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const attempt = () => {
      task().then(resolve, (error: any) => {
        if (retries === 0) {
          reject(error);
          return;
        }
        retries--;
        setTimeout(attempt, delay);
      });
    };
    attempt();
  });
}
export class Limiter<T> implements IDisposable {
  private _size = 0;
  private runningPromises: number;
  private readonly maxDegreeOfParalellism: number;
  private readonly outstandingPromises: { factory: ITask<Promise<T>>; c: (value: T | Promise<T>) => void; e: (err: unknown) => void }[];
  private readonly _onDrained = new Emitter<void>();
  readonly onDrained = this._onDrained.event;

  constructor(maxDegreeOfParalellism: number) {
    this.maxDegreeOfParalellism = maxDegreeOfParalellism;
    this.outstandingPromises = [];
    this.runningPromises = 0;
  }

  get whenDrained(): Promise<void> {
    if (this.runningPromises === 0 && this.outstandingPromises.length === 0) {
      return Promise.resolve();
    }
    return new Promise((resolve) => {
      const listener = this.onDrained(() => {
        listener.dispose();
        resolve();
      });
    });
  }

  get size(): number {
    return this._size;
  }

  queue(factory: ITask<Promise<T>>): Promise<T> {
    this._size++;

    return new Promise<T>((c, e) => {
      this.outstandingPromises.push({ factory, c, e });
      this.consume();
    });
  }

  private consume(): void {
    while (this.outstandingPromises.length && this.runningPromises < this.maxDegreeOfParalellism) {
      const iLimitedTask = this.outstandingPromises.shift()!;
      this.runningPromises++;

      const promise = iLimitedTask.factory();
      promise.then(iLimitedTask.c, iLimitedTask.e);
      promise.then(() => this.consumed(), () => this.consumed());
    }
  }

  private consumed(): void {
    this._size--;
    this.runningPromises--;

    if (this.runningPromises === 0 && this.outstandingPromises.length === 0) {
      this._onDrained.fire();
    }

    if (this.outstandingPromises.length > 0) {
      this.consume();
    }
  }

  dispose(): void {
    this.outstandingPromises.length = 0;
    this._onDrained.dispose();
  }
}

export class Queue<T> extends Limiter<T> {
  constructor() {
    super(1);
  }
}

export class ResourceQueue implements IDisposable {
  private readonly queues = new Map<string, Queue<void>>();

  private readonly drainers = new Set<DeferredPromise<void>>();

  async whenDrained(): Promise<void> {
    if (this.isDrained()) {
      return;
    }

    const promise = new DeferredPromise<void>();
    this.drainers.add(promise);

    return promise.p;
  }

  private isDrained(): boolean {
    for (const [, queue] of this.queues) {
      if (queue.size > 0) {
        return false;
      }
    }

    return true;
  }

  queueSize(resource: URI, extUri: IExtUri = defaultExtUri): number {
    const key = extUri.getComparisonKey(resource);

    return this.queues.get(key)?.size ?? 0;
  }

  queueFor(resource: URI, factory: ITask<Promise<void>>, extUri: IExtUri = defaultExtUri): Promise<void> {
    const key = extUri.getComparisonKey(resource);

    let queue = this.queues.get(key);
    if (!queue) {
      queue = new Queue<void>();
      this.queues.set(key, queue);

      queue.onDrained(() => {
        queue?.dispose();
        this.queues.delete(key);
        this.onDidQueueDrain();
      });
    }

    return queue.queue(factory);
  }

  private onDidQueueDrain(): void {
    if (!this.isDrained()) {
      return;
    }

    this.releaseDrainers();
  }

  private releaseDrainers(): void {
    for (const drainer of this.drainers) {
      drainer.complete(undefined);
    }

    this.drainers.clear();
  }

  dispose(): void {
    for (const [, queue] of this.queues) {
      queue.dispose();
    }

    this.queues.clear();

    this.releaseDrainers();
  }
}
