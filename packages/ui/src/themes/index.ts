import md3Light from './md3-light'
import md3Dark from './md3-dark'
export { convert } from './convert'
export { toRem } from './toRem'
export { toViewport } from './toViewport'

export const Themes = { md3Light, md3Dark }

export type ThemeName = keyof typeof Themes

export default Themes
