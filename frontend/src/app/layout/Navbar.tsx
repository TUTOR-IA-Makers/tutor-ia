import { Link, NavLink } from 'react-router'
import logo from '@/assets/brand/logo.svg'
import { UserMenu } from '@/features/session'
import { cx } from '@/lib/cx'
import { NAV_ITEMS } from './navItems'
import styles from './Navbar.module.css'

export function Navbar() {
  return (
    <header className={styles.header}>
      <div className={styles.bar}>
        <Link to="/biblioteca" className={styles.brand}>
          <img src={logo} alt="" width={38} height={24} className={styles.logo} />
          <span>CodeExpert</span>
        </Link>
        <nav aria-label="Principal" className={styles.nav}>
          <ul className={styles.list}>
            {NAV_ITEMS.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  className={({ isActive }) => cx(styles.link, isActive && styles.active)}
                >
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
        <div className={styles.user}>
          <UserMenu />
        </div>
      </div>
    </header>
  )
}
