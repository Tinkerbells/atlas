export interface IDisposable {
	dispose(): void;
}

export function isDisposable<E>(thing: E): thing is E & IDisposable {
	return typeof thing === 'object' && thing !== null && typeof (<IDisposable><any>thing).dispose === 'function' && (<IDisposable><any>thing).dispose.length === 0;
}

class _AggregateErrorImpl extends Error {
	constructor(public readonly errors: readonly any[], message?: string) {
		super(message);
		this.name = 'AggregateError';
	}
}

const _AggregateError: new (errors: readonly any[], message?: string) => Error =
	typeof (globalThis as any).AggregateError !== 'undefined'
		? (globalThis as any).AggregateError
		: _AggregateErrorImpl;

export function dispose<T extends IDisposable>(disposable: T): T;
export function dispose<T extends IDisposable>(disposable: T | undefined): T | undefined;
export function dispose<T extends IDisposable>(disposables: Iterable<T>): Iterable<T>;
export function dispose<T extends IDisposable>(arg: T | Iterable<T> | undefined): any {
	if (arg && typeof arg === 'object' && Symbol.iterator in arg) {
		const errors: any[] = [];

		for (const d of arg) {
			if (d) {
				try {
					d.dispose();
				} catch (e) {
					errors.push(e);
				}
			}
		}

		if (errors.length === 1) {
			throw errors[0];
		} else if (errors.length > 1) {
			throw new _AggregateError(errors, 'Encountered errors while disposing of store');
		}

		return Array.isArray(arg) ? [] : arg;
	} else if (arg) {
		arg.dispose();
		return arg;
	}
}

export function toDisposable(fn: () => void): IDisposable {
	return { dispose: fn };
}

export class DisposableStore implements IDisposable {

	static DISABLE_DISPOSED_WARNING = false;

	private readonly _toDispose = new Set<IDisposable>();
	private _isDisposed = false;

	constructor() { }

	public dispose(): void {
		if (this._isDisposed) {
			return;
		}

		this._isDisposed = true;
		this.clear();
	}

	public get isDisposed(): boolean {
		return this._isDisposed;
	}

	public clear(): void {
		if (this._toDispose.size === 0) {
			return;
		}

		try {
			dispose(this._toDispose);
		} finally {
			this._toDispose.clear();
		}
	}

	public add<T extends IDisposable>(o: T): T {
		if (!o) {
			return o;
		}
		if ((o as unknown as DisposableStore) === this) {
			throw new Error('Cannot register a disposable on itself!');
		}

		if (this._isDisposed) {
			if (!DisposableStore.DISABLE_DISPOSED_WARNING) {
				console.warn(new Error('Trying to add a disposable to a DisposableStore that has already been disposed of. The added object will be leaked!').stack);
			}
		} else {
			this._toDispose.add(o);
		}

		return o;
	}

	public delete<T extends IDisposable>(o: T): void {
		if (!o) {
			return;
		}
		if ((o as unknown as DisposableStore) === this) {
			throw new Error('Cannot dispose a disposable on itself!');
		}
		this._toDispose.delete(o);
		o.dispose();
	}
}

export abstract class Disposable implements IDisposable {

	static readonly None = Object.freeze<IDisposable>({ dispose() { } });

	protected readonly _store = new DisposableStore();

	constructor() { }

	public dispose(): void {
		this._store.dispose();
	}

	protected _register<T extends IDisposable>(o: T): T {
		if ((o as unknown as Disposable) === this) {
			throw new Error('Cannot register a disposable on itself!');
		}
		return this._store.add(o);
	}
}
