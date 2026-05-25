"use client";

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useLanguage } from '@/context/LanguageContext';
import { FiCheckCircle, FiBookOpen, FiBarChart2, FiSettings, FiArrowRight, FiArrowLeft, FiX, FiInfo } from 'react-icons/fi';

export function OnboardingTour() {
  const router = useRouter();
  const pathname = usePathname();
  const { t } = useLanguage();
  
  const [activeStep, setActiveStep] = useState<number | null>(null);

  // Synchronize and update the tour active step
  const syncTourState = () => {
    const isTourActive = localStorage.getItem('motive_tour_active') === 'true';
    const tourStepStr = localStorage.getItem('motive_tour_step');
    
    if (isTourActive && tourStepStr !== null) {
      const step = parseInt(tourStepStr, 10);
      setActiveStep(step);
    } else {
      setActiveStep(null);
    }
  };

  // Run synchronization on path change or custom launch event
  useEffect(() => {
    syncTourState();

    window.addEventListener('onboardingTourStarted', syncTourState);
    return () => window.removeEventListener('onboardingTourStarted', syncTourState);
  }, [pathname]);

  const ensureCorrectPage = (step: number) => {
    if (step === 0 || step === 1 || step === 2) {
      if (pathname !== '/tasks') router.push('/tasks');
    } else if (step === 3) {
      if (pathname !== '/journals') router.push('/journals');
    } else if (step === 4) {
      if (pathname !== '/reports') router.push('/reports');
    } else if (step === 5) {
      if (pathname !== '/settings') router.push('/settings');
    }
  };

  const handleNext = () => {
    if (activeStep === null) return;
    const nextStep = activeStep + 1;
    if (nextStep > 5) {
      handleClose();
    } else {
      localStorage.setItem('motive_tour_step', nextStep.toString());
      setActiveStep(nextStep);
      ensureCorrectPage(nextStep);
    }
  };

  const handleBack = () => {
    if (activeStep === null) return;
    const prevStep = activeStep - 1;
    if (prevStep >= 0) {
      localStorage.setItem('motive_tour_step', prevStep.toString());
      setActiveStep(prevStep);
      ensureCorrectPage(prevStep);
    }
  };

  const handleClose = () => {
    localStorage.removeItem('motive_tour_active');
    localStorage.removeItem('motive_tour_step');
    localStorage.setItem('motive_tour_completed', 'true');
    // Dispatch event to sync Settings page state if open
    window.dispatchEvent(new Event('onboardingTourClosed'));
    setActiveStep(null);
  };

  if (activeStep === null) return null;

  // Render steps details (0 is the Welcome slide)
  const steps = [
    {
      title: t('tour_welcome_title'),
      desc: t('tour_welcome_desc'),
      icon: <FiInfo size={24} />
    },
    {
      title: t('tour_step1_title'),
      desc: t('tour_step1_desc'),
      icon: <FiCheckCircle size={24} />
    },
    {
      title: t('tour_step2_title'),
      desc: t('tour_step2_desc'),
      icon: <FiCheckCircle size={24} />
    },
    {
      title: t('tour_step3_title'),
      desc: t('tour_step3_desc'),
      icon: <FiBookOpen size={24} />
    },
    {
      title: t('tour_step4_title'),
      desc: t('tour_step4_desc'),
      icon: <FiBarChart2 size={24} />
    },
    {
      title: t('tour_step5_title'),
      desc: t('tour_step5_desc'),
      icon: <FiSettings size={24} />
    }
  ];

  const currentInfo = steps[activeStep] || steps[0];
  const progressPct = (activeStep / 5) * 100;

  return (
    <div style={{
      position: 'fixed',
      bottom: '32px',
      right: '32px',
      width: '380px',
      backgroundColor: 'var(--surface-card)',
      borderRadius: '16px',
      boxShadow: 'var(--shadow-level-2)',
      borderTop: '4px solid var(--color-motive-light-blue)',
      padding: '24px',
      zIndex: 10000,
      display: 'flex',
      flexDirection: 'column',
      gap: '16px',
      animation: 'slideUp 0.3s ease-out'
    }}>
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}} />
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-motive-light-blue)' }}>
          {currentInfo.icon}
          <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase' }}>
            {t('logo')} Tour — {activeStep === 0 ? t('welcome').toUpperCase() : `${activeStep}/5`}
          </span>
        </div>
        <button 
          onClick={handleClose}
          style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
          title={t('close')}
        >
          <FiX size={18} />
        </button>
      </div>

      {/* Progress Bar */}
      <div style={{ width: '100%', height: '4px', backgroundColor: 'var(--border-color)', borderRadius: '2px', overflow: 'hidden' }}>
        <div style={{ width: `${progressPct}%`, height: '100%', backgroundColor: 'var(--color-motive-light-blue)', transition: 'width 0.3s ease' }}></div>
      </div>

      {/* Content */}
      <div>
        <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 8px 0' }}>
          {currentInfo.title}
        </h3>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
          {currentInfo.desc}
        </p>
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
        <button 
          onClick={handleClose}
          style={{ 
            background: 'none', 
            border: 'none', 
            color: 'var(--text-muted)', 
            cursor: 'pointer', 
            fontSize: '12px',
            fontWeight: 500
          }}
        >
          {t('skip_tour')}
        </button>

        <div style={{ display: 'flex', gap: '8px' }}>
          {activeStep > 0 && (
            <button
              onClick={handleBack}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '6px 12px',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--surface-input)',
                color: 'var(--text-secondary)',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              <FiArrowLeft size={14} /> {t('back')}
            </button>
          )}

          <button
            onClick={handleNext}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '6px 16px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: 'var(--color-motive-light-blue)',
              color: '#fff',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            {activeStep === 5 ? t('end_tour') : t('next')} <FiArrowRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
