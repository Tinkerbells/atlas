import { IContext } from './context.service';

export class ContextKeyExpression {
  constructor() {}

  static parse(_raw: string) {
    return null;
  }

  evaluate(_context: IContext): boolean {
    return true;
  }

  evalNode(_node: any, _ctx: IContext) {}

  private resolveMemberPath(_node: any, _ctx: IContext): string {
    return '';
  }
}
