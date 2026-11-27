import { EMPTY_FILTERS, type QuestionDraft } from '@/domain'
import { HttpError } from '@/lib/http'
import { createMockServices } from './createMockServices'
import { MOCK_ACCOUNT, MOCK_INVITE_CODE } from './fixtures'

const STEP = 1000

function setup(interrupted: readonly string[] = []) {
  const clock = { now: 1_000_000 }
  const services = createMockServices({
    latencyMs: 0,
    stepMs: STEP,
    now: () => clock.now,
    interrupted,
  })
  return { clock, services, questions: services.questions }
}

const draft: QuestionDraft = {
  contentId: 'condicionais',
  difficulty: { min: 1200, max: 1600 },
  testCaseCount: 4,
  testCaseHints: 'incluir números negativos',
  context: 'par ou ímpar',
  structures: { required: ['if-else'], allowed: [], forbidden: ['lacos'] },
}

describe('createMockServices', () => {
  it('lista as questões semeadas e aplica filtros', async () => {
    const { questions } = setup()
    expect(await questions.list(EMPTY_FILTERS)).toHaveLength(7)
    const approved = await questions.list({ ...EMPTY_FILTERS, status: 'APROVADA' })
    expect(approved.every((question) => question.status === 'APROVADA')).toBe(true)
    expect(approved).toHaveLength(3)
  })

  it('devolve cópias para que a tela não altere o estado interno', async () => {
    const { questions } = setup()
    const first = await questions.get('q-0142')
    first.title = 'alterado'
    expect((await questions.get('q-0142')).title).toBe('Ano bissexto')
  })

  it('responde 404 para questão inexistente', async () => {
    const { questions } = setup()
    await expect(questions.get('nao-existe')).rejects.toMatchObject({ status: 404 })
  })

  it('cria questão e avança as etapas com o tempo até ficar aguardando revisão', async () => {
    const { clock, questions } = setup()
    const { id } = await questions.create(draft)
    expect((await questions.get(id)).status).toBe('GERANDO')
    expect((await questions.generation(id)).completedSteps).toBe(0)

    clock.now += 3 * STEP
    expect(await questions.generation(id)).toMatchObject({ status: 'GERANDO', completedSteps: 3 })

    clock.now += 2 * STEP
    expect(await questions.generation(id)).toMatchObject({ status: 'GERADA', completedSteps: 5 })
    const created = await questions.get(id)
    expect(created.title).toBe('Par ou ímpar')
    expect(created.testCases).toHaveLength(4)
    expect(created.code).toMatch(/^#\d{4}$/)
  })

  it('informa a etapa em que a verificação falhou', async () => {
    const { questions } = setup()
    expect(await questions.generation('q-0141')).toMatchObject({
      status: 'FALHOU_VERIFICACAO',
      completedSteps: 3,
    })
  })

  it('retoma uma geração interrompida da etapa em que parou, no mesmo run', async () => {
    const { clock, questions } = setup(['q-0142'])
    const stopped = await questions.generation('q-0142')
    expect(stopped).toMatchObject({
      status: 'FALHOU_VERIFICACAO',
      completedSteps: 2,
      resumable: true,
    })
    const resumed = await questions.resume('q-0142')
    expect(resumed).toMatchObject({
      status: 'GERANDO',
      completedSteps: 2,
      resumable: false,
      runId: stopped.runId,
    })
    clock.now += 3 * STEP
    expect((await questions.get('q-0142')).status).toBe('GERADA')
  })

  it('recusa retomar o que não foi interrompido', async () => {
    const { questions } = setup()
    expect((await questions.generation('q-0141')).resumable).toBe(false)
    await expect(questions.resume('q-0141')).rejects.toMatchObject({ status: 409 })
    await expect(questions.resume('q-0143')).rejects.toMatchObject({ status: 409 })
  })

  it('aprova e rejeita só a partir de "aguardando revisão"', async () => {
    const { questions } = setup()
    expect((await questions.approve('q-0142')).status).toBe('APROVADA')
    await expect(questions.approve('q-0142')).rejects.toBeInstanceOf(HttpError)
    expect((await questions.reject('q-0144')).status).toBe('REJEITADA')
    await expect(questions.reject('q-0141')).rejects.toMatchObject({ status: 409 })
  })

  it('gerar de novo cria outra questão e deixa a antiga como estava', async () => {
    const { clock, questions } = setup()
    const { id } = await questions.regenerate('q-0141')
    expect(id).not.toBe('q-0141')
    expect((await questions.get('q-0141')).status).toBe('FALHOU_VERIFICACAO')
    const restarted = await questions.get(id)
    expect(restarted.status).toBe('GERANDO')
    expect(restarted.failureReason).toBeNull()
    clock.now += 5 * STEP
    expect((await questions.get(id)).status).toBe('GERADA')
    await expect(questions.regenerate('q-0138')).rejects.toMatchObject({ status: 409 })
  })

  it('edita o enunciado só enquanto a questão aguarda revisão', async () => {
    const { questions } = setup()
    const before = await questions.get('q-0142')
    const updated = await questions.updateStatement('q-0142', {
      ...before.statement,
      text: 'Novo texto',
    })
    expect(updated.statement.text).toBe('Novo texto')
    expect(updated.status).toBe('GERADA')
    await expect(questions.updateStatement('q-0138', before.statement)).rejects.toMatchObject({
      status: 409,
    })
    await expect(questions.updateStatement('q-0143', before.statement)).rejects.toMatchObject({
      status: 409,
    })
  })

  it('exporta XML só de questões aprovadas', async () => {
    const { questions } = setup()
    const file = await questions.exportMoodleXml(['q-0138', 'q-0139'])
    expect(file.filename).toBe('questoes_milani.xml')
    const xml = await file.blob.text()
    expect(xml).toContain('Maior de três números')
    expect(xml).toContain('Cálculo de média ponderada')
    await expect(questions.exportMoodleXml(['q-0142'])).rejects.toMatchObject({ status: 409 })
  })

  it('entrega sessão e saúde simuladas', async () => {
    const { services } = setup()
    expect((await services.session.currentTeacher()).department).toBe('Ciência da Computação')
    await expect(services.session.logout()).resolves.toBeUndefined()
    expect(await services.system.health()).toEqual({ status: 'ok', version: 'mock' })
  })

  it('entra com a conta de demonstração e recusa o resto com o mesmo erro', async () => {
    const { session } = setup().services
    await expect(session.login(MOCK_ACCOUNT)).resolves.toBeUndefined()
    const refusal = (email: string) =>
      session.login({ email, password: 'outra-senha-1' }).then(
        () => null,
        (error: unknown) => error,
      )
    const wrongPassword = await refusal(MOCK_ACCOUNT.email)
    const unknownAccount = await refusal('ninguem@exemplo.com')
    expect(wrongPassword).toBeInstanceOf(HttpError)
    expect(wrongPassword).toEqual(unknownAccount)
  })

  it('cria conta só com o convite certo e passa a responder pela professora nova', async () => {
    const { session } = setup().services
    const registration = {
      name: 'Ana Souza',
      email: 'ana@exemplo.com',
      password: 'algoritmos-em-c',
      inviteCode: MOCK_INVITE_CODE,
    }
    const badInvite = session.register({ ...registration, inviteCode: 'OUTRO-2026' })
    await expect(badInvite).rejects.toMatchObject({ status: 400 })
    await session.register(registration)
    expect((await session.currentTeacher()).name).toBe('Ana Souza')
    await expect(session.register(registration)).rejects.toMatchObject({ status: 400 })
    await session.login({ email: registration.email, password: registration.password })
  })

  it('respeita o cancelamento da consulta', async () => {
    const services = createMockServices({ latencyMs: 50 })
    const controller = new AbortController()
    const pending = services.questions.list(EMPTY_FILTERS, { signal: controller.signal })
    controller.abort()
    await expect(pending).rejects.toMatchObject({ name: 'AbortError' })
  })
})
