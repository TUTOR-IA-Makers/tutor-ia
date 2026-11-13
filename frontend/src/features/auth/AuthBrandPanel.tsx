import { Link } from 'react-router'
import logoMono from '@/assets/brand/logo-mono.svg'
import { HeroScene } from '@/features/landing'
import styles from './AuthBrandPanel.module.css'

// The landing's hero band, carried over so signing in feels like the next
// step of the same page. The white mark is required here: the coloured logo's
// teal reaches only 1.94:1 against the blue.
export function AuthBrandPanel() {
  return (
    <aside className={styles.panel} aria-label="Sobre o CodeExpert">
      <Link to="/" className={styles.brand}>
        <img src={logoMono} alt="" width={38} height={24} className={styles.logo} />
        <span>CodeExpert</span>
        <span className="visually-hidden">, voltar à página inicial</span>
      </Link>

      <div className={styles.copy}>
        <p className={styles.eyebrow}>Para professores de Algoritmos e Programação</p>
        <p className={styles.statement}>
          Questões de C testadas por execução.{' '}
          <span className={styles.keyword}>Prontas para o Moodle.</span>
        </p>
        <p className={styles.text}>
          A saída esperada de cada caso de teste vem de compilar e rodar a solução, nunca de um
          palpite do modelo.
        </p>
      </div>

      <div className={styles.scene}>
        <HeroScene />
      </div>
    </aside>
  )
}
