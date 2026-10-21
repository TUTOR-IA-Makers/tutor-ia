import { ArrowRight } from 'lucide-react'
import { ExternalButtonLink } from './ExternalButtonLink'
import styles from './Hero.module.css'
import { ACCESS_URL, DOCS_URL } from './links'
import { LiveGenerator } from './LiveGenerator'

export function Hero() {
  return (
    <section className={styles.band} aria-labelledby="landing-titulo">
      <div className={styles.hero}>
        <div className={styles.copy}>
          <p className={styles.eyebrow}>
            Para professores de Algoritmos e Programação de Computadores
          </p>
          <h1 id="landing-titulo" className={styles.title}>
            Questões de C verificadas por execução, prontas para o Moodle.
          </h1>
          <p className={styles.text}>
            Montar um exercício com enunciado, solução e casos de teste leva horas. E um caso com a
            saída errada só aparece quando um aluno reclama.
          </p>
          <p className={styles.text}>
            O CodeExpert gera os três a partir do conteúdo e da dificuldade que você escolhe. A saída
            esperada de cada caso vem da execução da solução compilada, nunca de um palpite do modelo.
            Você revisa e exporta o XML para o Aprender3.
          </p>
          <div className={styles.actions}>
            <ExternalButtonLink href={ACCESS_URL} size="lg" icon={ArrowRight}>
              Pedir acesso
            </ExternalButtonLink>
            <a href={DOCS_URL} className={styles.link}>
              Ler a documentação
            </a>
          </div>
        </div>
        <div id="como-funciona" className={styles.demo}>
          <LiveGenerator />
        </div>
      </div>
    </section>
  )
}
