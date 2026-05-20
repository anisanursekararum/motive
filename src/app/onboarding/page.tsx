"use client";

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { importData } from '@/lib/data-management';
import { FiUploadCloud, FiInfo } from 'react-icons/fi';

export default function OnboardingPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
  }, [user, loading, router]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleImport = async () => {
    if (!selectedFile) return;
    
    setImporting(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      const result = await importData(event.target?.result as string);
      setImporting(false);
      if (result.success) {
        localStorage.setItem('hasCompletedOnboarding', 'true');
        router.push('/tasks');
      } else {
        alert("Failed to import data: " + result.error);
      }
    };
    reader.readAsText(selectedFile);
  };

  const handleSkip = () => {
    localStorage.setItem('hasCompletedOnboarding', 'true');
    router.push('/tasks');
  };

  if (loading || !user) return null;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--color-light-gray)' }}>
      <div style={{ display: 'flex', gap: '64px', maxWidth: '1000px', width: '100%', padding: '48px', alignItems: 'center' }}>
        
        {/* Left Side */}
        <div style={{ flex: 1 }}>
          <h1 style={{ color: 'var(--color-motive-dark-blue)', fontSize: '32px', marginBottom: '8px' }}>Motive</h1>
          <p style={{ color: 'var(--color-dark-gray)', marginBottom: '48px' }}>Productivity System</p>
          
          <div style={{ width: '64px', height: '64px', backgroundColor: 'var(--color-motive-light-blue)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', border: '3px solid white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ width: '12px', height: '12px', backgroundColor: 'white', borderRadius: '50%', transform: 'translate(1px, -2px) rotate(45deg)', clipPath: 'polygon(20% 0%, 0% 20%, 30% 50%, 0% 80%, 20% 100%, 50% 70%, 100% 100%, 100% 0%)' }} />
            </div>
          </div>
          
          <h2 style={{ fontSize: '32px', color: 'var(--color-motive-dark-blue)', marginBottom: '16px' }}>Login Successful</h2>
          <p style={{ color: 'var(--color-dark-gray)', lineHeight: 1.5 }}>
            Welcome to your focus center.<br/>
            Would you like to bring your previous data with you?
          </p>
        </div>

        {/* Right Side Card */}
        <div style={{ flex: 1, backgroundColor: 'white', borderRadius: '16px', padding: '40px', boxShadow: '0 8px 32px rgba(0,0,0,0.08)' }}>
          <h3 style={{ fontSize: '20px', color: 'var(--color-black)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FiUploadCloud style={{ color: 'var(--color-motive-light-blue)' }} /> Import Data
          </h3>
          <p style={{ color: 'var(--color-dark-gray)', fontSize: '14px', marginBottom: '32px', lineHeight: 1.5 }}>
            Importing your backup file will automatically restore all previous sessions, tasks, and notes. This helps you pick up exactly where you left off.
          </p>

          <div 
            onClick={() => fileInputRef.current?.click()}
            style={{ 
              border: '2px dashed rgba(74, 95, 217, 0.3)', 
              borderRadius: '12px', 
              padding: '48px 24px', 
              textAlign: 'center',
              cursor: 'pointer',
              backgroundColor: 'var(--color-light-gray)',
              marginBottom: '24px',
              transition: 'all 0.2s'
            }}
          >
            <input 
              type="file" 
              accept=".json" 
              style={{ display: 'none' }} 
              ref={fileInputRef} 
              onChange={handleFileChange}
            />
            <FiUploadCloud style={{ fontSize: '32px', color: 'var(--color-dark-gray)', marginBottom: '16px' }} />
            <div style={{ fontWeight: '600', color: 'var(--color-black)', marginBottom: '4px' }}>
              {selectedFile ? selectedFile.name : 'Drop your backup file here'}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--color-dark-gray)' }}>Only .JSON files are supported</div>
            
            {!selectedFile && (
              <Button variant="secondary" style={{ marginTop: '16px', padding: '8px 16px' }} onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}>
                Browse Files
              </Button>
            )}
          </div>

          <div style={{ display: 'flex', gap: '12px', backgroundColor: 'var(--color-light-gray)', padding: '16px', borderRadius: '8px', marginBottom: '32px' }}>
            <FiInfo style={{ color: 'var(--color-motive-light-blue)', flexShrink: 0, marginTop: '2px' }} />
            <span style={{ fontSize: '12px', color: 'var(--color-dark-gray)', lineHeight: 1.4 }}>
              This process will merge the uploaded data with your current account profile.
            </span>
          </div>

          <div style={{ display: 'flex', gap: '16px' }}>
            <Button 
              style={{ flex: 1, padding: '12px' }} 
              onClick={handleImport}
              disabled={!selectedFile || importing}
            >
              {importing ? 'Importing...' : 'Continue Import'}
            </Button>
            <Button 
              variant="secondary" 
              style={{ flex: 1, padding: '12px' }} 
              onClick={handleSkip}
            >
              Skip for now
            </Button>
          </div>
        </div>

      </div>
    </div>
  );
}
