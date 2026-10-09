import { DescriptionList, LinkButton, PageHeader, Panel } from '@/components/ui'
import { QUESTION_STATUSES } from '@/domain'
import { HealthStatus } from '@/features/health'
import { MoodleImportSteps } from '@/features/library'
import { QuestionStatusBadge } from '@/features/questions'
import { useDocumentTitle } from '@/lib/dom'
import styles from './HelpPage.module.css'

const STATUS_MEANING: Record<(typeof QUESTION_STATUSES)[number], string> = {
  GERANDO: 'O CodeExpert está escrevendo e verificando a questão. Você pode navegar enquanto isso.',
  GERADA: 'A questão passou na verificação técnica e espera a sua revisão.',
  FALHOU_VERIFICACAO: 'A solução não respeitou o que foi pedido. Veja o motivo e gere de novo.',
  APROVADA: 'Você aprovou a questão. Ela pode ser exportada para o Moodle.',
  REJEITADA: 'Você rejeitou a questão. Ela não entra na exportação.',
}

const GLOSSARY = [
  { term: 'Conteúdo', value: 'Assunto de programação da questão, como condicionais ou vetores.' },
  {
    term: 'Dificuldade',
    value:
      'Intervalo de rating no estilo Codeforces, de 500 a 3500, de Muito fácil a Muito difícil.',
  },
  { term: 'Caso de teste', value: 'Entrada e saída esperada usadas na correção automática.' },
  {
    term: 'Estruturas em C',
    value: 'Construções da linguagem obrigatórias, permitidas ou proibidas.',
  },
]

export function HelpPage() {
  useDocumentTitle('Ajuda')
  return (
    <div className={styles.page}>
      <PageHeader
        title="Ajuda"
        description="Como usar o CodeExpert, do pedido à importação no Moodle."
      />
      <div className={styles.grid}>
        <Panel title="Como gerar uma questão">
          <ol className={styles.steps}>
            <li>Em Gerar questão, escolha o conteúdo, a dificuldade e as estruturas em C.</li>
            <li>Acompanhe as cinco etapas. A geração continua enquanto você navega.</li>
            <li>Revise o enunciado, a solução e os casos de teste. Aprove ou rejeite.</li>
            <li>Na biblioteca, selecione as questões aprovadas e exporte o XML.</li>
          </ol>
          <LinkButton to="/gerar" variant="primary">
            Gerar questão
          </LinkButton>
        </Panel>
        <Panel title="Estados da questão">
          <ul className={styles.statuses}>
            {QUESTION_STATUSES.map((status) => (
              <li key={status}>
                <QuestionStatusBadge status={status} />
                <span>{STATUS_MEANING[status]}</span>
              </li>
            ))}
          </ul>
        </Panel>
        <Panel title="Como importar no Moodle">
          <MoodleImportSteps />
        </Panel>
        <Panel title="Glossário">
          <DescriptionList items={GLOSSARY} />
        </Panel>
        <Panel title="Status do servidor">
          <div>
            <HealthStatus />
          </div>
        </Panel>
      </div>
    </div>
  )
}
