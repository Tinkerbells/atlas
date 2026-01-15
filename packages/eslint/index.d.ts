import type { Linter } from 'eslint'
import type { FlatConfigComposer } from 'eslint-flat-config-utils'
import type antfu, { Awaitable, OptionsConfig, TypedFlatConfigItem } from '@antfu/eslint-config'

export declare function defineConfig(
  options?: OptionsConfig & Omit<TypedFlatConfigItem, 'files'>,
  ...userConfigs: Awaitable<TypedFlatConfigItem | TypedFlatConfigItem[] | FlatConfigComposer<any, any> | Linter.Config[]>[]
): ReturnType<typeof antfu>

declare const _default: ReturnType<typeof defineConfig>
export default _default
