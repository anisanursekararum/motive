"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { InputField } from '@/components/ui/InputField';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/db';
import { exportData, importData, downloadJsonFile } from '@/lib/data-management';
import { FiUser, FiMail, FiDownload, FiTrash2, FiInfo, FiSliders } from 'react-icons/fi';

export default function SettingsPage() {
  const { user, signOut } = useAuth();
  
  // Profile settings
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');
  
  // Backup & Import states
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importLoading, setImportLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);

  // Load preferences from localStorage on mount
  useEffect(() => {
    setFirstName(localStorage.getItem('profile_firstName') || '');
    setLastName(localStorage.getItem('profile_lastName') || '');
    setRecipientEmail(localStorage.getItem('settings_recipientEmail') || user?.email || '');
  }, [user]);

  const handleProfileSave = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('profile_firstName', firstName.trim());
    localStorage.setItem('profile_lastName', lastName.trim());
    localStorage.setItem('settings_recipientEmail', recipientEmail.trim());
    
    // Dispatch a custom event to notify top-nav layout header
    window.dispatchEvent(new Event('profileUpdate'));
    alert('Profile preferences updated successfully.');
  };

  const handleBackupExport = async () => {
    setExportLoading(true);
    try {
      const dataStr = await exportData();
      downloadJsonFile(dataStr, `motive_backup_${new Date().toISOString().split('T')[0]}.json`);
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
    const confirm1 = window.confirm('WARNING: You are about to clear all local data (tasks, daily notes, and AI summaries). This action is permanent and cannot be undone unless you have a backup. Do you want to continue?');
    if (!confirm1) return;

    const confirm2 = window.confirm('Are you absolutely sure? Type "DELETE" in the next dialog if prompted (this will wipe your local Dexie IndexedDB completely).');
    if (!confirm2) return;

    try {
      await Promise.all([
        db.tasks.clear(),
        db.daily_notes.clear(),
        db.summaries.clear()
      ]);
      localStorage.removeItem('hasCompletedOnboarding');
      alert('Local database cleared successfully. App will reload now.');
      window.location.reload();
    } catch (error) {
      console.error(error);
      alert('Failed to fully clear local database.');
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
            backgroundColor: 'var(--color-light-gray)', 
            color: 'var(--color-motive-dark-blue)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            margin: '0 auto 16px auto',
            fontSize: '32px'
          }}>
            <FiUser />
          </div>
          <h3 style={{ margin: '0 0 4px 0', fontSize: '18px', color: 'var(--color-motive-navy)', fontWeight: 600 }}>
            {firstName || lastName ? `${firstName} ${lastName}`.trim() : 'Motive User'}
          </h3>
          <p style={{ margin: '0 0 24px 0', fontSize: '12px', color: 'var(--color-dark-gray)' }}>{user?.email}</p>
          <Button variant="secondary" onClick={signOut} style={{ width: '100%', padding: '10px' }}>Sign Out</Button>
        </Card>

        {/* Motive System Architecture details */}
        <Card style={{ padding: '24px' }}>
          <h4 style={{ fontSize: '14px', color: 'var(--color-motive-dark-blue)', display: 'flex', alignItems: 'center', gap: '8px', margin: '0 0 12px 0', fontWeight: 600 }}>
            <FiInfo /> Local-First Storage
          </h4>
          <p style={{ fontSize: '12px', color: 'var(--color-dark-gray)', lineHeight: 1.6, margin: 0 }}>
            All task logs, emotional journal details, and periodical reflections are stored securely inside your browser's private offline IndexedDB. Backing up periodically is highly recommended to protect your reflections.
          </p>
        </Card>

      </div>

      {/* Right Column: Settings Sections */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* Preferences Form */}
        <Card style={{ borderTop: '4px solid var(--color-motive-dark-blue)' }}>
          <h3 style={{ fontSize: '20px', color: 'var(--color-motive-dark-blue)', display: 'flex', alignItems: 'center', gap: '8px', margin: '0 0 24px 0', fontWeight: 600 }}>
            <FiSliders /> Personal Preferences
          </h3>
          
          <form onSubmit={handleProfileSave} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', gap: '20px' }}>
              <div style={{ flex: 1 }}>
                <InputField 
                  label="First Name" 
                  value={firstName} 
                  onChange={e => setFirstName(e.target.value)} 
                  placeholder="e.g. John" 
                  style={{ width: '100%' }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <InputField 
                  label="Last Name" 
                  value={lastName} 
                  onChange={e => setLastName(e.target.value)} 
                  placeholder="e.g. Doe" 
                  style={{ width: '100%' }}
                />
              </div>
            </div>

            <div>
              <InputField 
                label="Reports Recipient Email" 
                value={recipientEmail} 
                onChange={e => setRecipientEmail(e.target.value)} 
                placeholder="email@example.com" 
                type="email"
                style={{ width: '100%' }}
              />
              <span style={{ fontSize: '11px', color: 'var(--color-dark-gray)', display: 'block', marginTop: '-12px' }}>
                Used as the default target email when clicking "Send to Email" in reports.
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
              <Button type="submit" style={{ padding: '12px 32px' }}>Save Changes</Button>
            </div>
          </form>
        </Card>

        {/* Data Management Section */}
        <Card style={{ borderTop: '4px solid var(--color-motive-dark-blue)' }}>
          <h3 style={{ fontSize: '20px', color: 'var(--color-motive-dark-blue)', display: 'flex', alignItems: 'center', gap: '8px', margin: '0 0 8px 0', fontWeight: 600 }}>
            <FiDownload /> Data Backup & Restore
          </h3>
          <p style={{ fontSize: '13px', color: 'var(--color-dark-gray)', margin: '0 0 24px 0', lineHeight: 1.5 }}>
            Export a portable JSON file containing your entire history, or restore it on another browser or device.
          </p>

          <div style={{ display: 'flex', gap: '16px' }}>
            <Button onClick={handleBackupExport} disabled={exportLoading} style={{ flex: 1, padding: '16px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
              <FiDownload /> {exportLoading ? 'Exporting...' : 'Export Backup JSON'}
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
                style={{ width: '100%', padding: '16px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}
              >
                <FiMail /> {importLoading ? 'Importing...' : 'Import Backup JSON'}
              </Button>
            </div>
          </div>
        </Card>

        {/* Danger Zone */}
        <Card style={{ borderTop: '4px solid #ef4444' }}>
          <h3 style={{ fontSize: '20px', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '8px', margin: '0 0 8px 0', fontWeight: 600 }}>
            <FiTrash2 /> Danger Zone
          </h3>
          <p style={{ fontSize: '13px', color: 'var(--color-dark-gray)', margin: '0 0 24px 0', lineHeight: 1.5 }}>
            Permanently erase all tasks, reflections, and journals from local IndexedDB storage. This cannot be undone.
          </p>

          <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
            <Button 
              onClick={handleClearData} 
              style={{ backgroundColor: '#ef4444', color: 'white', border: 'none', padding: '14px 28px', fontWeight: 600 }}
            >
              Clear All Database Data
            </Button>
          </div>
        </Card>

      </div>
    </div>
  );
}
