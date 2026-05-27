"use client";

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { useLanguage } from '@/context/LanguageContext';
import { useTheme } from '@/context/ThemeContext';
import { FiShield, FiLock, FiGlobe, FiSun, FiMoon, FiMonitor, FiDatabase, FiCpu, FiDownloadCloud } from 'react-icons/fi';
import { MotiveLogo } from '@/components/ui/Logo';

const contentTranslations = {
  en: {
    logoText: "Motive",
    goToDashboard: "Go to Dashboard",
    tagline: "Local-first productivity",
    titleLine1: "Productivity",
    titleLine2: "through Reflective",
    titleLine3: "precision.",
    description: "Motive - Momentum and Reflective. One Place for Productivity and Self-Reflection. Not just a task manager, Motive unites task management, daily journaling, and AI-driven insights featuring the ERA framework (Experience, Reflection, and Action) to help you track work progress while nurturing your mental health.",
    continueGoogle: "Continue with Google",
    demoHeader: "See Motive in Action",
    demoSub: "Learn how the ERA Cycle seamlessly connects what you accomplish with how you feel to foster professional growth.",
    featuresHeader: "Your data, your sanctuary.",
    featuresSub: "We believe deep focus requires total trust. Motive is built on a local-first architecture where your reflections never leave your device unless you want them to.",
    feature1Title: "Local-First Storage",
    feature1Desc: "Experience lightning-fast performance and full offline access. Your tasks and journals are saved locally.",
    feature2Title: "Absolute Privacy",
    feature2Desc: "No trackers, no surveillance. Your entries are yours alone. We believe focus requires a distraction-free and secure environment.",
    feature3Title: "Secure AI Summarizer",
    feature3Desc: "Gemini AI analyzes daily contexts through a secured private proxy.",
    feature4Title: "Complete Portability",
    feature4Desc: "Your data, your control. Export and import your entire database locally as a JSON backup with one click anytime.",
    footerTagline: "The reflective productivity system for modern professionals.",
    footerCopyright: "© 2026 Motive. Local-first, privacy-forward.",
    themeLight: "Light Mode",
    themeDark: "Dark Mode",
    themeSystem: "System Default",

    // Mock phone
    phoneTitle: "Summaries",
    phoneSubtitle: "ERA Cycle",
    phoneExpTitle: "Experience",
    phoneExpDesc: "Deep work session was highly productive today. Completed all 5 core APIs.",
    phoneRefTitle: "Reflection",
    phoneRefDesc: "Felt isolated towards evening. Need better buffer times to prevent exhaustion.",
    phoneActTitle: "Action Plan",
    phoneActDesc: "Incorporate a 15-minute screen-free transition buffer at 5 PM starting tomorrow.",
    phoneFooter: "Motive Premium Mobile UI",

    // Challenge & Balance Section
    problemSolutionHeader: "The Challenge & Balance",
    problemTitle: "The Problem: The Busyness Trap",
    problemDesc: "Often we feel busy all day (high Productivity Velocity), yet feel empty, exhausted, or stressed because we ignore our personal lives and well-being (unbalanced Focus Split).",
    solutionTitle: "The Solution: Reflective Focus",
    solutionDesc: "Motive is designed to restore balance to your life. We do not just help you chase work targets—we give you a dedicated, beautiful space to reflect, pause, and grow in alignment.",

    // Demo extra information
    demoInfoTasksTitle: "Selesaikan (Tasks)",
    demoInfoTasksDesc: "Schedule and complete your daily tasks easily.",
    demoInfoJournalsTitle: "Refleksikan (Journals)",
    demoInfoJournalsDesc: "Write down what you feel and learn today.",
    demoInfoReportsTitle: "Bertumbuh (Reports & AI)",
    demoInfoReportsDesc: "Get visual reports and automatic AI analysis for next week's action plan.",

    // Core experience section
    coreHeader: "The Motive Ecosystem",
    coreSub: "Discover how our core components work in perfect harmony to drive productivity while honoring your mental sanctuary.",
    featTasksTitle: "Tasks (Momentum)",
    featTasksBadge: "Focused Execution",
    featTasksDesc: "This is not just a standard to-do list. Schedule, prioritize, and structure your daily activities across custom focus pillars (Work, Personal, Health, Study) to build powerful momentum.",
    featJournalsTitle: "Journals (Reflective)",
    featJournalsBadge: "Safe Sanctuary",
    featJournalsDesc: "A protected space to capture thoughts, evaluate your day, and log emotional states. Reflect safely knowing your personal notes never leave your browser.",
    featReportsTitle: "Reports (Velocity & Split)",
    featReportsBadge: "Visual Clarity",
    featReportsDesc: "Track your Weekly Productivity Velocity and visualize your Focus Split. Instantly see where your time is going—ensuring work never crowds out your health.",
    featAiTitle: "AI ERA Summaries (The Killer Feature)",
    featAiBadge: "Cognitive Synthesis",
    featAiDesc: "Our crown jewel. Gemini AI aggregates today's tasks and journals into three pillars: Accomplished, Challenges, and Action Plans. Export reports as PDF or email them directly.",

    // CTA
    ctaHeader: "Start Designing Your Balanced Days",
    ctaSub: "Join modern professionals who balance high performance with quiet self-reflection.",
    ctaButton: "Starting Motive"
  },
  id: {
    logoText: "Motive",
    goToDashboard: "Ke Dasbor",
    tagline: "Produktivitas lokal-first",
    titleLine1: "Produktivitas",
    titleLine2: "melalui presisi",
    titleLine3: "Reflektif.",
    description: "Motive - Momentum and Reflective. Satu Tempat untuk Produktivitas dan Refleksi Diri. Bukan sekadar pengelola tugas, Motive hadir menyatukan manajemen tugas, jurnal harian, dan analisis berbasis AI dengan mengusung ERA framework (Experience, Reflection, and Action) untuk membantumu melacak progres kerja sekaligus menjaga kesehatan mental.",
    continueGoogle: "Lanjutkan dengan Google",
    demoHeader: "Lihat Demo Aplikasi",
    demoSub: "Pelajari bagaimana Siklus ERA menghubungkan apa yang Anda capai dengan apa yang Anda rasakan untuk mendukung pertumbuhan profesional.",
    featuresHeader: "Data Anda, perlindungan Anda.",
    featuresSub: "Kami percaya fokus membutuhkan kepercayaan penuh. Motive dibangun dengan arsitektur local-first di mana refleksi Anda tidak pernah meninggalkan perangkat Anda kecuali Anda mengizinkannya.",
    feature1Title: "Penyimpanan Local-First",
    feature1Desc: "Nikmati performa super cepat dan akses offline penuh. Tugas dan jurnal Anda disimpan secara lokal.",
    feature2Title: "Privasi Absolut",
    feature2Desc: "Tanpa pelacak, tanpa pengawasan. Catatan Anda sepenuhnya milik Anda sendiri. Fokus membutuhkan lingkungan yang tenang dan aman.",
    feature3Title: "Ringkasan AI yang Aman",
    feature3Desc: "Gemini AI menganalisis konteks harian melalui proxy privat yang aman.",
    feature4Title: "Portabilitas Lengkap",
    feature4Desc: "Data Anda, kendali Anda. Ekspor dan impor seluruh database Anda secara lokal sebagai cadangan JSON dengan sekali klik kapan saja.",
    footerTagline: "Sistem produktivitas reflektif untuk profesional modern.",
    footerCopyright: "© 2026 Motive. Berbasis lokal, mengutamakan privasi.",
    themeLight: "Mode Terang",
    themeDark: "Mode Gelap",
    themeSystem: "Bawaan Sistem",

    // Mock phone
    phoneTitle: "Ringkasan",
    phoneSubtitle: "Siklus ERA",
    phoneExpTitle: "Pengalaman",
    phoneExpDesc: "Sesi fokus hari ini sangat produktif. Berhasil menyelesaikan 5 API utama.",
    phoneRefTitle: "Refleksi",
    phoneRefDesc: "Merasa kesepian menjelang malam. Perlu waktu istirahat yang lebih baik agar tidak jenuh.",
    phoneActTitle: "Rencana Aksi",
    phoneActDesc: "Terapkan jeda bebas layar selama 15 menit pada pukul 17.00 mulai besok.",
    phoneFooter: "UI Seluler Premium Motive",

    // Challenge & Balance Section
    problemSolutionHeader: "Tantangan & Keseimbangan",
    problemTitle: "Masalah: Jebakan Kesibukan",
    problemDesc: "Sering kali kita merasa sibuk seharian (Productivity Velocity tinggi), tapi merasa kosong atau stres karena mengabaikan kehidupan pribadi (Focus Split tidak seimbang).",
    solutionTitle: "Solusi: Fokus Reflektif",
    solutionDesc: "Motive hadir untuk menyeimbangkan keduanya. Bukan cuma mengejar target kerja, tapi juga memberi ruang yang indah untuk refleksi diri, beristirahat, dan bertumbuh secara selaras.",

    // Demo extra information
    demoInfoTasksTitle: "Selesaikan (Tasks)",
    demoInfoTasksDesc: "Jadwalkan dan tuntaskan tugas harianmu.",
    demoInfoJournalsTitle: "Refleksikan (Journals)",
    demoInfoJournalsDesc: "Tulis apa yang kamu rasakan dan pelajari hari ini.",
    demoInfoReportsTitle: "Bertumbuh (Reports & AI)",
    demoInfoReportsDesc: "Dapatkan laporan visual dan analisis AI otomatis untuk rencana aksi minggu depan.",

    // Core experience section
    coreHeader: "Ekosistem Motive",
    coreSub: "Temukan bagaimana komponen utama kami bekerja dalam harmoni yang sempurna untuk mendorong produktivitas sekaligus menjaga ruang refleksi mental Anda.",
    featTasksTitle: "Tasks (Momentum)",
    featTasksBadge: "Eksekusi Terfokus",
    featTasksDesc: "Jangan sebut ini sekadar daftar tugas biasa. Fitur canggih untuk menjadwalkan, mengategorikan fokus (Work, Personal, Health, Study), dan membangun momentum harian yang nyata.",
    featJournalsTitle: "Journals (Reflective)",
    featJournalsBadge: "Ruang Aman",
    featJournalsDesc: "Ruang aman dan terenkripsi secara lokal untuk mencatat pikiran, mengevaluasi harimu, serta melacak keseimbangan emosional dan kesehatan mental dengan privasi penuh.",
    featReportsTitle: "Reports (Velocity & Split)",
    featReportsBadge: "Kejelasan Visual",
    featReportsDesc: "Tunjukkan visualisasi mingguan Productivity Velocity dan bagan Focus Split. Pengguna bisa melihat ke mana waktu mereka habis secara visual (apakah terlalu banyak kerja sampai melupakan kesehatan?).",
    featAiTitle: "AI ERA Summaries (The Killer Feature)",
    featAiBadge: "Sintesis Kognitif",
    featAiDesc: "Fitur andalan utama! Gemini AI merangkum jurnal dan tugas harian secara otomatis menjadi Accomplished, Challenges, dan Action Plan. Kamu juga dapat mendownloadnya sebagai PDF atau mengirimkannya langsung ke emailmu.",

    // CTA
    ctaHeader: "Mulai Desain Hari-Hari Seimbangmu",
    ctaSub: "Bergabunglah dengan profesional modern yang menyelaraskan performa tinggi dengan refleksi diri yang tenang.",
    ctaButton: "Mulai Motive Sekarang"
  }
};

const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" style={{ marginRight: '8px' }}>
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
  </svg>
);



export default function LandingPage() {
  const { user, signInWithGoogle, loading } = useAuth();
  const router = useRouter();
  const [signingIn, setSigningIn] = useState(false);
  const { language, setLanguage } = useLanguage();
  const { theme, setTheme } = useTheme();

  const t = contentTranslations[language] || contentTranslations.en;

  useEffect(() => {
    if (user && signingIn) {
      const hasCompleted = localStorage.getItem('hasCompletedOnboarding');
      if (hasCompleted) {
        router.push('/tasks');
      } else {
        router.push('/onboarding');
      }
    }
  }, [user, signingIn, router]);

  const handleLogin = async () => {
    if (user) {
      const hasCompleted = localStorage.getItem('hasCompletedOnboarding');
      if (hasCompleted) {
        router.push('/tasks');
      } else {
        router.push('/onboarding');
      }
      return;
    }

    try {
      setSigningIn(true);
      await signInWithGoogle();
    } catch (error) {
      setSigningIn(false);
      console.error(error);
    }
  };

  const cycleTheme = () => {
    if (theme === 'light') setTheme('dark');
    else if (theme === 'dark') setTheme('system');
    else setTheme('light');
  };

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'id' : 'en');
  };

  const themeIcon = theme === 'light' ? <FiSun /> : theme === 'dark' ? <FiMoon /> : <FiMonitor />;
  const themeLabel = theme === 'light' ? t.themeLight : theme === 'dark' ? t.themeDark : t.themeSystem;

  if (loading) return null;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--surface-bg)', display: 'flex', flexDirection: 'column', transition: 'background-color 0.3s ease' }}>
      <style dangerouslySetInnerHTML={{
        __html: `
        .header-btn {
          background: var(--surface-card);
          border: 1px solid var(--border-color);
          border-radius: 8px;
          color: var(--text-secondary);
          padding: 8px 12px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 6px;
          transition: all 0.2s ease;
          outline: none;
          box-shadow: var(--shadow-level-1);
        }
        .header-btn:hover {
          border-color: var(--color-motive-light-blue);
          color: var(--color-motive-light-blue);
          background: var(--surface-bg);
        }
      `}} />

      {/* Header */}
      <header style={{ display: 'flex', justifyContent: 'space-between', padding: '24px 48px', alignItems: 'center', borderBottom: '1px solid var(--divider-color)', backgroundColor: 'var(--surface-card)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }} onClick={() => router.push('/')}>
          <MotiveLogo size={36} />
          <h1 style={{ color: 'var(--text-primary)', margin: 0, fontSize: '24px', fontWeight: 'bold' }}>{t.logoText}</h1>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Language Toggle */}
          <button
            onClick={toggleLanguage}
            title={language === 'en' ? 'Switch to Bahasa Indonesia' : 'Ubah ke Bahasa Inggris'}
            className="header-btn"
            aria-label="Toggle Language"
          >
            <FiGlobe size={15} />
            <span>{language.toUpperCase()}</span>
          </button>

          {/* Theme Toggle */}
          <button
            onClick={cycleTheme}
            title={themeLabel}
            className="header-btn"
            aria-label={`Switch theme — current: ${themeLabel}`}
          >
            {themeIcon}
            <span style={{ fontSize: '11px', textTransform: 'uppercase' }}>
              {theme === 'system' ? 'SYS' : theme.toUpperCase()}
            </span>
          </button>

          {user && (
            <Button variant="secondary" onClick={() => {
              const hasCompleted = localStorage.getItem('hasCompletedOnboarding');
              router.push(hasCompleted ? '/tasks' : '/onboarding');
            }} style={{ padding: '8px 16px', fontSize: '13px', fontWeight: 'bold' }}>
              {t.goToDashboard}
            </Button>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '64px 24px' }}>
        <div style={{ maxWidth: '1200px', width: '100%', display: 'flex', gap: '48px', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 500px', maxWidth: '550px' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', backgroundColor: 'var(--chip-bg)', color: 'var(--color-motive-light-blue)', padding: '6px 14px', borderRadius: '20px', fontSize: '13px', fontWeight: '700', marginBottom: '24px' }}>
              {t.tagline}
            </div>
            <h2 style={{ fontSize: '48px', fontWeight: '800', color: 'var(--text-primary)', lineHeight: 1.15, marginBottom: '24px', letterSpacing: '-0.02em' }}>
              {t.titleLine1} <span style={{ color: 'var(--color-motive-light-blue)' }}>{t.titleLine2}</span> {t.titleLine3}
            </h2>
            <p style={{ fontSize: '16px', color: 'var(--text-secondary)', marginBottom: '32px', lineHeight: 1.6 }}>
              {t.description}
            </p>

            <div style={{ maxWidth: '380px' }}>
              <Button onClick={handleLogin} style={{ width: '100%', padding: '16px', fontSize: '16px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px', fontWeight: '700', borderRadius: '8px' }}>
                {!user && <GoogleIcon />}
                <span>{user ? t.goToDashboard : t.continueGoogle}</span>
              </Button>
            </div>
          </div>

          <div style={{ flex: '1 1 400px', display: 'flex', justifyContent: 'center' }}>
            <div style={{
              backgroundColor: 'var(--surface-card)',
              borderRadius: '28px',
              padding: '20px',
              boxShadow: 'var(--shadow-level-2)',
              border: '1px solid var(--border-color)'
            }}>
              <div style={{ width: '300px', height: '560px', backgroundColor: 'var(--color-motive-navy)', borderRadius: '24px', overflow: 'hidden', position: 'relative' }}>
                {/* Mock phone content */}
                <div style={{ padding: '24px', color: 'white', paddingTop: '48px', height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                    <span style={{ fontSize: '18px', fontWeight: 'bold' }}>{t.phoneTitle}</span>
                    <span style={{ fontSize: '11px', opacity: 0.6 }}>{t.phoneSubtitle}</span>
                  </div>
                  <div style={{ backgroundColor: 'rgba(255,255,255,0.06)', padding: '16px', borderRadius: '12px', marginBottom: '12px', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <div style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--color-motive-light-blue)', textTransform: 'uppercase', marginBottom: '4px', letterSpacing: '0.05em' }}>{t.phoneExpTitle}</div>
                    <div style={{ fontSize: '13px', opacity: 0.9, lineHeight: 1.4 }}>{t.phoneExpDesc}</div>
                  </div>
                  <div style={{ backgroundColor: 'rgba(255,255,255,0.06)', padding: '16px', borderRadius: '12px', marginBottom: '12px', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#fbbf24', textTransform: 'uppercase', marginBottom: '4px', letterSpacing: '0.05em' }}>{t.phoneRefTitle}</div>
                    <div style={{ fontSize: '13px', opacity: 0.9, lineHeight: 1.4 }}>{t.phoneRefDesc}</div>
                  </div>
                  <div style={{ backgroundColor: 'rgba(255,255,255,0.06)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#34d399', textTransform: 'uppercase', marginBottom: '4px', letterSpacing: '0.05em' }}>{t.phoneActTitle}</div>
                    <div style={{ fontSize: '13px', opacity: 0.9, lineHeight: 1.4 }}>{t.phoneActDesc}</div>
                  </div>

                  <div style={{ marginTop: 'auto', textAlign: 'center', fontSize: '11px', opacity: 0.4 }}>
                    {t.phoneFooter}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* The Challenge & Balance (Problem & Solution) Section */}
        <div style={{ marginTop: '120px', maxWidth: '1000px', width: '100%', textAlign: 'center' }}>
          <h3 style={{ fontSize: '32px', color: 'var(--text-primary)', marginBottom: '40px', fontWeight: '700', letterSpacing: '-0.02em' }}>
            {t.problemSolutionHeader}
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '32px', textAlign: 'left' }}>
            {/* The Problem Card */}
            <div style={{
              backgroundColor: 'var(--surface-card)',
              padding: '32px',
              borderRadius: '20px',
              boxShadow: 'var(--shadow-level-1)',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              position: 'relative',
              overflow: 'hidden'
            }}>
              <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', backgroundColor: '#ef4444' }} />
              <h4 style={{ color: '#ef4444', fontSize: '18px', fontWeight: '700', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '20px' }}>⚠️</span> {t.problemTitle}
              </h4>
              <p style={{ color: 'var(--text-secondary)', fontSize: '15px', lineHeight: 1.6, margin: 0 }}>
                {t.problemDesc}
              </p>
            </div>

            {/* The Solution Card */}
            <div style={{
              backgroundColor: 'var(--surface-card)',
              padding: '32px',
              borderRadius: '20px',
              boxShadow: 'var(--shadow-level-1)',
              border: '1px solid rgba(74, 95, 217, 0.2)',
              position: 'relative',
              overflow: 'hidden'
            }}>
              <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', backgroundColor: 'var(--color-motive-light-blue)' }} />
              <h4 style={{ color: 'var(--color-motive-light-blue)', fontSize: '18px', fontWeight: '700', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '20px' }}>✨</span> {t.solutionTitle}
              </h4>
              <p style={{ color: 'var(--text-secondary)', fontSize: '15px', lineHeight: 1.6, margin: 0 }}>
                {t.solutionDesc}
              </p>
            </div>
          </div>
        </div>

        {/* YouTube Video Demo Section */}
        <div style={{
          marginTop: '120px',
          maxWidth: '1000px',
          width: '100%',
          textAlign: 'center',
          backgroundColor: 'var(--surface-card)',
          padding: '48px 32px',
          borderRadius: '24px',
          boxShadow: 'var(--shadow-level-1)',
          border: '1px solid var(--border-color)',
          transition: 'all 0.3s ease'
        }}>
          <h3 style={{ fontSize: '28px', color: 'var(--text-primary)', marginBottom: '12px', fontWeight: '700', letterSpacing: '-0.01em' }}>
            {t.demoHeader}
          </h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '32px', fontSize: '15px', maxWidth: '600px', margin: '0 auto 32px auto', lineHeight: 1.6 }}>
            {t.demoSub}
          </p>

          <div style={{
            position: 'relative',
            width: '100%',
            paddingBottom: '56.25%', /* 16:9 Aspect Ratio */
            height: 0,
            overflow: 'hidden',
            borderRadius: '16px',
            boxShadow: 'var(--shadow-level-2)',
            backgroundColor: '#000',
            border: '1px solid var(--border-color)',
          }}>
            <iframe
              src="https://www.youtube.com/embed/J86kq1aUwlQ?autoplay=1&mute=1&loop=1&playlist=J86kq1aUwlQ"
              title="Motive Application Demo"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                border: 0,
                borderRadius: '16px',
              }}
            />
          </div>

          {/* YouTube Section 3-Column Info Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '24px', marginTop: '48px', textAlign: 'left' }}>
            <div style={{ padding: '24px', backgroundColor: 'var(--surface-bg)', borderRadius: '16px', border: '1px solid var(--border-color)', transition: 'all 0.2s ease' }}>
              <h4 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px', marginTop: 0 }}>
                <span style={{ fontSize: '18px' }}>✅</span> {t.demoInfoTasksTitle}
              </h4>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
                {t.demoInfoTasksDesc}
              </p>
            </div>
            <div style={{ padding: '24px', backgroundColor: 'var(--surface-bg)', borderRadius: '16px', border: '1px solid var(--border-color)', transition: 'all 0.2s ease' }}>
              <h4 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px', marginTop: 0 }}>
                <span style={{ fontSize: '18px' }}>📝</span> {t.demoInfoJournalsTitle}
              </h4>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
                {t.demoInfoJournalsDesc}
              </p>
            </div>
            <div style={{ padding: '24px', backgroundColor: 'var(--surface-bg)', borderRadius: '16px', border: '1px solid var(--border-color)', transition: 'all 0.2s ease' }}>
              <h4 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px', marginTop: 0 }}>
                <span style={{ fontSize: '18px' }}>📈</span> {t.demoInfoReportsTitle}
              </h4>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
                {t.demoInfoReportsDesc}
              </p>
            </div>
          </div>
        </div>

        {/* Core Experience Ecosystem Section */}
        <div style={{ marginTop: '120px', maxWidth: '1000px', width: '100%' }}>
          <div style={{ textAlign: 'center', marginBottom: '56px' }}>
            <h3 style={{ fontSize: '32px', color: 'var(--text-primary)', marginBottom: '16px', fontWeight: '700', letterSpacing: '-0.02em' }}>
              {t.coreHeader}
            </h3>
            <p style={{ color: 'var(--text-secondary)', maxWidth: '700px', margin: '0 auto', fontSize: '16px', lineHeight: 1.6 }}>
              {t.coreSub}
            </p>
          </div>

          <div style={{ display: 'flex', gap: '48px', alignItems: 'stretch', flexWrap: 'wrap' }}>
            {/* Features List */}
            <div style={{ flex: '1 1 500px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {/* Tasks feature */}
              <div style={{ backgroundColor: 'var(--surface-card)', padding: '24px', borderRadius: '16px', boxShadow: 'var(--shadow-level-1)', border: '1px solid var(--border-color)', position: 'relative' }}>
                <span style={{ position: 'absolute', top: '16px', right: '16px', fontSize: '11px', fontWeight: 'bold', color: 'var(--color-motive-light-blue)', backgroundColor: 'var(--chip-bg)', padding: '4px 8px', borderRadius: '4px' }}>
                  {t.featTasksBadge}
                </span>
                <h4 style={{ color: 'var(--text-primary)', fontSize: '18px', fontWeight: '700', marginBottom: '8px', marginTop: 0 }}>
                  {t.featTasksTitle}
                </h4>
                <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: 1.5, margin: 0 }}>
                  {t.featTasksDesc}
                </p>
              </div>

              {/* Journals feature */}
              <div style={{ backgroundColor: 'var(--surface-card)', padding: '24px', borderRadius: '16px', boxShadow: 'var(--shadow-level-1)', border: '1px solid var(--border-color)', position: 'relative' }}>
                <span style={{ position: 'absolute', top: '16px', right: '16px', fontSize: '11px', fontWeight: 'bold', color: '#fbbf24', backgroundColor: 'rgba(251, 191, 36, 0.1)', padding: '4px 8px', borderRadius: '4px' }}>
                  {t.featJournalsBadge}
                </span>
                <h4 style={{ color: 'var(--text-primary)', fontSize: '18px', fontWeight: '700', marginBottom: '8px', marginTop: 0 }}>
                  {t.featJournalsTitle}
                </h4>
                <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: 1.5, margin: 0 }}>
                  {t.featJournalsDesc}
                </p>
              </div>

              {/* Reports feature */}
              <div style={{ backgroundColor: 'var(--surface-card)', padding: '24px', borderRadius: '16px', boxShadow: 'var(--shadow-level-1)', border: '1px solid var(--border-color)', position: 'relative' }}>
                <span style={{ position: 'absolute', top: '16px', right: '16px', fontSize: '11px', fontWeight: 'bold', color: '#34d399', backgroundColor: 'rgba(52, 211, 153, 0.1)', padding: '4px 8px', borderRadius: '4px' }}>
                  {t.featReportsBadge}
                </span>
                <h4 style={{ color: 'var(--text-primary)', fontSize: '18px', fontWeight: '700', marginBottom: '8px', marginTop: 0 }}>
                  {t.featReportsTitle}
                </h4>
                <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: 1.5, margin: 0 }}>
                  {t.featReportsDesc}
                </p>
              </div>

              {/* AI summaries feature */}
              <div style={{ backgroundColor: 'var(--surface-card)', padding: '24px', borderRadius: '16px', boxShadow: 'var(--shadow-level-1)', border: '1px solid var(--color-motive-light-blue)', position: 'relative' }}>
                <span style={{ position: 'absolute', top: '16px', right: '16px', fontSize: '11px', fontWeight: 'bold', color: 'white', backgroundColor: 'var(--color-motive-light-blue)', padding: '4px 8px', borderRadius: '4px' }}>
                  {t.featAiBadge}
                </span>
                <h4 style={{ color: 'var(--text-primary)', fontSize: '18px', fontWeight: '700', marginBottom: '8px', marginTop: 0 }}>
                  ✨ {t.featAiTitle}
                </h4>
                <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: 1.5, margin: 0 }}>
                  {t.featAiDesc}
                </p>
              </div>
            </div>

            {/* Interactive Media Sidebar Mockup */}
            <div style={{ flex: '1 1 350px', display: 'flex', flexDirection: 'column', gap: '24px', justifyContent: 'center' }}>
              <div style={{
                backgroundColor: 'var(--surface-card)',
                borderRadius: '24px',
                padding: '24px',
                boxShadow: 'var(--shadow-level-2)',
                border: '1px solid var(--border-color)',
                display: 'flex',
                flexDirection: 'column',
                gap: '24px'
              }}>
                {/* Productivity Velocity Mini-Widget */}
                <div>
                  <h5 style={{ color: 'var(--text-primary)', fontSize: '14px', fontWeight: 'bold', margin: '0 0 16px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>📈 Productivity Velocity</span>
                    <span style={{ color: 'var(--color-motive-light-blue)', fontSize: '12px' }}>+24% this week</span>
                  </h5>
                  <div style={{ display: 'flex', alignItems: 'flex-end', height: '120px', gap: '12px', borderBottom: '1px solid var(--divider-color)', paddingBottom: '8px', paddingLeft: '8px', paddingRight: '8px' }}>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '100%', height: '40px', backgroundColor: 'var(--chip-bg)', borderRadius: '4px', transition: 'height 0.3s ease' }}></div>
                      <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>M</span>
                    </div>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '100%', height: '70px', backgroundColor: 'var(--chip-bg)', borderRadius: '4px' }}></div>
                      <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>T</span>
                    </div>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '100%', height: '55px', backgroundColor: 'var(--chip-bg)', borderRadius: '4px' }}></div>
                      <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>W</span>
                    </div>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '100%', height: '95px', backgroundColor: 'var(--color-motive-light-blue)', borderRadius: '4px' }}></div>
                      <span style={{ fontSize: '10px', color: 'var(--text-primary)', fontWeight: 'bold' }}>T</span>
                    </div>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '100%', height: '45px', backgroundColor: 'var(--chip-bg)', borderRadius: '4px' }}></div>
                      <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>F</span>
                    </div>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '100%', height: '20px', backgroundColor: 'var(--chip-bg)', borderRadius: '4px' }}></div>
                      <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>S</span>
                    </div>
                  </div>
                </div>

                {/* Focus Split Mini-Widget */}
                <div>
                  <h5 style={{ color: 'var(--text-primary)', fontSize: '14px', fontWeight: 'bold', margin: '0 0 12px 0' }}>
                    🎯 Focus Split Ratios
                  </h5>
                  {/* Custom Color Bar Split */}
                  <div style={{ height: '16px', borderRadius: '8px', display: 'flex', overflow: 'hidden', marginBottom: '16px' }}>
                    <div style={{ width: '55%', backgroundColor: 'var(--color-motive-dark-blue)' }} title="Work: 55%"></div>
                    <div style={{ width: '20%', backgroundColor: '#4a5fd9' }} title="Study: 20%"></div>
                    <div style={{ width: '15%', backgroundColor: '#fbbf24' }} title="Personal: 15%"></div>
                    <div style={{ width: '10%', backgroundColor: '#34d399' }} title="Health: 10%"></div>
                  </div>
                  {/* Legends */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', fontSize: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)' }}>
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--color-motive-dark-blue)' }}></div>
                      <span>Work (55%)</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)' }}>
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#4a5fd9' }}></div>
                      <span>Study (20%)</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)' }}>
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#fbbf24' }}></div>
                      <span>Personal (15%)</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)' }}>
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#34d399' }}></div>
                      <span>Health (10%)</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Features Highlight Grid Section */}
        <div style={{ marginTop: '120px', textAlign: 'center', maxWidth: '1000px', width: '100%' }}>
          <h3 style={{ fontSize: '32px', color: 'var(--text-primary)', marginBottom: '16px', fontWeight: '700', letterSpacing: '-0.02em' }}>
            {t.featuresHeader}
          </h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '56px', maxWidth: '700px', margin: '0 auto 56px auto', fontSize: '16px', lineHeight: 1.6 }}>
            {t.featuresSub}
          </p>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '24px',
            textAlign: 'left'
          }}>
            {/* Feature 1 */}
            <div style={{
              backgroundColor: 'var(--surface-card)',
              padding: '32px 24px',
              borderRadius: '16px',
              boxShadow: 'var(--shadow-level-1)',
              border: '1px solid var(--border-color)',
              transition: 'all 0.3s ease',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px'
            }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = 'var(--shadow-level-2)';
                e.currentTarget.style.borderColor = 'var(--color-motive-light-blue)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'none';
                e.currentTarget.style.boxShadow = 'var(--shadow-level-1)';
                e.currentTarget.style.borderColor = 'var(--border-color)';
              }}
            >
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: 'var(--chip-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <FiDatabase size={24} style={{ color: 'var(--color-motive-light-blue)' }} />
              </div>
              <h4 style={{ color: 'var(--text-primary)', fontSize: '18px', fontWeight: '700', margin: 0 }}>
                {t.feature1Title}
              </h4>
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: 1.5, margin: 0 }}>
                {t.feature1Desc}
              </p>
            </div>

            {/* Feature 2 */}
            <div style={{
              backgroundColor: 'var(--surface-card)',
              padding: '32px 24px',
              borderRadius: '16px',
              boxShadow: 'var(--shadow-level-1)',
              border: '1px solid var(--border-color)',
              transition: 'all 0.3s ease',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px'
            }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = 'var(--shadow-level-2)';
                e.currentTarget.style.borderColor = 'var(--color-motive-light-blue)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'none';
                e.currentTarget.style.boxShadow = 'var(--shadow-level-1)';
                e.currentTarget.style.borderColor = 'var(--border-color)';
              }}
            >
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: 'var(--chip-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <FiShield size={24} style={{ color: 'var(--color-motive-light-blue)' }} />
              </div>
              <h4 style={{ color: 'var(--text-primary)', fontSize: '18px', fontWeight: '700', margin: 0 }}>
                {t.feature2Title}
              </h4>
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: 1.5, margin: 0 }}>
                {t.feature2Desc}
              </p>
            </div>

            {/* Feature 3 */}
            <div style={{
              backgroundColor: 'var(--surface-card)',
              padding: '32px 24px',
              borderRadius: '16px',
              boxShadow: 'var(--shadow-level-1)',
              border: '1px solid var(--border-color)',
              transition: 'all 0.3s ease',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px'
            }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = 'var(--shadow-level-2)';
                e.currentTarget.style.borderColor = 'var(--color-motive-light-blue)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'none';
                e.currentTarget.style.boxShadow = 'var(--shadow-level-1)';
                e.currentTarget.style.borderColor = 'var(--border-color)';
              }}
            >
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: 'var(--chip-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <FiCpu size={24} style={{ color: 'var(--color-motive-light-blue)' }} />
              </div>
              <h4 style={{ color: 'var(--text-primary)', fontSize: '18px', fontWeight: '700', margin: 0 }}>
                {t.feature3Title}
              </h4>
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: 1.5, margin: 0 }}>
                {t.feature3Desc}
              </p>
            </div>

            {/* Feature 4 */}
            <div style={{
              backgroundColor: 'var(--surface-card)',
              padding: '32px 24px',
              borderRadius: '16px',
              boxShadow: 'var(--shadow-level-1)',
              border: '1px solid var(--border-color)',
              transition: 'all 0.3s ease',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px'
            }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = 'var(--shadow-level-2)';
                e.currentTarget.style.borderColor = 'var(--color-motive-light-blue)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'none';
                e.currentTarget.style.boxShadow = 'var(--shadow-level-1)';
                e.currentTarget.style.borderColor = 'var(--border-color)';
              }}
            >
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: 'var(--chip-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <FiDownloadCloud size={24} style={{ color: 'var(--color-motive-light-blue)' }} />
              </div>
              <h4 style={{ color: 'var(--text-primary)', fontSize: '18px', fontWeight: '700', margin: 0 }}>
                {t.feature4Title}
              </h4>
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: 1.5, margin: 0 }}>
                {t.feature4Desc}
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Call to Action Section */}
        <div style={{
          marginTop: '120px',
          marginBottom: '40px',
          maxWidth: '1000px',
          width: '100%',
          textAlign: 'center',
          backgroundColor: 'var(--surface-card)',
          padding: '56px 40px',
          borderRadius: '24px',
          boxShadow: 'var(--shadow-level-2)',
          border: '1px solid var(--color-motive-light-blue)',
          boxSizing: 'border-box'
        }}>
          <h3 style={{ fontSize: '32px', color: 'var(--text-primary)', marginBottom: '16px', fontWeight: '700', letterSpacing: '-0.02em', marginTop: 0 }}>
            {t.ctaHeader}
          </h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '32px', fontSize: '16px', maxWidth: '580px', margin: '0 auto 32px auto', lineHeight: 1.6 }}>
            {t.ctaSub}
          </p>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <Button onClick={handleLogin} style={{ padding: '16px 36px', fontSize: '16px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px', fontWeight: '700', borderRadius: '8px' }}>
              {!user && <GoogleIcon />}
              <span>{user ? t.goToDashboard : t.ctaButton}</span>
            </Button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer style={{ padding: '48px 24px', borderTop: '1px solid var(--divider-color)', backgroundColor: 'var(--surface-card)', display: 'flex', justifyContent: 'center', transition: 'background-color 0.3s ease' }}>
        <div style={{ maxWidth: '1200px', width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '24px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <MotiveLogo size={28} />
              <span style={{ fontWeight: 'bold', color: 'var(--text-primary)', fontSize: '18px' }}>{t.logoText}</span>
            </div>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)', maxWidth: '300px', lineHeight: 1.5 }}>{t.footerTagline}</div>
          </div>
          <div style={{ fontSize: '13px', color: 'var(--text-muted)', alignSelf: 'flex-end' }}>
            {t.footerCopyright}
          </div>
        </div>
      </footer>
    </div>
  );
}
