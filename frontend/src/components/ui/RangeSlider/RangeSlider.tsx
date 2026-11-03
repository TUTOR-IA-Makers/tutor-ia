import type { CSSProperties } from 'react'
import styles from './RangeSlider.module.css'

export interface RangeValue {
  min: number
  max: number
}

export interface RangeSliderProps {
  min: number
  max: number
  step: number
  value: RangeValue
  onChange: (value: RangeValue) => void
  minLabel: string
  maxLabel: string
  valueText?: (value: number) => string
  'aria-describedby'?: string
}

function percent(value: number, min: number, max: number): string {
  return `${String(((value - min) / (max - min)) * 100)}%`
}

export function RangeSlider({
  min,
  max,
  step,
  value,
  onChange,
  minLabel,
  maxLabel,
  valueText = String,
  'aria-describedby': describedBy,
}: RangeSliderProps) {
  const fill = {
    '--range-from': percent(value.min, min, max),
    '--range-to': percent(value.max, min, max),
  } as CSSProperties

  return (
    <div className={styles.slider} style={fill}>
      <div className={styles.track} aria-hidden="true">
        <div className={styles.fill} />
      </div>
      <input
        type="range"
        className={styles.input}
        min={min}
        max={max}
        step={step}
        value={value.min}
        aria-label={minLabel}
        aria-valuetext={valueText(value.min)}
        aria-describedby={describedBy}
        onChange={(event) => {
          onChange({ min: Math.min(Number(event.target.value), value.max), max: value.max })
        }}
      />
      <input
        type="range"
        className={styles.input}
        min={min}
        max={max}
        step={step}
        value={value.max}
        aria-label={maxLabel}
        aria-valuetext={valueText(value.max)}
        aria-describedby={describedBy}
        onChange={(event) => {
          onChange({ min: value.min, max: Math.max(Number(event.target.value), value.min) })
        }}
      />
    </div>
  )
}
