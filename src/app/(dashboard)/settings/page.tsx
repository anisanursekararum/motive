"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { InputField } from '@/components/ui/InputField';
import { useAuth } from '@/context/AuthContext';
import { useTheme, ThemeMode } from '@/context/ThemeContext';
import { useLanguage, LanguageMode } from '@/context/LanguageContext';
import { db } from '@/lib/db';
import { exportData, importData, downloadJsonFile } from '@/lib/data-management';
import { FiUser, FiMail, FiDownload, FiTrash2, FiInfo, FiSliders, FiSun, FiMoon, FiMonitor, FiCheck, FiX, FiPlay, FiGlobe } from 'react-icons/fi';

interface HistoryItem {
  id: string;
  filename: string;
  timestamp: string;
  type: 'import' | 'export';
}

export default function SettingsPage() {
  const { user, signOut } = useAuth();
  const { theme, setTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();
  
  // Profile settings
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');
  
  // Onboarding Tour state
  const [showOnboarding, setShowOnboarding] = useState(false);

  // Backup & Import states
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importLoading, setImportLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);
  const [backupHistory, setBackupHistory] = useState<HistoryItem[]>([]);

  // Load preferences from localStorage on mount
  useEffect(() => {
    setFirstName(localStorage.getItem('profile_firstName') || '');
    setLastName(localStorage.getItem('profile_lastName') || '');
    setRecipientEmail(localStorage.getItem('settings_recipientEmail') || user?.email || '');
    
    // Sync onboarding state
    const isTourActive = localStorage.getItem('motive_tour_active') === 'true';
    setShowOnboarding(isTourActive);

    // Sync backup history
    const savedHistory = localStorage.getItem('motive_backup_history');
    if (savedHistory) {
      setBackupHistory(JSON.parse(savedHistory));
    }

    // Listener for when onboarding tour completes/closes
    const handleTourClosed = () => {
      setShowOnboarding(false);
    };
    window.addEventListener('onboardingTourClosed', handleTourClosed);
    return () => window.removeEventListener('onboardingTourClosed', handleTourClosed);
  }, [user]);

  const handleProfileSave = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('profile_firstName', firstName.trim());
    localStorage.setItem('profile_lastName', lastName.trim());
    localStorage.setItem('settings_recipientEmail', recipientEmail.trim());
    
    // Dispatch a custom event to notify top-nav layout header
    window.dispatchEvent(new Event('profileUpdate'));
    alert(language === 'id' ? 'Preferensi profil berhasil diperbarui.' : 'Profile preferences updated successfully.');
  };

  const addHistoryItem = (filename: string, type: 'import' | 'export') => {
    const newItem: HistoryItem = {
      id: crypto.randomUUID(),
      filename,
      timestamp: new Date().toISOString(),
      type
    };
    const updated = [newItem, ...backupHistory];
    setBackupHistory(updated);
    localStorage.setItem('motive_backup_history', JSON.stringify(updated));
  };

  const handleBackupExport = async () => {
    setExportLoading(true);
    try {
      const dataStr = await exportData();
      const filename = `motive_backup_${new Date().toISOString().split('T')[0]}.json`;
      downloadJsonFile(dataStr, filename);
      addHistoryItem(filename, 'export');
    } catch (error) {
      console.error(error);
      alert('Failed to export backup data.');
    } finally {
      setExportLoading(false);
    }
  };

  const handleBackupImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportLoading(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const content = event.target?.result as string;
        const result = await importData(content);
        if (result.success) {
          addHistoryItem(file.name, 'import');
          alert('Backup imported and merged successfully!');
        } else {
          alert(`Failed to import backup: ${result.error}`);
        }
      } catch (err: any) {
        alert(`Error reading backup file: ${err?.message || err}`);
      } finally {
        setImportLoading(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsText(file);
  };

  const handleClearData = async () => {
    const confirm1 = window.confirm(language === 'id' 
      ? 'PERINGATAN: Anda akan menghapus semua data lokal (tugas, catatan harian, dan ringkasan AI). Tindakan ini permanen dan tidak dapat dibatalkan kecuali Anda memiliki cadangan. Apakah Anda ingin melanjutkan?' 
      : 'WARNING: You are about to clear all local data (tasks, daily notes, and AI summaries). This action is permanent and cannot be undone unless you have a backup. Do you want to continue?');
    if (!confirm1) return;

    const confirm2 = window.confirm(language === 'id'
      ? 'Apakah Anda benar-benar yakin? Semua penyimpanan Dexie Offline lokal akan dihapus.'
      : 'Are you absolutely sure? All local offline Dexie database storage will be wiped.');
    if (!confirm2) return;

    try {
      await Promise.all([
        db.tasks.clear(),
        db.daily_notes.clear(),
        db.summaries.clear()
      ]);
      localStorage.removeItem('motive_tour_active');
      localStorage.removeItem('motive_tour_step');
      alert(language === 'id' ? 'Database lokal berhasil dibersihkan. Halaman akan dimuat ulang.' : 'Local database cleared successfully. App will reload now.');
      window.location.reload();
    } catch (error) {
      console.error(error);
      alert('Failed to fully clear local database.');
    }
  };

  const handleToggleOnboardingTour = (active: boolean) => {
    setShowOnboarding(active);
    if (active) {
      localStorage.setItem('motive_tour_active', 'true');
      localStorage.setItem('motive_tour_step', '0');
      localStorage.setItem('motive_tour_completed', 'true');
      
      // Dispatch immediately
      window.dispatchEvent(new Event('onboardingTourStarted'));
      
      // Trigger a navigation push to Tasks so tour can show
      window.location.href = '/tasks';
    } else {
      localStorage.removeItem('motive_tour_active');
      localStorage.removeItem('motive_tour_step');
    }
  };

  return (
    <div style={{ display: 'flex', gap: '32px', alignItems: 'flex-start', paddingBottom: '48px' }}>
      
      {/* Left Column: Side Info Cards */}
      <div style={{ flex: '0 0 350px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* Profile Card */}
        <Card style={{ textAlign: 'center', padding: '32px 24px', borderTop: '4px solid var(--color-motive-dark-blue)' }}>
          <div style={{ 
            width: '80px', 
            height: '80px', 
            borderRadius: '50%', 
            backgroundColor: 'var(--surface-input)', 
            color: 'var(--color-motive-light-blue)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            margin: '0 auto 16px auto',
            fontSize: '32px',
            border: '1px solid var(--border-color)'
          }}>
            <FiUser />
          </div>
          <h3 style={{ margin: '0 0 4px 0', fontSize: '18px', color: 'var(--text-primary)', fontWeight: 600 }}>
            {firstName || lastName ? `${firstName} ${lastName}`.trim() : 'Motive User'}
          </h3>
          <p style={{ margin: '0 0 24px 0', fontSize: '12px', color: 'var(--text-muted)' }}>{user?.email}</p>
          <Button variant="secondary" onClick={signOut} style={{ width: '100%', padding: '10px' }}>
            {language === 'id' ? 'Keluar Akun' : 'Sign Out'}
          </Button>
        </Card>

        {/* Motive System Architecture details */}
        <Card style={{ padding: '24px' }}>
          <h4 style={{ fontSize: '14px', color: 'var(--color-motive-light-blue)', display: 'flex', alignItems: 'center', gap: '8px', margin: '0 0 12px 0', fontWeight: 600 }}>
            <FiInfo /> {language === 'id' ? 'Penyimpanan Lokal Mandiri' : 'Local-First Storage'}
          </h4>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
            {language === 'id'
              ? 'Semua catatan tugas, jurnal emosional, dan ringkasan analisis disimpan secara mandiri di penyimpanan IndexedDB luring pada peramban Anda. Dianjurkan melakukan ekspor berkala untuk menjaga keutuhan data.'
              : 'All task logs, emotional journal details, and periodical reflections are stored securely inside your browser\'s private offline IndexedDB. Backing up periodically is highly recommended to protect your reflections.'}
          </p>
        </Card>

      </div>

      {/* Right Column: Settings Sections */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '24px' }}>

        {/* Appearance Card */}
        <Card style={{ borderTop: '4px solid var(--color-motive-dark-blue)' }}>
          <h3 style={{ fontSize: '20px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px', margin: '0 0 8px 0', fontWeight: 600 }}>
            <FiSun /> {t('appearance')}
          </h3>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '0 0 20px 0', lineHeight: 1.5 }}>
            {t('appearance_desc')}
          </p>
          <div style={{ display: 'flex', gap: '12px' }}>
            {([
              { value: 'light' as ThemeMode, label: t('light'), icon: <FiSun />, desc: theme === 'light' ? 'Active' : '' },
              { value: 'dark'  as ThemeMode, label: t('dark'),  icon: <FiMoon />, desc: theme === 'dark' ? 'Active' : '' },
              { value: 'system' as ThemeMode, label: t('system'), icon: <FiMonitor />, desc: theme === 'system' ? 'Active' : '' },
            ]).map(({ value, label, icon, desc }) => {
              const isActive = theme === value;
              return (
                <button
                  key={value}
                  onClick={() => setTheme(value)}
                  style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '16px 12px',
                    borderRadius: '12px',
                    border: isActive
                      ? '2px solid var(--color-motive-light-blue)'
                      : '2px solid var(--border-input)',
                    background: isActive
                      ? 'var(--chip-bg)'
                      : 'var(--surface-input)',
                    cursor: 'pointer',
                    transition: 'all 0.18s ease',
                    color: isActive ? 'var(--color-motive-light-blue)' : 'var(--text-secondary)',
                    fontFamily: 'inherit',
                    position: 'relative',
                  }}
                  aria-pressed={isActive}
                >
                  {isActive && (
                    <span style={{
                      position: 'absolute', top: '8px', right: '8px',
                      background: 'var(--color-motive-light-blue)',
                      color: '#fff',
                      borderRadius: '50%',
                      width: '16px', height: '16px',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '10px',
                    }}>
                      <FiCheck />
                    </span>
                  )}
                  <span style={{ fontSize: '22px' }}>{icon}</span>
                  <span style={{ fontWeight: 600, fontSize: '14px' }}>{label}</span>
                </button>
              );
            })}
          </div>
        </Card>

        {/* Preferences Form */}
        <Card style={{ borderTop: '4px solid var(--color-motive-dark-blue)' }}>
          <h3 style={{ fontSize: '20px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px', margin: '0 0 24px 0', fontWeight: 600 }}>
            <FiSliders /> {t('personal_pref')}
          </h3>
          
          <form onSubmit={handleProfileSave} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', gap: '20px' }}>
              <div style={{ flex: 1 }}>
                <InputField 
                  label={t('first_name')} 
                  value={firstName} 
                  onChange={e => setFirstName(e.target.value)} 
                  placeholder="e.g. John" 
                  style={{ width: '100%', backgroundColor: 'var(--surface-input)', border: '1px solid var(--border-input)', color: 'var(--text-primary)' }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <InputField 
                  label={t('last_name')} 
                  value={lastName} 
                  onChange={e => setLastName(e.target.value)} 
                  placeholder="e.g. Doe" 
                  style={{ width: '100%', backgroundColor: 'var(--surface-input)', border: '1px solid var(--border-input)', color: 'var(--text-primary)' }}
                />
              </div>
            </div>

            <div>
              <InputField 
                label={t('email_label')} 
                value={recipientEmail} 
                onChange={e => setRecipientEmail(e.target.value)} 
                placeholder="email@example.com" 
                type="email"
                style={{ width: '100%', backgroundColor: 'var(--surface-input)', border: '1px solid var(--border-input)', color: 'var(--text-primary)' }}
              />
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginTop: '-12px' }}>
                {t('email_desc')}
              </span>
            </div>

            {/* Language Selector inside Preferences Form */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>{t('language')}</label>
              <select
                value={language}
                onChange={e => setLanguage(e.target.value as LanguageMode)}
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-input)', fontSize: '14px', backgroundColor: 'var(--surface-input)', color: 'var(--text-primary)', outline: 'none', cursor: 'pointer' }}
              >
                <option value="en">English (EN)</option>
                <option value="id">Bahasa Indonesia (ID)</option>
              </select>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{t('language_desc')}</span>
            </div>

            {/* Onboarding Tour Launch Trigger */}
            <div style={{ padding: '16px', backgroundColor: 'var(--surface-input)', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid var(--border-color)' }}>
              <div>
                <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', display: 'block' }}>{t('onboarding_toggle')}</span>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{t('onboarding_desc')}</span>
              </div>
              <Button 
                type="button" 
                onClick={() => handleToggleOnboardingTour(true)} 
                style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 20px' }}
              >
                <FiPlay size={14} /> {language === 'id' ? 'Mulai Tur' : 'Start Tour'}
              </Button>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
              <Button type="submit" style={{ padding: '12px 32px' }}>{language === 'id' ? 'Simpan Perubahan' : 'Save Changes'}</Button>
            </div>
          </form>
        </Card>

        {/* Data Management Section */}
        <Card style={{ borderTop: '4px solid var(--color-motive-dark-blue)' }}>
          <h3 style={{ fontSize: '20px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px', margin: '0 0 8px 0', fontWeight: 600 }}>
            <FiDownload /> {t('backup_restore')}
          </h3>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '0 0 24px 0', lineHeight: 1.5 }}>
            {t('backup_desc')}
          </p>

          <div style={{ display: 'flex', gap: '16px' }}>
            <Button onClick={() => setIsBackupModalOpen(true)} style={{ flex: 1, padding: '16px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
              <FiDownload /> {language === 'id' ? 'Kelola Data Backup' : 'Manage Backup Data'}
            </Button>
          </div>
        </Card>

        {/* Danger Zone */}
        <Card style={{ borderTop: '4px solid #ef4444' }}>
          <h3 style={{ fontSize: '20px', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '8px', margin: '0 0 8px 0', fontWeight: 600 }}>
            <FiTrash2 /> {t('danger_zone')}
          </h3>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '0 0 24px 0', lineHeight: 1.5 }}>
            {t('danger_desc')}
          </p>

          <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
            <Button 
              onClick={handleClearData} 
              style={{ backgroundColor: '#ef4444', color: 'white', border: 'none', padding: '14px 28px', fontWeight: 600 }}
            >
              {t('clear_data')}
            </Button>
          </div>
        </Card>

      </div>

      {/* Data Backup Management Modal Overlay */}
      {isBackupModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          backdropFilter: 'blur(4px)',
          zIndex: 11000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: 'var(--surface-card)',
            borderRadius: '16px',
            padding: '32px',
            maxWidth: '550px',
            width: '100%',
            boxShadow: 'var(--shadow-level-2)',
            display: 'flex',
            flexDirection: 'column',
            gap: '24px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '20px', color: 'var(--text-primary)', margin: 0, fontWeight: 600 }}>
                {t('backup_restore')}
              </h3>
              <button 
                onClick={() => setIsBackupModalOpen(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
              >
                <FiX size={20} />
              </button>
            </div>

            <div style={{ display: 'flex', gap: '16px' }}>
              <Button onClick={handleBackupExport} disabled={exportLoading} style={{ flex: 1, padding: '12px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
                <FiDownload /> {exportLoading ? '...' : t('export_json')}
              </Button>
              
              <div style={{ flex: 1 }}>
                <input 
                  type="file" 
                  accept=".json" 
                  style={{ display: 'none' }} 
                  ref={fileInputRef} 
                  onChange={handleBackupImport}
                />
                <Button 
                  variant="secondary" 
                  onClick={() => fileInputRef.current?.click()} 
                  disabled={importLoading}
                  style={{ width: '100%', padding: '12px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}
                >
                  <FiGlobe /> {importLoading ? '...' : t('import_json')}
                </Button>
              </div>
            </div>

            {/* History Table */}
            <div>
              <h4 style={{ fontSize: '14px', color: 'var(--text-primary)', marginBottom: '12px', fontWeight: 600 }}>
                {t('data_history')}
              </h4>
              <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
                {backupHistory.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)', fontSize: '12px', padding: '24px', textAlign: 'center', margin: 0 }}>
                    {t('no_history')}
                  </p>
                ) : (
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ backgroundColor: 'var(--surface-input)', borderBottom: '1px solid var(--border-color)' }}>
                        <th style={{ padding: '10px' }}>{language === 'id' ? 'Nama File' : 'Filename'}</th>
                        <th style={{ padding: '10px' }}>{language === 'id' ? 'Tipe' : 'Type'}</th>
                        <th style={{ padding: '10px' }}>{language === 'id' ? 'Tanggal & Waktu' : 'Date & Time'}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {backupHistory.map((item) => (
                        <tr key={item.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                          <td style={{ padding: '10px', color: 'var(--text-primary)', fontWeight: 500, wordBreak: 'break-all' }}>{item.filename}</td>
                          <td style={{ padding: '10px' }}>
                            <span style={{
                              padding: '2px 8px',
                              borderRadius: '4px',
                              fontSize: '10px',
                              fontWeight: 600,
                              backgroundColor: item.type === 'import' ? '#d1fae5' : '#eef2ff',
                              color: item.type === 'import' ? '#059669' : 'var(--color-motive-light-blue)'
                            }}>
                              {item.type.toUpperCase()}
                            </span>
                          </td>
                          <td style={{ padding: '10px', color: 'var(--text-secondary)' }}>
                            {new Date(item.timestamp).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
              <Button variant="secondary" onClick={() => setIsBackupModalOpen(false)} style={{ padding: '10px 24px' }}>
                {t('close')}
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
