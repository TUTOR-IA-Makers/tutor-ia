import styles from './Demo.module.css'
import { LiveGenerator } from './LiveGenerator'
import { SectionHeader } from './SectionHeader'

export function Demo() {
  return (
    <section id="como-funciona" className={styles.section} aria-labelledby="demo-titulo">
      <SectionHeader id="demo-titulo" eyebrow="Demonstração" title="Gere uma questão agora." />
      <LiveGenerator />
    </section>
  )
}
