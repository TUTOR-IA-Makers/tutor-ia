import { CircleCheck, CircleX, ShieldCheck } from 'lucide-react'
import { Icon } from '@/components/ui'
import {
  STRUCTURE_GROUPS,
  structureLabel,
  type ConstraintCheck,
  type StructureRules,
} from '@/domain'
import { cx } from '@/lib/cx'
import styles from './ConstraintsList.module.css'

export interface ConstraintsListProps {
  structures: StructureRules
  checks: readonly ConstraintCheck[]
}

function findCheck(checks: readonly ConstraintCheck[], rule: keyof StructureRules, id: string) {
  return checks.find((check) => check.rule === rule && check.structureId === id)
}

function verdict(rule: keyof StructureRules, check: ConstraintCheck | undefined): string {
  if (check) return check.satisfied ? 'Respeitada' : 'Violada'
  return rule === 'allowed' ? 'Uso livre' : 'Sem verificação'
}

export function ConstraintsList({ structures, checks }: ConstraintsListProps) {
  return (
    <section className={styles.section} aria-labelledby="constraints-title">
      <h2 id="constraints-title" className={styles.title}>
        <Icon icon={ShieldCheck} size="md" />
        Restrições e estruturas em C
      </h2>
      <div className={styles.groups}>
        {STRUCTURE_GROUPS.map((group) => (
          <div key={group.kind} className={styles.group}>
            <h3 className={styles.groupTitle}>{group.title}</h3>
            {structures[group.kind].length === 0 ? (
              <p className={styles.empty}>Nenhuma.</p>
            ) : (
              <ul className={styles.list}>
                {structures[group.kind].map((id) => {
                  const check = findCheck(checks, group.kind, id)
                  const violated = check?.satisfied === false
                  return (
                    <li key={id} className={cx(styles.item, violated && styles.violated)}>
                      <Icon icon={violated ? CircleX : CircleCheck} />
                      <code className={styles.name}>{structureLabel(id)}</code>
                      <span className={styles.verdict}>{verdict(group.kind, check)}</span>
                      {check?.detail && <span className={styles.detail}>{check.detail}</span>}
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        ))}
      </div>
    </section>
  )
}
