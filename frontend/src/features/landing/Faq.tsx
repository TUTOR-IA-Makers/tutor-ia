import { Disclosure } from '@/components/ui'
import { trackEvent } from './analytics'
import styles from './Faq.module.css'
import { ACCESS_URL } from './links'
import { SectionHeader } from './SectionHeader'

const QUESTIONS = [
  {
    id: 'saber-c',
    question: 'Preciso saber programar em C para usar?',
    answer:
      'Você não escreve o código, mas revisa a solução de referência antes de exportar. Por isso ajuda conhecer o conteúdo que a questão cobre, como você já conhece ao preparar uma aula.',
  },
  {
    id: 'substitui-moodle',
    question: 'O CodeExpert substitui o Moodle?',
    answer:
      'Não. Ele prepara as questões e entrega um arquivo para importar no Moodle. Turmas, questionários, correção e notas continuam no Moodle.',
  },
  {
    id: 'execucao',
    question: 'As soluções são realmente executadas?',
    answer:
      'Sim. A solução em C é compilada e executada com cada entrada, e a saída esperada do caso é o que o programa imprimiu. Um modelo de linguagem nunca prevê essa saída.',
  },
  {
    id: 'revisar',
    question: 'Posso revisar as questões?',
    answer:
      'Pode, e deve. Enunciado, solução e casos de teste ficam disponíveis para revisão antes da exportação. Nada é publicado para a turma sem você importar o arquivo.',
  },
  {
    id: 'exportacao',
    question: 'Como funciona a exportação?',
    answer:
      'O CodeExpert gera um arquivo XML no formato Moodle XML com perguntas do tipo CodeRunner. No curso, você abre o Banco de questões, escolhe Importar e envia o arquivo. O curso precisa ter o plugin CodeRunner instalado.',
  },
  {
    id: 'correcao',
    question: 'O CodeExpert corrige respostas dos alunos?',
    answer:
      'Não. Quem corrige o código dos alunos é o CodeRunner, dentro do Moodle, usando os casos de teste que o CodeExpert preparou. A nota é definida por você.',
  },
  {
    id: 'acesso',
    question: 'Como solicito acesso?',
    answer: (
      <>
        Durante o piloto, o acesso é liberado manualmente pela equipe do projeto, não é imediato. A{' '}
        <a href={ACCESS_URL}>página de solicitação</a> explica o que informar e o que acontece
        depois.
      </>
    ),
  },
] as const

export function Faq() {
  return (
    <section className={styles.section} aria-labelledby="faq-titulo">
      <SectionHeader id="faq-titulo" eyebrow="Perguntas frequentes" title="Antes de pedir acesso" />
      <div className={styles.list}>
        {QUESTIONS.map((item) => (
          <Disclosure
            key={item.id}
            framed
            summary={item.question}
            onToggle={(open) => {
              if (open) trackEvent('faq_interaction', { question: item.id })
            }}
          >
            <p className={styles.answer}>{item.answer}</p>
          </Disclosure>
        ))}
      </div>
    </section>
  )
}
