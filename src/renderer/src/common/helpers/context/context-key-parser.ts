type TokType = 'ident' | 'number' | 'string' | 'bool' | 'op' | 'lparen' | 'rparen' | 'eof'
interface Tok { t: TokType, v?: any }

type Ctx = Record<string, any>

export interface Expr {
  eval: (ctx: Ctx) => boolean
}

class And implements Expr {
  constructor(private l: Expr, private r: Expr) { }

  eval(ctx: Ctx) {
    return this.l.eval(ctx) && this.r.eval(ctx)
  }
}

class Or implements Expr {
  constructor(private l: Expr, private r: Expr) { }

  eval(ctx: Ctx) {
    return this.l.eval(ctx) || this.r.eval(ctx)
  }
}

class Not implements Expr {
  constructor(private e: Expr) { }

  eval(ctx: Ctx) {
    return !this.e.eval(ctx)
  }
}

class KeyTruthy implements Expr {
  constructor(private key: string) { }

  eval(ctx: Ctx) {
    return !!ctx[this.key]
  }
}

class Eq implements Expr {
  constructor(private key: string, private val: any) { }

  eval(ctx: Ctx) {
    return ctx[this.key] === this.val
  }
}

class Neq implements Expr {
  constructor(private key: string, private val: any) { }

  eval(ctx: Ctx) {
    return ctx[this.key] !== this.val
  }
}

export function parseWhen(input: string): Expr {
  const toks = tokenize(input)
  let pos = 0

  const peek = () => toks[pos]
  const eat = (t?: TokType | TokType[]) => {
    const tok = toks[pos]
    if (!t || (Array.isArray(t) ? t.includes(tok.t) : tok.t === t)) {
      pos++
      return tok
    }
    throw new Error(`Unexpected token ${tok.t} at ${pos}`)
  }

  function parseOr(): Expr {
    let left = parseAnd()

    while (peek().t === 'op' && peek().v === '||') {
      eat('op')
      left = new Or(left, parseAnd())
    }

    return left
  }

  function parseAnd(): Expr {
    let left = parseNot()

    while (peek().t === 'op' && peek().v === '&&') {
      eat('op')
      left = new And(left, parseNot())
    }

    return left
  }

  function parseNot(): Expr {
    if (peek().t === 'op' && peek().v === '!') {
      eat('op')
      return new Not(parseNot())
    }
    return parsePrimary()
  }

  function parsePrimary(): Expr {
    const tok = peek()

    if (tok.t === 'lparen') {
      eat('lparen')
      const e = parseOr()
      eat('rparen')
      return e
    }

    if (tok.t === 'ident') {
      const id = eat('ident').v as string
      const op = peek()

      if (op.t === 'op' && (op.v === '==' || op.v === '!=')) {
        const cmpOp = eat('op').v as string
        const lit = parseLiteral()
        return cmpOp === '==' ? new Eq(id, lit) : new Neq(id, lit)
      }

      return new KeyTruthy(id)
    }

    throw new Error(`Unexpected token ${tok.t} at ${pos}`)
  }

  function parseLiteral(): any {
    const tok = peek()

    if (tok.t === 'string' || tok.t === 'number' || tok.t === 'bool') {
      eat(tok.t)
      return tok.v
    }

    if (tok.t === 'ident') {
      return eat('ident').v
    }

    throw new Error(`Expected literal at ${pos}`)
  }

  const expr = parseOr()
  if (peek().t !== 'eof')
    throw new Error('Unexpected tokens at end')
  return expr
}

function tokenize(input: string): Tok[] {
  const tokens: Tok[] = []
  let i = 0
  const ws = /\s/
  const isIdStart = /[A-Z_$]/i
  const isId = /[\w$.]/

  while (i < input.length) {
    const ch = input[i]

    if (ws.test(ch)) {
      i++
      continue
    }

    if (ch === '(') {
      tokens.push({ t: 'lparen' })
      i++
      continue
    }

    if (ch === ')') {
      tokens.push({ t: 'rparen' })
      i++
      continue
    }

    if (ch === '&' && input[i + 1] === '&') {
      tokens.push({ t: 'op', v: '&&' })
      i += 2
      continue
    }

    if (ch === '|' && input[i + 1] === '|') {
      tokens.push({ t: 'op', v: '||' })
      i += 2
      continue
    }

    if (ch === '!' && input[i + 1] !== '=') {
      tokens.push({ t: 'op', v: '!' })
      i++
      continue
    }

    if (ch === '=' && input[i + 1] === '=') {
      tokens.push({ t: 'op', v: '==' })
      i += 2
      continue
    }

    if (ch === '!' && input[i + 1] === '=') {
      tokens.push({ t: 'op', v: '!=' })
      i += 2
      continue
    }

    if (ch === '"' || ch === '\'') {
      const quote = ch
      i++
      let str = ''

      while (i < input.length && input[i] !== quote) {
        str += input[i++]
      }

      i++
      tokens.push({ t: 'string', v: str })
      continue
    }

    if (/\d/.test(ch)) {
      let num = ''
      while (i < input.length && /\d/.test(input[i])) {
        num += input[i++]
      }

      tokens.push({ t: 'number', v: Number(num) })
      continue
    }

    if (isIdStart.test(ch)) {
      let id = ''
      while (i < input.length && isId.test(input[i])) {
        id += input[i++]
      }

      if (id === 'true' || id === 'false') {
        tokens.push({ t: 'bool', v: id === 'true' })
      }
      else {
        tokens.push({ t: 'ident', v: id })
      }

      continue
    }

    throw new Error(`Unexpected char '${ch}' at ${i}`)
  }

  tokens.push({ t: 'eof' })
  return tokens
}
