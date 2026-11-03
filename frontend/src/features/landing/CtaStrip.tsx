import { ArrowRight } from 'lucide-react'
import { ExternalButtonLink } from './ExternalButtonLink'
import styles from './CtaStrip.module.css'
import { ACCESS_URL } from './links'

export interface CtaStripProps {
  /** Where on the page the strip sits; reported with the click event. */
  location: string
  children: string
}

export function CtaStrip({ location, children }: CtaStripProps) {
  return (
    <div className={styles.strip}>
      <p className={styles.text}>{children}</p>
      <ExternalButtonLink href={ACCESS_URL} variant="primary" icon={ArrowRight} location={location}>
        Solicitar acesso
      </ExternalButtonLink>
    </div>
  )
}
