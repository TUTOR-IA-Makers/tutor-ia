import '@testing-library/jest-dom/vitest'
import { cleanup, configure } from '@testing-library/react'
import { afterAll, afterEach, beforeAll } from 'vitest'
import { server } from './server'

configure({ asyncUtilTimeout: 4000 })

function polyfillDialog() {
  const proto = HTMLDialogElement.prototype as Partial<HTMLDialogElement>
  proto.showModal ??= function showModal(this: HTMLDialogElement) {
    this.setAttribute('open', '')
  }
  proto.close ??= function close(this: HTMLDialogElement) {
    if (!this.hasAttribute('open')) return
    this.removeAttribute('open')
    this.dispatchEvent(new Event('close'))
  }
}

beforeAll(() => {
  polyfillDialog()
  server.listen({ onUnhandledFrame: 'error' })
})

afterEach(() => {
  cleanup()
  server.resetHandlers()
})

afterAll(() => {
  server.close()
})
