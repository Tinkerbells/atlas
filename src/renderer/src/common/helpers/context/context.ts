// TODO: переработать
import { parseWhen } from './context-key-parser'

export type ContextValue = string | number | boolean | null | undefined

export type ContextKeyExpression = string | ((ctx: IContext) => boolean)

export interface IContext {
  getValue: <T extends ContextValue = ContextValue>(key: string) => T | undefined
}

export interface IContextKey<T extends ContextValue = ContextValue> {
  set: (value: T) => void
  reset: () => void
  get: () => T | undefined
}

export interface IContextKeyService {
  createKey: <T extends ContextValue>(key: string, defaultValue?: T) => IContextKey<T>
  contextMatchesRules: (expr?: ContextKeyExpression | null, target?: ContextTarget | null) => boolean
  getContext: (target?: ContextTarget | null) => IContext
  createScoped: (target: ContextTarget) => IScopedContextKeyService
  dispose: () => void
}

export interface IScopedContextKeyService extends IContextKeyService { }

export interface IContextKeyServiceTarget {
  parentElement: IContextKeyServiceTarget | HTMLElement | null
  setAttribute: (attr: string, value: string) => void
  removeAttribute: (attr: string) => void
  hasAttribute: (attr: string) => boolean
  getAttribute: (attr: string) => string | null
}

type ContextTarget = HTMLElement | IContextKeyServiceTarget

const CTX_ATTR = 'data-ctx-id'

class ContextContainer implements IContext {
  constructor(public values: Record<string, ContextValue> = {}, public parent?: ContextContainer) { }

  getValue<T extends ContextValue = ContextValue>(key: string): T | undefined {
    if (key in this.values) {
      return this.values[key] as T | undefined
    }
    return this.parent?.getValue(key) as T | undefined
  }

  setValue(key: string, v: ContextValue) {
    this.values[key] = v
  }
}

class ContextKey<T extends ContextValue> implements IContextKey<T> {
  constructor(private key: string, private svc: BaseContextKeyService) { }

  set(value: T): void {
    this.svc.setValue(this.key, value)
  }

  reset(): void {
    this.svc.setValue(this.key, undefined)
  }

  get(): T | undefined {
    return this.svc.getValue(this.key) as T | undefined
  }
}

abstract class BaseContextKeyService implements IContextKeyService {
  protected constructor(protected contexts: Map<number, ContextContainer>, protected contextId: number) { }

  createKey<T extends ContextValue>(key: string, defaultValue?: T): IContextKey<T> {
    console.log('[ContextKeyService] createKey', { key, defaultValue, contextId: this.contextId })
    if (typeof defaultValue !== 'undefined') {
      this.setValue(key, defaultValue)
    }
    return new ContextKey<T>(key, this)
  }

  contextMatchesRules(expr?: ContextKeyExpression | null, target?: ContextTarget | null): boolean {
    const ctx = this.getContext(target)
    const result = evaluateWhen(expr ?? null, ctx)
    console.log('[ContextKeyService] contextMatchesRules', {
      expr,
      contextId: this.contextId,
      target,
      ctxSnapshot: ctx,
      result,
    })
    return result
  }

  getContext(target?: ContextTarget | null): IContext {
    return this.getContainerByNode(target)
  }

  createScoped(_target: ContextTarget): IScopedContextKeyService {
    throw new Error('Not implemented in base')
  }

  dispose(): void { }

  protected abstract getContainerByNode(node?: ContextTarget | null): ContextContainer

  setValue(key: string, v: ContextValue) {
    console.log('[ContextKeyService] setValue', { key, value: v, contextId: this.contextId })
    this.contexts.get(this.contextId)!.setValue(key, v)
  }

  getValue(key: string): ContextValue {
    const value = this.contexts.get(this.contextId)!.getValue(key)
    console.log('[ContextKeyService] getValue', { key, value, contextId: this.contextId })
    return value
  }
}

export class ContextKeyService extends BaseContextKeyService {
  private nextId = 1

  constructor() {
    const map = new Map<number, ContextContainer>()
    map.set(0, new ContextContainer())
    super(map, 0)
  }

  createScoped(target: ContextTarget): IScopedContextKeyService {
    const parent = this.getContainerByNode(getParent(target))
    const id = this.nextId++
    console.log('[ContextKeyService] createScoped', { newId: id, parentId: parent ? this.contextId : 0, target })
    this.contexts.set(id, new ContextContainer({}, parent))
    setAttr(target, id)
    return new ScopedContextKeyService(this.contexts, id, target)
  }

  protected getContainerByNode(node?: ContextTarget | null): ContextContainer {
    let current: ContextTarget | null | undefined = node
    while (current) {
      const attr = readAttr(current)
      if (attr !== null && this.contexts.has(attr)) {
        return this.contexts.get(attr)!
      }
      current = getParent(current)
    }
    return this.contexts.get(0)!
  }
}

class ScopedContextKeyService extends BaseContextKeyService implements IScopedContextKeyService {
  constructor(contexts: Map<number, ContextContainer>, id: number, private target: ContextTarget) {
    super(contexts, id)
  }

  createScoped(target: ContextTarget): IScopedContextKeyService {
    const parent = this.getContainerByNode(getParent(target))
    const id = Math.max(...this.contexts.keys()) + 1
    this.contexts.set(id, new ContextContainer({}, parent))
    setAttr(target, id)
    return new ScopedContextKeyService(this.contexts, id, target)
  }

  dispose(): void {
    if (readAttr(this.target) === this.contextId) {
      removeAttr(this.target)
    }
    console.log('[ContextKeyService] dispose scoped', { contextId: this.contextId, target: this.target })
    this.contexts.delete(this.contextId)
  }

  protected getContainerByNode(node?: ContextTarget | null): ContextContainer {
    let current: ContextTarget | null | undefined = node
    while (current) {
      const attr = readAttr(current)
      if (attr !== null && this.contexts.has(attr)) {
        return this.contexts.get(attr)!
      }
      current = getParent(current)
    }
    return this.contexts.get(this.contextId)!
  }
}

export function evaluateWhen(expr: ContextKeyExpression | null | undefined, ctx: IContext): boolean {
  if (!expr) {
    return true
  }
  if (typeof expr === 'function') {
    return expr(ctx)
  }

  const compiled = getOrCreateCompiled(expr)
  return compiled(ctx)
}

const compiledCache = new Map<string, (ctx: IContext) => boolean>()

function getOrCreateCompiled(expr: string): (ctx: IContext) => boolean {
  let compiled = compiledCache.get(expr)
  if (!compiled) {
    const parsed = parseWhen(expr)
    compiled = (ctx: IContext) => parsed.eval(ctx)
    compiledCache.set(expr, compiled)
  }
  return compiled
}

function getParent(target: ContextTarget): ContextTarget | null {
  return (target as HTMLElement).parentElement ?? (target as IContextKeyServiceTarget).parentElement ?? null
}

function readAttr(target: ContextTarget): number | null {
  const value = target.getAttribute(CTX_ATTR)
  return value === null ? null : Number(value)
}

function setAttr(target: ContextTarget, id: number): void {
  target.setAttribute(CTX_ATTR, String(id))
}

function removeAttr(target: ContextTarget): void {
  if (target.hasAttribute(CTX_ATTR)) {
    target.removeAttribute(CTX_ATTR)
  }
}
