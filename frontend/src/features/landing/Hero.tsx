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
            Preparar exercícios leva horas. O CodeExpert gera enunciados, soluções e casos de teste.
            Você revisa e exporta o XML para o Moodle / Aprender3.
          </p>

          <p className={styles.text}>
            A saída esperada vem da execução da solução compilada, nunca de um palpite do modelo.
          </p>

          <div className={styles.actions}>
            <ExternalButtonLink href={ACCESS_URL} variant="secondary" size="lg" icon={ArrowRight}>
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
