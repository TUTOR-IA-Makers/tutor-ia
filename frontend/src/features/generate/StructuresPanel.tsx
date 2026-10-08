import { CircleCheck, ListChecks, Ban } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useId } from 'react'
import { Callout, Chip, Icon, Panel, type ChipTone } from '@/components/ui'
import {
  blockedBy,
  STRUCTURE_GROUPS,
  structureLabel,
  toggleRule,
  type StructureRuleKind,
  type StructureRules,
} from '@/domain'
import { cx } from '@/lib/cx'
import styles from './StructuresPanel.module.css'

const PRESENTATION: Record<StructureRuleKind, { tone: ChipTone; icon: LucideIcon }> = {
  required: { tone: 'accent', icon: CircleCheck },
  allowed: { tone: 'primary', icon: ListChecks },
  forbidden: { tone: 'danger', icon: Ban },
}

export interface StructuresPanelProps {
  value: StructureRules
  onChange: (value: StructureRules) => void
  error?: string | undefined
}

export function StructuresPanel({ value, onChange, error }: StructuresPanelProps) {
  const ruleId = useId()
  return (
    <Panel
      title="Estruturas em C"
      description="Defina o que a solução precisa usar, pode usar ou não pode usar."
    >
      {STRUCTURE_GROUPS.map((group) => {
        const { tone, icon } = PRESENTATION[group.kind]
        return (
          <fieldset key={group.kind} className={styles.group}>
            <legend className={cx(styles.legend, styles[group.kind])}>
              <Icon icon={icon} />
              {group.title}
            </legend>
            <p className={styles.hint}>{group.hint}</p>
            <div className={styles.chips}>
              {group.options.map((id) => {
                const blocker = blockedBy(group.kind, id, value)
                return (
                  <Chip
                    key={id}
                    tone={tone}
                    pressed={value[group.kind].includes(id)}
                    disabled={blocker !== null}
                    aria-describedby={blocker ? ruleId : undefined}
                    onToggle={() => {
                      onChange(toggleRule(value, group.kind, id))
                    }}
                  >
                    {structureLabel(id)}
                  </Chip>
                )
              })}
            </div>
          </fieldset>
        )
      })}
      <div id={ruleId}>
        <Callout
          tone={error ? 'danger' : 'neutral'}
          title="Regra de consistência"
          role={error ? 'alert' : undefined}
        >
          {error ?? 'Uma estrutura não pode ser obrigatória e proibida ao mesmo tempo.'}
        </Callout>
      </div>
    </Panel>
  )
}
