import { http, HttpResponse } from 'msw'
import { server } from '@/test/server'
import { createServices, resolveApiMode } from './createServices'

describe('createServices', () => {
  it('usa mock no desenvolvimento e http no build, salvo pedido explícito', () => {
    expect(resolveApiMode(undefined, false)).toBe('mock')
    expect(resolveApiMode('qualquer', false)).toBe('mock')
    expect(resolveApiMode(undefined, true)).toBe('http')
    expect(resolveApiMode('qualquer', true)).toBe('http')
    expect(resolveApiMode('mock', true)).toBe('mock')
    expect(resolveApiMode('http', false)).toBe('http')
  })

  it('no modo mock responde sem rede', async () => {
    const services = await createServices({ VITE_PUBLIC_API_MODE: 'mock' })
    expect((await services.system.health()).version).toBe('mock')
  })

  it('o build de produção sem modo definido chama a API real', async () => {
    server.use(http.get('*/health', () => HttpResponse.json({ status: 'ok', version: '1.0.0' })))
    const services = await createServices({ PROD: true })
    expect((await services.system.health()).version).toBe('1.0.0')
  })

  it('no modo http chama a API real com o prefixo configurado', async () => {
    let path = ''
    server.use(
      http.get('*/backend/session', ({ request }) => {
        path = new URL(request.url).pathname
        return HttpResponse.json({ name: 'Prof. Teste', department: 'CIC' })
      }),
    )
    const services = await createServices({
      VITE_PUBLIC_API_MODE: 'http',
      VITE_PUBLIC_API_BASE_URL: '/backend',
    })
    await services.session.currentTeacher()
    expect(path).toBe('/backend/session')
  })
})
