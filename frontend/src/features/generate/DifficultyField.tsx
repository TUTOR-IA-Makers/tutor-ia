import { FieldGroup, RangeSlider } from '@/components/ui'
import {
  bandOf,
  describeDifficulty,
  DIFFICULTY_BANDS,
  formatRating,
  RATING_MAX,
  RATING_MIN,
  RATING_STEP,
  type DifficultyRange,
} from '@/domain'
import styles from './DifficultyField.module.css'

export interface DifficultyFieldProps {
  value: DifficultyRange
  onChange: (value: DifficultyRange) => void
  error?: string | undefined
}

const valueText = (rating: number) => `${String(rating)}, ${bandOf(rating).label}`

export function DifficultyField({ value, onChange, error }: DifficultyFieldProps) {
  return (
    <FieldGroup
      legend="Dificuldade"
      hint={`Intervalo de rating no estilo Codeforces, de ${String(RATING_MIN)} a ${String(RATING_MAX)}, em passos de ${String(RATING_STEP)}.`}
      error={error}
    >
      {(describedById) => (
        <div className={styles.field}>
          <p className={styles.summary} aria-live="polite">
            <span className={styles.rating}>{formatRating(value)}</span>
            <span className={styles.band}>{describeDifficulty(value)}</span>
          </p>
          <RangeSlider
            min={RATING_MIN}
            max={RATING_MAX}
            step={RATING_STEP}
            value={value}
            onChange={onChange}
            minLabel="Dificuldade mínima"
            maxLabel="Dificuldade máxima"
            valueText={valueText}
            {...(describedById ? { 'aria-describedby': describedById } : {})}
          />
          <ol className={styles.scale} aria-hidden="true">
            {DIFFICULTY_BANDS.map((band) => (
              <li key={band.id}>{band.label}</li>
            ))}
          </ol>
        </div>
      )}
    </FieldGroup>
  )
}
