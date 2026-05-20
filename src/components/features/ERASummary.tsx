"use client";

import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Summary } from '@/types';

export function ERASummary() {
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<Summary | null>(null);

  const todayStart = new Date();
  todayStart.setHours(0,0,0,0);
  
  const todayStr = todayStart.toISOString().split('T')[0];
  
  useLiveQuery(async () => {
    const existing = await db.summaries
      .filter(s => s.date === todayStr && s.type === 'daily')
      .first();
    if (existing) {
      setSummary(existing);
    }
  }, [todayStr]);

  const generateSummary = async () => {
    setLoading(true);
    try {
      const tasks = await db.tasks.toArray();
      const notes = await db.daily_notes.filter(n => new Date(n.timestamp) >= todayStart).toArray();
      
      const response = await fetch('/api/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tasks, notes })
      });
      
      if (!response.ok) throw new Error("Failed");
      
      const data = await response.json();
      
      const newSummary: Summary = {
        id: crypto.randomUUID(),
        date: todayStr,
        type: 'daily',
        experience: data.experience,
        reflection: data.reflection,
        action: data.action
      };
      
      await db.summaries.put(newSummary);
      setSummary(newSummary);
    } catch (err) {
      console.error(err);
      alert('Failed to generate ERA summary');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h2>ERA Cycle Insights</h2>
        <Button onClick={generateSummary} disabled={loading} variant="secondary">
          {loading ? 'Analyzing...' : 'Generate Today\'s ERA'}
        </Button>
      </div>
      
      {summary ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ padding: '16px', backgroundColor: 'var(--color-light-gray)', borderRadius: '8px' }}>
            <h4 style={{ color: 'var(--color-motive-navy)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '24px', height: '24px', backgroundColor: 'var(--color-white)', borderRadius: '50%', fontSize: '12px', fontWeight: 'bold' }}>E</span>
              Experience
            </h4>
            <p style={{ fontSize: '14px', lineHeight: '1.6', color: 'var(--color-dark-gray)' }}>{summary.experience}</p>
          </div>
          <div style={{ padding: '16px', backgroundColor: 'var(--color-light-gray)', borderRadius: '8px' }}>
            <h4 style={{ color: 'var(--color-motive-navy)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '24px', height: '24px', backgroundColor: 'var(--color-white)', borderRadius: '50%', fontSize: '12px', fontWeight: 'bold' }}>R</span>
              Reflection
            </h4>
            <p style={{ fontSize: '14px', lineHeight: '1.6', color: 'var(--color-dark-gray)' }}>{summary.reflection}</p>
          </div>
          <div style={{ padding: '16px', backgroundColor: 'var(--color-light-gray)', borderRadius: '8px' }}>
            <h4 style={{ color: 'var(--color-motive-navy)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '24px', height: '24px', backgroundColor: 'var(--color-motive-dark-blue)', color: 'var(--color-white)', borderRadius: '50%', fontSize: '12px', fontWeight: 'bold' }}>A</span>
              Action
            </h4>
            <p style={{ fontSize: '14px', lineHeight: '1.6', color: 'var(--color-dark-gray)' }}>{summary.action}</p>
          </div>
        </div>
      ) : (
        <div style={{ padding: '32px 0', textAlign: 'center', color: 'var(--color-dark-gray)' }}>
          <p>No summary generated for today.</p>
          <p style={{ fontSize: '12px', marginTop: '8px' }}>Add tasks and notes, then generate insights.</p>
        </div>
      )}
    </Card>
  );
}
