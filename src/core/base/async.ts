import type { IDisposable } from "./lifecycle";

import { toDisposable } from "./lifecycle";

export class RunOnceScheduler implements IDisposable {
  protected runner: (() => void) | null;
  private timeoutToken: ReturnType<typeof setTimeout> | undefined;
  private timeout: number;
  private timeoutHandler: () => void;

  constructor(runner: () => void, delay: number) {
    this.timeoutToken = undefined;
    this.runner = runner;
    this.timeout = delay;
    this.timeoutHandler = this.onTimeout.bind(this);
  }

  dispose(): void {
    this.cancel();
    this.runner = null;
  }

  cancel(): void {
    if (this.isScheduled()) {
      clearTimeout(this.timeoutToken);
      this.timeoutToken = undefined;
    }
  }

  schedule(delay = this.timeout): void {
    this.cancel();
    this.timeoutToken = setTimeout(this.timeoutHandler, delay);
  }

  get delay(): number {
    return this.timeout;
  }

  set delay(value: number) {
    this.timeout = value;
  }

  isScheduled(): boolean {
    return this.timeoutToken !== undefined;
  }

  flush(): void {
    if (this.isScheduled()) {
      this.cancel();
      this.doRun();
    }
  }

  private doRun(): void {
    if (this.runner) {
      this.runner();
    }
  }

  private onTimeout(): void {
    this.timeoutToken = undefined;
    if (this.runner) {
      this.runner();
    }
  }
}

export class AsyncQueue<T> {
  private queue: Promise<T> = Promise.resolve({} as T);

  enqueue(factory: () => Promise<T>): Promise<T> {
    this.queue = this.queue.then(() => factory());
    return this.queue;
  }
}

export class IntervalTimer implements IDisposable {
  private disposable: IDisposable | undefined = undefined;
  private isDisposed = false;

  cancel(): void {
    this.disposable?.dispose();
    this.disposable = undefined;
  }

  cancelAndSet(runner: () => void, interval: number, context = globalThis): void {
    if (this.isDisposed) {
      throw new Error(`Calling 'cancelAndSet' on a disposed IntervalTimer`);
    }

    this.cancel();
    const handle = context.setInterval(() => {
      runner();
    }, interval);

    this.disposable = toDisposable(() => {
      context.clearInterval(handle);
      this.disposable = undefined;
    });
  }

  dispose(): void {
    this.cancel();
    this.isDisposed = true;
  }
}
