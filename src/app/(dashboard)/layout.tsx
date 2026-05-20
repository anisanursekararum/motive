"use client";

import React, { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { FiCheckCircle, FiBookOpen, FiBarChart2, FiSettings, FiSearch } from 'react-icons/fi';
import styles from './dashboard.module.css';

interface DashboardContentProps {
  children: React.ReactNode;
}

function DashboardContent({ children }: DashboardContentProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [searchTerm, setSearchTerm] = useState(searchParams?.get('q') || '');
  const [profileName, setProfileName] = useState('User');

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;

    const updateName = () => {
      const savedFirst = localStorage.getItem('profile_firstName');
      const savedLast = localStorage.getItem('profile_lastName');
      if (savedFirst || savedLast) {
        setProfileName(`${savedFirst || ''} ${savedLast || ''}`.trim());
      } else if (user.displayName) {
        setProfileName(user.displayName);
      } else {
        setProfileName('User');
      }
    };

    updateName();
    window.addEventListener('profileUpdate', updateName);
    return () => window.removeEventListener('profileUpdate', updateName);
  }, [user]);

  if (!mounted || loading || !user) return <div style={{ padding: '24px' }}>Loading...</div>;

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchTerm(val);
    const params = new URLSearchParams(searchParams?.toString() || '');
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

  const hideSearch = pathname.startsWith('/reports') || pathname.startsWith('/settings');

  return (
    <div className={styles.layoutContainer}>
      <header className={styles.topNav}>
        <div className={styles.navLeft}>
          <h1 className={styles.logo}>Motive</h1>
          <span className={styles.welcomeText}>Welcome, {profileName}!</span>
        </div>
        
        {!hideSearch && (
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
        )}

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

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<div style={{ padding: '24px' }}>Loading...</div>}>
      <DashboardContent>{children}</DashboardContent>
    </Suspense>
  );
}
