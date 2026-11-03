import { ClipboardList, FileCode2, FileDown, FlaskConical, Terminal } from 'lucide-react'
import type { CSSProperties } from 'react'
import { Icon } from '@/components/ui'
import styles from './Problem.module.css'
import { useScrollProgress } from './useScrollProgress'

// x, y (px), z (px) and rotation (deg) where each card starts, scattered; at the end of
// the scroll every card is at 0 and the five sit in one line, connected.
const STEPS = [
  { icon: ClipboardList, title: 'Enunciado', x: -90, y: -70, z: -260, r: -14 },
  { icon: FileCode2, title: 'Solução', x: 70, y: 90, z: 120, r: 11 },
  { icon: FlaskConical, title: 'Testes', x: -40, y: 130, z: -120, r: 8 },
  { icon: Terminal, title: 'Execução', x: 100, y: -110, z: 200, r: -9 },
  { icon: FileDown, title: 'Moodle', x: -110, y: 40, z: 60, r: 15 },
] as const

export function Problem() {
  const ref = useScrollProgress<HTMLElement>()

  return (
    <section ref={ref} className={styles.section} aria-labelledby="problema-titulo">
      <div className={styles.pin}>
        <h2 id="problema-titulo" className={styles.title}>
          <span>Cinco etapas soltas.</span> <span className={styles.after}>Um único fluxo.</span>
        </h2>
        <ol className={styles.stage}>
          {STEPS.map((step, index) => (
            <li
              key={step.title}
              className={styles.card}
              style={
                {
                  '--x': step.x,
                  '--y': step.y,
                  '--z': step.z,
                  '--r': step.r,
                } as CSSProperties
              }
            >
              <span className={styles.number}>{index + 1}</span>
              <Icon icon={step.icon} size="md" />
              <span className={styles.label}>{step.title}</span>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
