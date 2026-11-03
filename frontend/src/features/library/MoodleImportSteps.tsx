import { MOODLE_IMPORT_STEPS } from './moodleImport'
import styles from './MoodleImportSteps.module.css'

export function MoodleImportSteps() {
  return (
    <ol className={styles.steps}>
      {MOODLE_IMPORT_STEPS.map((step) => (
        <li key={step}>{step}</li>
      ))}
    </ol>
  )
}
