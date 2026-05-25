"use client";

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { FiShield, FiLock } from 'react-icons/fi';

export default function LandingPage() {
  const { user, signInWithGoogle, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      // Check if user has completed onboarding
      const hasCompleted = localStorage.getItem('hasCompletedOnboarding');
      if (hasCompleted) {
        router.push('/tasks');
      } else {
        router.push('/onboarding');
      }
    }
  }, [user, loading, router]);

  const handleLogin = async () => {
    try {
      await signInWithGoogle();
    } catch (error) {
      console.error(error);
    }
  };

  if (loading) return null;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--surface-bg)', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <header style={{ display: 'flex', justifyContent: 'space-between', padding: '24px 48px', alignItems: 'center' }}>
        <h1 style={{ color: 'var(--logo-color)', margin: 0, fontSize: '24px' }}>Motive</h1>
      </header>

      {/* Hero Section */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '64px 24px' }}>
        <div style={{ maxWidth: '1200px', width: '100%', display: 'flex', gap: '48px', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ flex: 1, maxWidth: '500px' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', backgroundColor: 'var(--color-motive-light-blue)', color: 'white', padding: '4px 12px', borderRadius: '16px', fontSize: '12px', fontWeight: 'bold', marginBottom: '24px' }}>
              Local-first productivity
            </div>
            <h2 style={{ fontSize: '48px', fontWeight: 'bold', color: 'var(--color-motive-dark-blue)', lineHeight: 1.1, marginBottom: '24px' }}>
              Productivity
            </h2>
            <h2 style={{ fontSize: '48px', fontWeight: 'bold', color: 'var(--color-motive-dark-blue)', lineHeight: 1.1, marginBottom: '24px' }}>
              through <span style={{ color: 'var(--color-motive-light-blue)' }}>Reflective</span>
            </h2>
            <h2 style={{ fontSize: '48px', fontWeight: 'bold', color: 'var(--color-motive-light-blue)', lineHeight: 1.1, marginBottom: '24px' }}>
              precision.
            </h2>
            <p style={{ fontSize: '16px', color: 'var(--text-secondary)', marginBottom: '32px', lineHeight: 1.5 }}>
              Motive isn't just a task manager. It's a professional thinking system built on the ERA cycle to turn your daily actions into long-term growth.
            </p>
            <Button onClick={handleLogin} style={{ width: '100%', padding: '16px', fontSize: '16px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px' }}>
              Continue with Google
            </Button>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '16px', textAlign: 'center' }}>
              No credit card required. Private by design.
            </p>
          </div>
          <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end' }}>
            <div style={{ 
              backgroundColor: 'var(--surface-card)', 
              borderRadius: '24px', 
              padding: '16px',
              boxShadow: 'var(--shadow-level-2)'
            }}>
               <div style={{ width: '300px', height: '600px', backgroundColor: 'var(--color-motive-navy)', borderRadius: '32px', overflow: 'hidden', position: 'relative' }}>
                  {/* Mock phone content */}
                  <div style={{ padding: '24px', color: 'white', paddingTop: '48px' }}>
                     <h3 style={{ fontSize: '20px', marginBottom: '16px' }}>Summaries</h3>
                     <div style={{ backgroundColor: 'rgba(255,255,255,0.1)', padding: '16px', borderRadius: '12px', marginBottom: '12px' }}>
                        <div style={{ fontSize: '12px', opacity: 0.7 }}>Experience</div>
                        <div style={{ fontSize: '14px' }}>Deep work session was productive.</div>
                     </div>
                     <div style={{ backgroundColor: 'rgba(255,255,255,0.1)', padding: '16px', borderRadius: '12px', marginBottom: '12px' }}>
                        <div style={{ fontSize: '12px', opacity: 0.7 }}>Reflection</div>
                        <div style={{ fontSize: '14px' }}>Spare your free time as a buffer.</div>
                     </div>
                     <div style={{ backgroundColor: 'rgba(255,255,255,0.1)', padding: '16px', borderRadius: '12px', marginBottom: '12px' }}>
                        <div style={{ fontSize: '12px', opacity: 0.7 }}>Actions</div>
                        <div style={{ fontSize: '14px' }}>Check your daily time to up to date agenda.</div>
                     </div>
                  </div>
               </div>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div style={{ marginTop: '120px', textAlign: 'center', maxWidth: '800px' }}>
           <h3 style={{ fontSize: '24px', color: 'var(--color-motive-dark-blue)', marginBottom: '16px' }}>Your data, your sanctuary.</h3>
           <p style={{ color: 'var(--text-secondary)', marginBottom: '48px' }}>We believe focus requires total trust. Motive is built on a local-first architecture where your reflections never leave your device unless you want them to.</p>
           
           <div style={{ display: 'flex', gap: '24px', textAlign: 'left' }}>
              <div style={{ flex: 1, backgroundColor: 'var(--surface-card)', padding: '32px', borderRadius: '12px', boxShadow: 'var(--shadow-level-1)' }}>
                 <h4 style={{ color: 'var(--color-motive-dark-blue)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}><FiShield /> Local-First Architecture</h4>
                 <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Experience lightning-fast performance and offline access. Your data is stored on your device.</p>
              </div>
              <div style={{ flex: 1, backgroundColor: 'var(--color-motive-navy)', color: 'white', padding: '32px', borderRadius: '12px' }}>
                 <h4 style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>  <FiLock /> Private by Design</h4>
                 <p style={{ fontSize: '14px', opacity: 0.8 }}>No trackers. No analytics on your content. No selling of your habits. Just pure productivity.</p>
              </div>
           </div>
        </div>

      </main>
      
      {/* Footer */}
      <footer style={{ padding: '48px', borderTop: '1px solid var(--divider-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
         <div>
            <div style={{ fontWeight: 'bold', color: 'var(--color-motive-dark-blue)' }}>Motive</div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '8px' }}>The reflective productivity system for modern professionals.</div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '48px' }}>© 2026 Motive. Local-first, privacy-forward.</div>
         </div>
      </footer>
    </div>
  );
}
