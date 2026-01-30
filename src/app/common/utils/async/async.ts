/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import type { IDisposable } from '~/common/core/disposable'

import { toDisposable } from '~/common/core/disposable'

export class IntervalTimer implements IDisposable {
  private disposable: IDisposable | undefined = undefined
  private isDisposed = false

  cancel(): void {
    this.disposable?.dispose()
    this.disposable = undefined
  }

  cancelAndSet(runner: () => void, interval: number, context = globalThis): void {
    if (this.isDisposed) {
      throw new Error(`Calling 'cancelAndSet' on a disposed IntervalTimer`)
    }

    this.cancel()
    const handle = context.setInterval(() => {
      runner()
    }, interval)

    this.disposable = toDisposable(() => {
      context.clearInterval(handle)
      this.disposable = undefined
    })
  }

  dispose(): void {
    this.cancel()
    this.isDisposed = true
  }
}
