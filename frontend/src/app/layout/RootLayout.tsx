import { Outlet } from 'react-router'
import { SkipLink } from '@/components/ui'
import { Navbar } from './Navbar'
import styles from './RootLayout.module.css'

export const MAIN_CONTENT_ID = 'conteudo'

export function RootLayout() {
  return (
    <>
      <SkipLink targetId={MAIN_CONTENT_ID} />
      <Navbar />
      <main id={MAIN_CONTENT_ID} tabIndex={-1} className={styles.main}>
        <Outlet />
      </main>
    </>
  )
}
