import { CircleCheck, ListChecks, Ban } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useId } from 'react'
import { Button, Callout, Chip, Icon, Panel, type ChipTone } from '@/components/ui'
import {
  blockedBy,
  STRUCTURE_GROUPS,
  type StructureOption,
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
  options: readonly StructureOption[]
  value: StructureRules
  onChange: (value: StructureRules) => void
  error?: string | undefined
}

export function StructuresPanel({ options, value, onChange, error }: StructuresPanelProps) {
  const ruleId = useId()
  const known = new Set(options.map(({ id }) => id))
  const hasUnknown = [...value.required, ...value.allowed, ...value.forbidden].some(
    (id) => !known.has(id),
  )
  return (
    <Panel
      title="Estruturas em C"
      description="Defina o que a solução precisa usar, pode usar ou não pode usar."
    >
      {hasUnknown && (
        <Callout tone="danger" title="Seleções desatualizadas">
          Algumas estruturas selecionadas não existem mais no catálogo.
          <Button
            onClick={() => {
              onChange({
                required: value.required.filter((id) => known.has(id)),
                allowed: value.allowed.filter((id) => known.has(id)),
                forbidden: value.forbidden.filter((id) => known.has(id)),
              })
            }}
          >
            Remover estruturas fora do catálogo
          </Button>
        </Callout>
      )}
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
              {options.map(({ id, label }) => {
                const blocker = blockedBy(group.kind, id, value)
                return (
                  <Chip
                    key={id}
                    tone={tone}
                    pressed={value[group.kind].includes(id)}
                    disabled={blocker !== null && !value[group.kind].includes(id)}
                    aria-describedby={blocker ? ruleId : undefined}
                    onToggle={() => {
                      onChange(toggleRule(value, group.kind, id))
                    }}
                  >
                    {label}
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
          {error ?? 'Uma estrutura proibida não pode ser obrigatória nem permitida.'}
        </Callout>
      </div>
    </Panel>
  )
}
