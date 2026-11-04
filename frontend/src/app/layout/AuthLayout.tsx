import { Outlet } from 'react-router'
import { SkipLink } from '@/components/ui'
import { AuthBrandPanel } from '@/features/auth'
import { MAIN_CONTENT_ID } from './RootLayout'
import styles from './AuthLayout.module.css'

// Half brand, half form. Loaded lazily from routes.tsx so neither the 3D scene
// nor the form code lands in the entry chunk of every other page.
export function AuthLayout() {
  return (
    <>
      <SkipLink targetId={MAIN_CONTENT_ID} />
      <div className={styles.shell}>
        <AuthBrandPanel />
        <main id={MAIN_CONTENT_ID} tabIndex={-1} className={styles.main}>
          <Outlet />
        </main>
      </div>
    </>
  )
}
