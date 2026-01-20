import { render } from 'solid-js/web'

import App from './app'
import { initMobxObserver } from './infrastructure/mobx/init-mobx'

import 'uno.css'

import './assets/main.css'

initMobxObserver()

render(() => <App />, document.getElementById('root') as HTMLElement)
