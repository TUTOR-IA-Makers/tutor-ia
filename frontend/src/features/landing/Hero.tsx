import { ArrowDown, ArrowRight } from 'lucide-react'
import { trackEvent } from './analytics'
import { ExternalButtonLink } from './ExternalButtonLink'
import styles from './Hero.module.css'
import { HeroScene } from './HeroScene'
import { ACCESS_URL } from './links'

export function Hero() {
  return (
    <section className={styles.band} aria-labelledby="landing-titulo">
      <div className={styles.hero}>
        <div className={styles.copy}>
          <p className={styles.eyebrow}>Para professores de Algoritmos e Programação</p>

          <h1 id="landing-titulo" className={styles.title}>
            Menos tempo criando questões.{' '}
            <span className={styles.keyword}>Mais tempo ensinando.</span>
          </h1>

          <p className={styles.text}>
            Questões de C testadas por execução, prontas para o Moodle. Você revisa e exporta.
          </p>

          <div className={styles.actions}>
            <ExternalButtonLink
              href={ACCESS_URL}
              variant="secondary"
              size="lg"
              icon={ArrowRight}
              location="hero"
            >
              Solicitar acesso ao CodeExpert
            </ExternalButtonLink>

            <a
              href="#como-funciona"
              className={styles.link}
              onClick={() => {
                trackEvent('hero_cta_click', { cta: 'ver-demonstracao' })
              }}
            >
              Ver demonstração <ArrowDown className={styles.linkIcon} aria-hidden="true" />
            </a>
          </div>
        </div>

        <HeroScene />
      </div>
    </section>
  )
}
