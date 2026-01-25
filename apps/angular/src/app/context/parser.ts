import { IContext } from "./context.service"

export class ContextKeyExpression {
  constructor() { }

  static parse(raw: string) {
    return null
  }

  evaluate(_context: IContext): boolean {
    return true
  }

  evalNode(node: any, ctx: IContext) {

  }

  private resolveMemberPath(node: any, ctx: IContext): string {
    return ''
  }
}
