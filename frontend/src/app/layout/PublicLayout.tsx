import { Link, Outlet } from 'react-router'
import logo from '@/assets/brand/logo.svg'
import logoMono from '@/assets/brand/logo-mono.svg'
import { SkipLink } from '@/components/ui'
import { ACCESS_URL, DOCS_URL, ExternalButtonLink, REPOSITORY_URL } from '@/features/landing'
import { MAIN_CONTENT_ID } from './RootLayout'
import styles from './PublicLayout.module.css'

// The visitor-facing shell. It has no app navbar and no account menu: nothing
// here assumes a session, which G8-1 will introduce for the app routes only.
export function PublicLayout() {
  return (
    <>
      <SkipLink targetId={MAIN_CONTENT_ID} />
      <header className={styles.header}>
        <div className={styles.bar}>
          <Link to="/" className={styles.brand}>
            <img src={logo} alt="" width={38} height={24} className={styles.logo} />
            <span>CodeExpert</span>
          </Link>
          <nav aria-label="Seções da página" className={styles.nav}>
            <ul className={styles.list}>
              <li>
                <a href="#como-funciona" className={styles.link}>
                  Como funciona
                </a>
              </li>
              <li>
                <a href="#o-que-nao-faz" className={styles.link}>
                  O que não faz
                </a>
              </li>
              <li>
                <a href={DOCS_URL} className={styles.link}>
                  Documentação
                </a>
              </li>
            </ul>
          </nav>
          <ExternalButtonLink href={ACCESS_URL} variant="primary" className={styles.cta}>
            Pedir acesso
          </ExternalButtonLink>
        </div>
      </header>
      <main id={MAIN_CONTENT_ID} tabIndex={-1} className={styles.main}>
        <Outlet />
      </main>
      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <p className={styles.footerBrand}>
            <img src={logoMono} alt="" width={38} height={24} className={styles.logo} />
            <span>CodeExpert</span>
          </p>
          <ul className={styles.footerLinks}>
            <li>
              <a href={DOCS_URL}>Documentação</a>
            </li>
            <li>
              <a href={ACCESS_URL}>Pedir acesso</a>
            </li>
            <li>
              <a href={REPOSITORY_URL}>Código no GitHub</a>
            </li>
          </ul>
        </div>
      </footer>
    </>
  )
}
