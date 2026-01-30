/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Injectable, OnDestroy } from '@angular/core';

import { isEditableElement } from '~/common/utils/dom/dom';
import { Disposable } from '~/common/core/disposable';

import { equals } from '~/common/utils/helpers/equals';
import {
  ContextKeyExpression,
  ContextKeyValue,
  IContextKey,
  IContextKeyService,
  IContextKeyServiceTarget,
  IContext,
  IScopedContextKeyService,
} from './contex-key';

const KEYBINDING_CONTEXT_ATTR = 'data-ctx-id';

export class Context implements IContext {
  protected _parent: Context | null;
  protected _value: Record<string, any>;
  protected _id: number;

  constructor(id: number, parent: Context | null) {
    this._id = id;
    this._parent = parent;
    this._value = Object.create(null);
    this._value._contextId = id;
  }

  public get value(): Record<string, any> {
    return { ...this._value };
  }

  public setValue(key: string, value: any): boolean {
    if (!equals(this._value[key], value)) {
      this._value[key] = value;
      return true;
    }
    return false;
  }

  public removeValue(key: string): boolean {
    if (key in this._value) {
      delete this._value[key];
      return true;
    }
    return false;
  }

  public getValue<T>(key: string): T | undefined {
    const ret = this._value[key];
    if (typeof ret === 'undefined' && this._parent) {
      return this._parent.getValue<T>(key);
    }
    return ret;
  }

  public updateParent(parent: Context): void {
    this._parent = parent;
  }

  public collectAllValues(): Record<string, any> {
    let result = this._parent
      ? this._parent.collectAllValues()
      : Object.create(null);
    result = { ...result, ...this._value };
    delete result._contextId;
    return result;
  }
}

export abstract class AbstractContextKeyService
  extends Disposable
  implements IContextKeyService
{
  declare _serviceBrand: undefined;

  protected _isDisposed: boolean;
  protected _myContextId: number;

  constructor(myContextId: number) {
    super();
    this._isDisposed = false;
    this._myContextId = myContextId;
  }

  public get contextId(): number {
    return this._myContextId;
  }

  public createKey<T extends ContextKeyValue>(
    key: string,
    defaultValue: T | undefined,
  ): IContextKey<T> {
    if (this._isDisposed) {
      throw new Error(`AbstractContextKeyService has been disposed`);
    }
    return new ContextKey(this, key, defaultValue);
  }

  public createScoped(
    domNode: IContextKeyServiceTarget,
  ): IScopedContextKeyService {
    if (this._isDisposed) {
      throw new Error(`AbstractContextKeyService has been disposed`);
    }
    return new ScopedContextKeyService(this, domNode);
  }

  createOverlay(overlay: Iterable<[string, any]> = []): IContextKeyService {
    if (this._isDisposed) {
      throw new Error(`AbstractContextKeyService has been disposed`);
    }
    return new OverlayContextKeyService(this, overlay);
  }

  public contextMatchesRules(rules: ContextKeyExpression | undefined): boolean {
    if (this._isDisposed) {
      throw new Error(`AbstractContextKeyService has been disposed`);
    }
    const context = this.getContextValuesContainer(this._myContextId);
    const result = rules ? rules.evaluate(context) : true;
    return result;
  }

  public getContextKeyValue<T>(key: string): T | undefined {
    if (this._isDisposed) {
      return undefined;
    }
    return this.getContextValuesContainer(this._myContextId).getValue<T>(key);
  }

  public setContext(key: string, value: any): void {
    if (this._isDisposed) {
      return;
    }
    const myContext = this.getContextValuesContainer(this._myContextId);
    myContext.setValue(key, value);
  }

  public removeContext(key: string): void {
    if (this._isDisposed) {
      return;
    }
    this.getContextValuesContainer(this._myContextId).removeValue(key);
  }

  public getContext(target: IContextKeyServiceTarget | null): IContext {
    if (this._isDisposed) {
      return NullContext.INSTANCE;
    }
    return this.getContextValuesContainer(findContextAttr(target));
  }

  public abstract getContextValuesContainer(contextId: number): Context;
  public abstract createChildContext(parentContextId?: number): number;
  public abstract disposeContext(contextId: number): void;

  public override dispose(): void {
    super.dispose();
    this._isDisposed = true;
  }
}

@Injectable({
  providedIn: 'root',
})
export class ContextKeyService
  extends AbstractContextKeyService
  implements IContextKeyService, OnDestroy
{
  private _lastContextId: number;
  private readonly _contexts = new Map<number, Context>();

  private inputFocusedContext: IContextKey<boolean>;

  constructor() {
    super(0);
    this._lastContextId = 0;
    this.inputFocusedContext = this.createKey<boolean>('inputFocus', false);

    const myContext = new Context(this._myContextId, null);
    this._contexts.set(this._myContextId, myContext);

    if (typeof window !== 'undefined') {
      window.addEventListener('focusin', this.handleFocusChange);
      window.addEventListener('focusout', this.handleFocusChange);

      this._register({
        dispose: () => {
          window.removeEventListener('focusin', this.handleFocusChange);
          window.removeEventListener('focusout', this.handleFocusChange);
        },
      });
    }

    this.handleFocusChange();
  }

  private handleFocusChange = () => {
    if (typeof document === 'undefined') {
      return;
    }

    function activeElementIsInput(): boolean {
      return (
        !!document.activeElement && isEditableElement(document.activeElement)
      );
    }

    const isInputFocused = activeElementIsInput();
    this.inputFocusedContext.set(isInputFocused);
  };

  public getContextValuesContainer(contextId: number): Context {
    if (this._isDisposed) {
      return NullContext.INSTANCE;
    }
    return this._contexts.get(contextId) || NullContext.INSTANCE;
  }

  public createChildContext(
    parentContextId: number = this._myContextId,
  ): number {
    if (this._isDisposed) {
      throw new Error(`ContextKeyService has been disposed`);
    }
    const id = ++this._lastContextId;
    this._contexts.set(
      id,
      new Context(id, this.getContextValuesContainer(parentContextId)),
    );
    return id;
  }

  public disposeContext(contextId: number): void {
    if (!this._isDisposed) {
      this._contexts.delete(contextId);
    }
  }

  public updateParent(_parentContextKeyService: IContextKeyService): void {
    throw new Error('Cannot update parent of root ContextKeyService');
  }

  public ngOnDestroy(): void {
    this.dispose();
  }
}

class ScopedContextKeyService extends AbstractContextKeyService {
  private _parent: AbstractContextKeyService;
  private _domNode: IContextKeyServiceTarget;

  constructor(
    parent: AbstractContextKeyService,
    domNode: IContextKeyServiceTarget,
  ) {
    super(parent.createChildContext());
    this._parent = parent;

    this._domNode = domNode;
    if (this._domNode.hasAttribute(KEYBINDING_CONTEXT_ATTR)) {
      let extraInfo = '';
      if ((this._domNode as HTMLElement).classList) {
        extraInfo = Array.from(
          (this._domNode as HTMLElement).classList.values(),
        ).join(', ');
      }

      console.error(
        `Element already has context attribute${extraInfo ? `: ${extraInfo}` : ''}`,
      );
    }
    this._domNode.setAttribute(
      KEYBINDING_CONTEXT_ATTR,
      String(this._myContextId),
    );
  }

  public override dispose(): void {
    if (this._isDisposed) {
      return;
    }

    this._parent.disposeContext(this._myContextId);
    this._domNode.removeAttribute(KEYBINDING_CONTEXT_ATTR);
    super.dispose();
  }

  public getContextValuesContainer(contextId: number): Context {
    if (this._isDisposed) {
      return NullContext.INSTANCE;
    }
    return this._parent.getContextValuesContainer(contextId);
  }

  public createChildContext(
    parentContextId: number = this._myContextId,
  ): number {
    if (this._isDisposed) {
      throw new Error(`ScopedContextKeyService has been disposed`);
    }
    return this._parent.createChildContext(parentContextId);
  }

  public disposeContext(contextId: number): void {
    if (this._isDisposed) {
      return;
    }
    this._parent.disposeContext(contextId);
  }
}

class OverlayContext implements IContext {
  constructor(
    private parent: IContext,
    private overlay: ReadonlyMap<string, any>,
  ) {}

  getValue<T extends ContextKeyValue>(key: string): T | undefined {
    return this.overlay.has(key)
      ? this.overlay.get(key)
      : this.parent.getValue<T>(key);
  }
}

class OverlayContextKeyService implements IContextKeyService {
  declare _serviceBrand: undefined;
  private overlay: Map<string, any>;

  get contextId(): number {
    return this.parent.contextId;
  }

  constructor(
    private parent: AbstractContextKeyService | OverlayContextKeyService,
    overlay: Iterable<[string, any]>,
  ) {
    this.overlay = new Map(overlay);
  }

  createKey<T extends ContextKeyValue>(): IContextKey<T> {
    throw new Error('Not supported.');
  }

  getContext(target: IContextKeyServiceTarget | null): IContext {
    return new OverlayContext(this.parent.getContext(target), this.overlay);
  }

  getContextValuesContainer(contextId: number): IContext {
    const parentContext = this.parent.getContextValuesContainer(contextId);
    return new OverlayContext(parentContext, this.overlay);
  }

  contextMatchesRules(rules: ContextKeyExpression | undefined): boolean {
    const context = this.getContextValuesContainer(this.contextId);
    const result = rules ? rules.evaluate(context) : true;
    return result;
  }

  getContextKeyValue<T>(key: string): T | undefined {
    return this.overlay.has(key)
      ? this.overlay.get(key)
      : this.parent.getContextKeyValue(key);
  }

  createScoped(): IScopedContextKeyService {
    throw new Error('Not supported.');
  }

  createOverlay(overlay: Iterable<[string, any]> = []): IContextKeyService {
    return new OverlayContextKeyService(this, overlay);
  }

  updateParent(): void {
    throw new Error('Not supported.');
  }
}

class ContextKey<T extends ContextKeyValue> implements IContextKey<T> {
  private _service: AbstractContextKeyService;
  private _key: string;
  private _defaultValue: T | undefined;

  constructor(
    service: AbstractContextKeyService,
    key: string,
    defaultValue: T | undefined,
  ) {
    this._service = service;
    this._key = key;
    this._defaultValue = defaultValue;
    this.reset();
  }

  public set(value: T): void {
    this._service.setContext(this._key, value);
  }

  public reset(): void {
    if (typeof this._defaultValue === 'undefined') {
      this._service.removeContext(this._key);
    } else {
      this._service.setContext(this._key, this._defaultValue);
    }
  }

  public get(): T | undefined {
    return this._service.getContextKeyValue<T>(this._key);
  }
}

class NullContext extends Context {
  static readonly INSTANCE = new NullContext();

  constructor() {
    super(-1, null);
  }

  public override setValue(_key: string, _value: any): boolean {
    return false;
  }

  public override removeValue(_key: string): boolean {
    return false;
  }

  public override getValue<T>(_key: string): T | undefined {
    return undefined;
  }

  override collectAllValues(): { [key: string]: any } {
    return Object.create(null);
  }
}

function findContextAttr(domNode: IContextKeyServiceTarget | null): number {
  while (domNode) {
    if (domNode.hasAttribute(KEYBINDING_CONTEXT_ATTR)) {
      const attr = domNode.getAttribute(KEYBINDING_CONTEXT_ATTR);
      if (attr) {
        return Number.parseInt(attr, 10);
      }
      return Number.NaN;
    }
    domNode = domNode.parentElement;
  }
  return 0;
}
