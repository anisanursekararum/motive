"use client";

import React, { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { useLanguage } from '@/context/LanguageContext';
import { OnboardingTour } from '@/components/ui/OnboardingTour';
import { MotiveLogo } from '@/components/ui/Logo';
import { FiCheckCircle, FiBookOpen, FiBarChart2, FiSettings, FiSearch, FiSun, FiMoon, FiMonitor, FiGlobe, FiInfo } from 'react-icons/fi';
import styles from './dashboard.module.css';

interface DashboardContentProps {
  children: React.ReactNode;
}

function DashboardContent({ children }: DashboardContentProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading } = useAuth();
  const { theme, resolvedTheme, setTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();
  const [mounted, setMounted] = useState(false);
  const [searchTerm, setSearchTerm] = useState(searchParams?.get('q') || '');
  const [profileName, setProfileName] = useState('User');

  const cycleTheme = () => {
    if (theme === 'light') setTheme('dark');
    else if (theme === 'dark') setTheme('system');
    else setTheme('light');
  };

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'id' : 'en');
  };

  const startOnboardingTour = () => {
    localStorage.setItem('motive_tour_active', 'true');
    localStorage.setItem('motive_tour_step', '0');
    // Set completed to true so it doesn't auto-launch next time
    localStorage.setItem('motive_tour_completed', 'true');

    // Dispatch custom event to notify OnboardingTour to show instantly
    window.dispatchEvent(new Event('onboardingTourStarted'));

    if (pathname !== '/tasks') {
      router.push('/tasks');
    }
  };

  const themeIcon = theme === 'light' ? <FiSun /> : theme === 'dark' ? <FiMoon /> : <FiMonitor />;
  const themeLabel = theme === 'light' ? 'Light mode' : theme === 'dark' ? 'Dark mode' : 'System default';

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
  }, [user, loading, router]);

  // First-time login automatic tour trigger
  useEffect(() => {
    if (!mounted || loading || !user) return;

    const tourCompleted = localStorage.getItem('motive_tour_completed') === 'true';
    const tourActive = localStorage.getItem('motive_tour_active') === 'true';

    if (!tourCompleted && !tourActive) {
      // Auto launch onboarding tour!
      localStorage.setItem('motive_tour_active', 'true');
      localStorage.setItem('motive_tour_step', '0');
      localStorage.setItem('motive_tour_completed', 'true');

      // Dispatch immediately
      window.dispatchEvent(new Event('onboardingTourStarted'));

      if (pathname !== '/tasks') {
        router.push('/tasks');
      }
    }
  }, [mounted, loading, user, pathname, router]);

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
    { href: '/tasks', label: t('tasks'), icon: <FiCheckCircle /> },
    { href: '/journals', label: t('journals'), icon: <FiBookOpen /> },
    { href: '/reports', label: t('reports'), icon: <FiBarChart2 /> },
    { href: '/settings', label: t('settings'), icon: <FiSettings /> },
  ];

  const hideSearch = pathname.startsWith('/reports') || pathname.startsWith('/settings');

  return (
    <div className={styles.layoutContainer}>
      <header className={styles.topNav}>
        <div className={styles.navLeft}>
          <Link href="/" className={styles.logoLink} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <MotiveLogo size={28} />
            <h1 className={styles.logo}>{t('logo')}</h1>
          </Link>
          <span className={styles.welcomeText}>{t('welcome')}, {profileName}!</span>
        </div>

        {!hideSearch && (
          <div className={styles.searchContainer}>
            <FiSearch className={styles.searchIcon} />
            <input
              type="text"
              placeholder={t('search_placeholder')}
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

          {/* Onboarding Tour Launch Toggle Button inside TopNav */}
          <button
            className={styles.themeToggle}
            onClick={startOnboardingTour}
            title={language === 'en' ? 'Start Guided Onboarding Tour' : 'Mulai Tur Panduan Interaktif'}
            aria-label="Start Onboarding Tour"
            style={{ fontWeight: 700, fontSize: '11px', padding: '8px', gap: '6px', display: 'flex', alignItems: 'center', color: 'var(--color-motive-light-blue)' }}
          >
            <FiInfo size={14} />
            <span>{language === 'en' ? 'TOUR' : 'TUR'}</span>
          </button>

          {/* Language Toggle Button */}
          <button
            className={styles.themeToggle}
            onClick={toggleLanguage}
            title={language === 'en' ? 'Ganti ke Bahasa Indonesia' : 'Switch to English'}
            aria-label="Toggle Language"
            style={{ fontWeight: 700, fontSize: '11px', gap: '4px', display: 'flex', alignItems: 'center' }}
          >
            <FiGlobe size={14} />
            <span>{language.toUpperCase()}</span>
          </button>

          <button
            className={styles.themeToggle}
            onClick={cycleTheme}
            title={themeLabel}
            aria-label={`Switch theme — current: ${themeLabel}`}
          >
            {themeIcon}
          </button>
        </nav>
      </header>

      <main className={styles.mainContent}>
        {children}
      </main>

      {/* Onboarding Tour Overlay */}
      <OnboardingTour />
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
