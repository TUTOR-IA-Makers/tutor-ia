import { ArrowRight } from 'lucide-react'
import logoMono from '@/assets/brand/logo-mono.svg'
import { ExternalButtonLink } from './ExternalButtonLink'
import styles from './ClosingCall.module.css'
import { ACCESS_URL, DOCS_URL } from './links'

export function ClosingCall() {
  return (
    <section className={styles.band} aria-labelledby="pedir-acesso-titulo">
      <div className={styles.inner}>
        <img src={logoMono} alt="" width={64} height={40} className={styles.logo} />
        <div className={styles.copy}>
          <h2 id="pedir-acesso-titulo" className={styles.title}>
            Dá aulas de programação em C e usa o Aprender3?
          </h2>
          <p className={styles.text}>
            Durante o piloto, o acesso é liberado manualmente pela equipe do projeto, e não é
            imediato. A página de solicitação explica o que informar e o que acontece depois.
          </p>
        </div>
        <div className={styles.actions}>
          <ExternalButtonLink href={ACCESS_URL} size="lg" icon={ArrowRight} location="final">
            Solicitar acesso ao CodeExpert
          </ExternalButtonLink>
          <a href={DOCS_URL} className={styles.link}>
            Ler a documentação
          </a>
        </div>
      </div>
    </section>
  )
}
