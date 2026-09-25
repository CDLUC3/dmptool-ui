import React from 'react';
import { usePathname } from '@/i18n/routing';
import styles from './leftsidebar.module.scss';

const LeftSidebar: React.FC = () => {
  const pathname = usePathname();

  return (
    <div className={styles.leftSidebar}>
      <h3 className={styles.title}>Account</h3>
      <ul className={styles.menuList}>
        <li className={pathname === '/account/profile' ? styles.active : ''}>Your Profile</li>
        <li className={pathname === '/account/password' ? styles.active : ''}>Password</li>
        <li className={pathname === '/account/connections' ? styles.active : ''}>Connections</li>
        <li className={pathname === '/account/notifications' ? styles.active : ''}>Notifications</li>
        <li className={pathname === '/account/developerTools' ? styles.active : ''}>Developer Tools</li>
      </ul>
    </div>
  )
}

export default LeftSidebar;