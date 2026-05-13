"use client";

import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useEffect, useState, Suspense } from 'react';
import { FiCheckCircle, FiBookOpen, FiBarChart2, FiSettings, FiSearch } from 'react-icons/fi';
import styles from './dashboard.module.css';

function DashboardContent({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '');

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
  }, [user, loading, router]);

  if (!mounted || loading || !user) return <div style={{ padding: '24px' }}>Loading...</div>;

  const handleSearch = (e) => {
    const val = e.target.value;
    setSearchTerm(val);
    const params = new URLSearchParams(searchParams);
    if (val) {
      params.set('q', val);
    } else {
      params.delete('q');
    }
    router.replace(`${pathname}?${params.toString()}`);
  };

  const navLinks = [
    { href: '/tasks', label: 'Tasks', icon: <FiCheckCircle /> },
    { href: '/journals', label: 'Journals', icon: <FiBookOpen /> },
    { href: '/reports', label: 'Reports', icon: <FiBarChart2 /> },
    { href: '/settings', label: 'Settings', icon: <FiSettings /> },
  ];

  return (
    <div className={styles.layoutContainer}>
      <header className={styles.topNav}>
        <div className={styles.navLeft}>
          <h1 className={styles.logo}>Motive</h1>
          <span className={styles.welcomeText}>Welcome, {user.displayName || 'User'}!</span>
        </div>
        
        <div className={styles.searchContainer}>
          <FiSearch className={styles.searchIcon} />
          <input 
            type="text" 
            placeholder="Search..." 
            className={styles.searchInput}
            value={searchTerm}
            onChange={handleSearch}
          />
        </div>

        <nav className={styles.navLinks}>
          {navLinks.map((link) => (
            <Link 
              key={link.href} 
              href={link.href}
              className={`${styles.navItem} ${pathname.startsWith(link.href) ? styles.active : ''}`}
            >
              {link.icon}
              <span>{link.label}</span>
            </Link>
          ))}
        </nav>
      </header>

      <main className={styles.mainContent}>
        {children}
      </main>
    </div>
  );
}

export default function DashboardLayout({ children }) {
  return (
    <Suspense fallback={<div style={{ padding: '24px' }}>Loading...</div>}>
      <DashboardContent>{children}</DashboardContent>
    </Suspense>
  );
}
