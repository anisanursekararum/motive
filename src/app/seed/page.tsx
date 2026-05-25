'use client';

import { useEffect, useState } from 'react';
import { db } from '@/lib/db';

export default function SeedPage() {
  const [status, setStatus] = useState<string>('⏳ Loading seed data...');
  const [details, setDetails] = useState<string[]>([]);

  useEffect(() => {
    async function seedData() {
      try {
        const res = await fetch('/seed_data.json');
        if (!res.ok) throw new Error(`Failed to fetch seed_data.json: ${res.status}`);
        const data = await res.json();

        const logs: string[] = [];

        // Clear existing data first
        await db.tasks.clear();
        await db.daily_notes.clear();
        await db.summaries.clear();
        logs.push('🗑️ Cleared existing data');

        // Import tasks
        if (data.tasks && Array.isArray(data.tasks)) {
          await db.tasks.bulkPut(data.tasks);
          logs.push(`✅ Imported ${data.tasks.length} tasks`);
        }

        // Import daily notes
        if (data.daily_notes && Array.isArray(data.daily_notes)) {
          await db.daily_notes.bulkPut(data.daily_notes);
          logs.push(`✅ Imported ${data.daily_notes.length} journal entries`);
        }

        // Import summaries
        if (data.summaries && Array.isArray(data.summaries)) {
          await db.summaries.bulkPut(data.summaries);
          logs.push(`✅ Imported ${data.summaries.length} summaries`);
        }

        setDetails(logs);
        setStatus('🎉 Seed data imported successfully!');
      } catch (err: any) {
        setStatus(`❌ Error: ${err.message}`);
      }
    }

    seedData();
  }, []);

  return (
    <div style={{ padding: '48px', fontFamily: 'Inter, sans-serif', maxWidth: 600, margin: '0 auto' }}>
      <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '16px' }}>Seed Data Import</h1>
      <p style={{ fontSize: '18px', marginBottom: '24px' }}>{status}</p>
      {details.length > 0 && (
        <ul style={{ listStyle: 'none', padding: 0, lineHeight: '2' }}>
          {details.map((d, i) => (
            <li key={i} style={{ fontSize: '16px' }}>{d}</li>
          ))}
        </ul>
      )}
      {status.startsWith('🎉') && (
        <a
          href="/"
          style={{
            display: 'inline-block',
            marginTop: '24px',
            padding: '12px 24px',
            background: '#2E3A8C',
            color: '#fff',
            borderRadius: '8px',
            textDecoration: 'none',
            fontWeight: 600,
          }}
        >
          ← Back to App
        </a>
      )}
    </div>
  );
}
