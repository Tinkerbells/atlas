import type { BinaryExpression, Expression, Identifier, MemberExpression, UnaryExpression } from 'jsep'

import jsep from 'jsep'
import jsepTernary from '@jsep-plugin/ternary'

import type { IContext } from './context'

jsep.plugins.register(jsepTernary)

export class ContextKeyExpression {
  constructor(private readonly ast: Expression) { }

  static parse(raw: string) {
    const ast = jsep(raw)
    return new ContextKeyExpression(ast)
  }

  evaluate(context: IContext): boolean {
    return !!this.evalNode(this.ast, context)
  }

  evalNode(node: jsep.Expression, ctx: IContext) {
    switch (node.type) {
      case 'BinaryExpression': {
        const n = node as BinaryExpression
        const l = this.evalNode(n.left, ctx)
        const r = this.evalNode(n.right, ctx)
        switch (node.operator) {
          // eslint-disable-next-line eqeqeq
          case '==': return l == r
          case '===': return l === r
          // eslint-disable-next-line eqeqeq
          case '!=': return l != r
          case '!==': return l !== r
          case '<': return l < r
          case '<=': return l <= r
          case '>': return l > r
          case '>=': return l >= r
          case '+': return l + r
          case '-': return l - r
          case '*': return l * r
          case '/': return l / r
          case '&&': return l && r
          case '||': return l || r
          case '??': return l ?? r
          default: throw new Error(`op ${node.operator} not supported`)
        }
      }
      case 'UnaryExpression': {
        const n = node as UnaryExpression
        const v = this.evalNode(n.argument, ctx)
        switch (node.operator) {
          case '!': return !v
          case '+': return +v
          case '-': return -v
          default: throw new Error(`unary ${node.operator} not supported`)
        }
      }
      case 'Literal':
        return node.value
      case 'Identifier': {
        const n = node as Identifier
        return ctx.getValue(n.name)
      }
      case 'MemberExpression': {
        const n = node as MemberExpression
        const keyPath = this.resolveMemberPath(n, ctx)
        const ctxValue = ctx.getValue(keyPath)
        if (typeof ctxValue !== 'undefined') {
          return ctxValue
        }

        const obj = this.evalNode(n.object, ctx)
        const prop = n.computed ? this.evalNode(n.property, ctx) : (n.property as Identifier).name

        if (obj === null || typeof obj === 'undefined') {
          return undefined
        }

        return (obj as Record<string | number | symbol, unknown>)[prop as keyof typeof obj]
      }
      case 'ConditionalExpression': {
        const { test, consequent, alternate } = node as any
        return this.evalNode(test, ctx) ? this.evalNode(consequent, ctx) : this.evalNode(alternate, ctx)
      }
      default:
        throw new Error(`node ${node.type} not supported`)
    }
  }

  private resolveMemberPath(node: MemberExpression | Identifier, ctx: IContext): string {
    if (node.type === 'Identifier') {
      return (node as Identifier).name
    }
    const member = node as MemberExpression
    const base = this.resolveMemberPath(member.object as MemberExpression | Identifier, ctx)
    const prop = member.computed ? this.evalNode(member.property, ctx) : (member.property as Identifier).name
    return `${base}.${String(prop)}`
  }
}
