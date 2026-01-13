/**
 * Снимок контекста
 * Используется для вычисления when-условий.
 */
export type ContextValue = boolean | number | string | null

export type ContextSnapshot = Readonly<Record<string, ContextValue>>

/**
  AST для when-выражений.
 */
export type WhenExpression = | { kind: 'true' }
  | { kind: 'false' }
  | { kind: 'key', key: string }
  | { kind: 'not', expr: WhenExpression }
  | { kind: 'and', left: WhenExpression, right: WhenExpression }
  | { kind: 'or', left: WhenExpression, right: WhenExpression }
  | { kind: 'equals', key: string, value: ContextValue }

export const when = {
  true: (): WhenExpression => ({ kind: 'true' }),
  false: (): WhenExpression => ({ kind: 'false' }),
  key: (key: string): WhenExpression => ({ kind: 'key', key }),
  not: (expr: WhenExpression): WhenExpression => ({ kind: 'not', expr }),
  and: (l: WhenExpression, r: WhenExpression): WhenExpression => ({ kind: 'and', left: l, right: r }),
  or: (l: WhenExpression, r: WhenExpression): WhenExpression => ({ kind: 'or', left: l, right: r }),
  equals: (key: string, value: ContextValue): WhenExpression => ({
    kind: 'equals',
    key,
    value,
  }),
}

/**
 * Чистая функция вычисления when.
 */
export function evaluateWhen(
  expr: WhenExpression | null | undefined,
  ctx: ContextSnapshot,
): boolean {
  if (!expr)
    return true

  switch (expr.kind) {
    case 'true':
      return true
    case 'false':
      return false
    case 'key':
      return Boolean(ctx[expr.key])
    case 'equals':
      return ctx[expr.key] === expr.value
    case 'not':
      return !evaluateWhen(expr.expr, ctx)
    case 'and':
      return evaluateWhen(expr.left, ctx) && evaluateWhen(expr.right, ctx)
    case 'or':
      return evaluateWhen(expr.left, ctx) || evaluateWhen(expr.right, ctx)
  }
}
export interface IContextKeyServiceTarget {
  parentElement: IContextKeyServiceTarget | null
  setAttribute: (attr: string, value: string) => void
  removeAttribute: (attr: string) => void
  hasAttribute: (attr: string) => boolean
  getAttribute: (attr: string) => string | null
}
