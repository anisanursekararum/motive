"use client";

import { Button } from '@/components/ui/Button';
import { exportData, importData, downloadJsonFile } from '@/lib/data-management';
import { useRef } from 'react';

export default function SettingsPage() {
  const fileInputRef = useRef(null);

  const handleExport = async () => {
    const dataStr = await exportData();
    downloadJsonFile(dataStr);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = async (event) => {
      const result = await importData(event.target.result);
      if (result.success) {
        alert("Data imported successfully!");
        window.location.reload();
      } else {
        alert("Failed to import data: " + result.error);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div>
      <h2 style={{ color: 'var(--color-motive-dark-blue)', marginBottom: '8px' }}>Settings</h2>
      <p style={{ color: 'var(--color-dark-gray)', marginBottom: '32px' }}>Manage your account preferences and security protocols.</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
        
        {/* Left Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
            <h3 style={{ fontSize: '18px', color: 'var(--color-black)', marginBottom: '16px' }}>Profile Identity</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '14px', color: 'var(--color-dark-gray)', marginBottom: '8px' }}>First Name</label>
                <input type="text" defaultValue="Julian" style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.1)' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '14px', color: 'var(--color-dark-gray)', marginBottom: '8px' }}>Last Name</label>
                <input type="text" defaultValue="Ames" style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.1)' }} />
              </div>
            </div>
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '14px', color: 'var(--color-dark-gray)', marginBottom: '8px' }}>Email Address</label>
              <input type="email" defaultValue="julian.ames@example.com" style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.1)' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button>Save Profile Changes</Button>
            </div>
          </div>

          <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
            <h3 style={{ fontSize: '18px', color: 'var(--color-black)', marginBottom: '16px' }}>Security & Privacy</h3>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: '500' }}>Change Password</div>
                <div style={{ fontSize: '12px', color: 'var(--color-dark-gray)' }}>Ensure your account is using a long, random password.</div>
              </div>
              <Button variant="secondary">Update</Button>
            </div>
          </div>

        </div>

        {/* Right Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

          <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', borderLeft: '4px solid var(--color-motive-dark-blue)' }}>
            <h3 style={{ fontSize: '18px', color: 'var(--color-black)', marginBottom: '8px' }}>AI Reflection Service</h3>
            <p style={{ fontSize: '14px', color: 'var(--color-dark-gray)', marginBottom: '16px' }}>Configure where your daily and weekly productivity summaries are sent for reflection.</p>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '14px', color: 'var(--color-dark-gray)', marginBottom: '8px' }}>Primary Recipient Email</label>
              <input type="email" defaultValue="reflection@motive.app" style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.1)' }} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}>
                <input type="checkbox" defaultChecked /> Send daily wrap-up at 6:00 PM
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}>
                <input type="checkbox" defaultChecked /> Send weekly deep-dive on Sundays
              </label>
            </div>

            <div style={{ backgroundColor: 'var(--color-light-gray)', padding: '16px', borderRadius: '8px', fontSize: '12px', color: 'var(--color-dark-gray)' }}>
              These summaries are generated using end-to-end encrypted data processing to ensure your private notes stay private.
            </div>
          </div>

          <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
            <h3 style={{ fontSize: '18px', color: 'var(--color-black)', marginBottom: '16px' }}>Data Management</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }} onClick={handleExport}>
                <div>
                  <div style={{ fontWeight: '500' }}>Export Workspace</div>
                  <div style={{ fontSize: '12px', color: 'var(--color-dark-gray)' }}>Download all tasks and notes as JSON.</div>
                </div>
                <div>›</div>
              </div>

              <div style={{ height: '1px', backgroundColor: 'rgba(0,0,0,0.05)' }} />

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }} onClick={handleImportClick}>
                <div>
                  <div style={{ fontWeight: '500' }}>Import Workspace</div>
                  <div style={{ fontSize: '12px', color: 'var(--color-dark-gray)' }}>Restore your tasks and notes from a JSON file.</div>
                </div>
                <div>›</div>
                <input type="file" accept=".json" style={{ display: 'none' }} ref={fileInputRef} onChange={handleFileChange} />
              </div>

            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
