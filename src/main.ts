import { registerSW } from 'vite-plugin-pwa/register'
import './app.css'
import App from './App.svelte'

registerSW({ immediate: true })

const app = new App({
  target: document.getElementById('app')!
})

export default app
