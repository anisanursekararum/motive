"use client";
import React, { useState, useMemo, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { FiDownload, FiMail, FiCalendar } from 'react-icons/fi';

export function ReportsDashboard() {
  const [dateFilter, setDateFilter] = useState('This Week');
  const [aiLoading, setAiLoading] = useState(false);
  
  // Date calculation based on filter
  const dateRange = useMemo(() => {
    const end = new Date();
    const start = new Date();
    
    if (dateFilter === 'This Week') {
      start.setDate(end.getDate() - 6);
    } else if (dateFilter === 'Last Month') {
      start.setDate(end.getDate() - 29);
    } else {
      // Custom - defaulting to 7 days for now
      start.setDate(end.getDate() - 6);
    }
    
    start.setHours(0,0,0,0);
    end.setHours(23,59,59,999);
    return { start, end };
  }, [dateFilter]);

  const dateString = `${dateRange.start.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric'})} - ${dateRange.end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric'})}`;

  // Fetch data
  const tasks = useLiveQuery(async () => {
    return await db.tasks.toArray();
  }, []);

  const notes = useLiveQuery(async () => {
    return await db.daily_notes.toArray();
  }, []);

  const summaries = useLiveQuery(async () => {
    return await db.summaries.reverse().toArray();
  }, []);

  // Filter tasks and notes by dateRange
  const filteredTasks = useMemo(() => {
    if (!tasks) return [];
    return tasks.filter(t => {
      const d = new Date(t.deadline || new Date());
      return d >= dateRange.start && d <= dateRange.end;
    });
  }, [tasks, dateRange]);

  const filteredNotes = useMemo(() => {
    if (!notes) return [];
    return notes.filter(n => {
      const d = new Date(n.timestamp);
      return d >= dateRange.start && d <= dateRange.end;
    });
  }, [notes, dateRange]);

  // --- Calculate Productivity Velocity ---
  const velocityData = useMemo(() => {
    if (!filteredTasks) return [];
    
    const days = [];
    const current = new Date(dateRange.start);
    while (current <= dateRange.end) {
      days.push({
        date: new Date(current),
        label: current.toLocaleDateString('en-US', { weekday: 'short' }),
        completed: 0
      });
      current.setDate(current.getDate() + 1);
    }
    
    let displayDays = days;
    if (days.length > 14) {
       displayDays = days.slice(-7);
    }

    filteredTasks.forEach(task => {
      if (task.status === 'completed' && task.completedAt) {
        const compDate = new Date(task.completedAt);
        const dayMatch = displayDays.find(d => 
          d.date.getDate() === compDate.getDate() && 
          d.date.getMonth() === compDate.getMonth()
        );
        if (dayMatch) dayMatch.completed++;
      }
    });
    
    const maxCompleted = Math.max(...displayDays.map(d => d.completed), 1);
    
    return { data: displayDays, max: maxCompleted, total: filteredTasks.filter(t => t.status === 'completed').length };
  }, [filteredTasks, dateRange]);

  // --- Calculate Focus Split ---
  const focusSplitData = useMemo(() => {
    if (!filteredTasks) return [];
    const completed = filteredTasks.filter(t => t.status === 'completed');
    if (completed.length === 0) return [];
    
    const categories = {};
    completed.forEach(t => {
      const cat = t.category || 'Other';
      categories[cat] = (categories[cat] || 0) + 1;
    });
    
    return Object.entries(categories)
      .map(([name, count]) => ({
        name,
        count,
        percentage: Math.round((count / completed.length) * 100)
      }))
      .sort((a, b) => b.percentage - a.percentage);
  }, [filteredTasks]);

  const handleExportPDF = () => {
    window.print();
  };

  const handleSendEmail = () => {
    window.location.href = `mailto:?subject=Motive Performance Report&body=Check out my performance report for ${dateString}.`;
  };

  const generateNewERA = async () => {
    setAiLoading(true);
    try {
      const response = await fetch('/api/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          tasks: filteredTasks, 
          notes: filteredNotes,
          dateRange: dateString
        })
      });
      
      if (!response.ok) throw new Error("Failed to call API");
      
      const data = await response.json();
      
      const newSummary = {
        id: crypto.randomUUID(),
        date: new Date().toISOString(),
        dateRangeStr: dateString,
        type: 'period',
        experience: data.experience,
        reflection: data.reflection,
        action: data.action
      };
      
      await db.summaries.put(newSummary);
    } catch (err) {
      console.error(err);
      alert('Failed to generate ERA summary. Check console and API key.');
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', paddingBottom: '48px' }}>
      
      {/* Date Filter Card */}
      <Card style={{ padding: '8px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          {['This Week', 'Last Month', 'Custom'].map(f => (
            <button
              key={f}
              onClick={() => setDateFilter(f)}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: dateFilter === f ? '#e2e8f0' : 'transparent',
                color: dateFilter === f ? 'var(--color-motive-dark-blue)' : 'var(--color-dark-gray)',
                fontWeight: dateFilter === f ? 600 : 400,
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              {f}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-dark-gray)', fontSize: '14px' }}>
          <FiCalendar />
          <span>{dateString}</span>
        </div>
      </Card>

      {/* Export Card */}
      <div style={{ 
        backgroundColor: 'var(--color-motive-dark-blue)', 
        borderRadius: '12px', 
        padding: '24px 32px', 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        color: 'white'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '40px', height: '40px', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '8px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <FiDownload size={20} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>Export Performance Reports</h3>
            <p style={{ margin: 0, fontSize: '12px', color: 'rgba(255,255,255,0.7)', marginTop: '4px' }}>Generate a detailed offline copy of your weekly velocity and ERA summaries.</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <Button onClick={handleExportPDF} style={{ backgroundColor: 'white', color: 'var(--color-motive-dark-blue)', fontWeight: 600 }}>
            <FiDownload style={{ marginRight: '8px', display: 'inline' }}/> Download PDF
          </Button>
          <Button onClick={handleSendEmail} style={{ backgroundColor: 'var(--color-motive-light-blue)', color: 'white', fontWeight: 600, border: 'none' }}>
            <FiMail style={{ marginRight: '8px', display: 'inline' }}/> Send to Email
          </Button>
        </div>
      </div>

      {/* Middle Row: Velocity and Focus Split */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '24px' }}>
        
        {/* Productivity Velocity */}
        <Card style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
            <div>
              <h3 style={{ fontSize: '18px', color: 'var(--color-motive-dark-blue)', margin: '0 0 4px 0' }}>Productivity Velocity</h3>
              <p style={{ fontSize: '12px', color: 'var(--color-dark-gray)', margin: 0 }}>Output measured in completed deep-work units</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--color-motive-dark-blue)' }}>+12%</div>
              <div style={{ fontSize: '10px', color: 'var(--color-motive-light-blue)', fontWeight: 700, letterSpacing: '1px' }}>VS LAST WEEK</div>
            </div>
          </div>
          
          <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', gap: '12px', height: '160px', marginTop: 'auto' }}>
            {velocityData?.data?.map((day, i) => {
              const heightPct = day.completed === 0 ? 10 : Math.max(15, (day.completed / velocityData.max) * 100);
              const isPeak = day.completed === velocityData.max && day.completed > 0;
              return (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                  <div style={{ 
                    width: '100%', 
                    height: `${heightPct}%`, 
                    backgroundColor: isPeak ? 'var(--color-motive-light-blue)' : '#f1f5f9',
                    borderRadius: '4px 4px 0 0',
                    transition: 'height 0.3s ease'
                  }}></div>
                  <span style={{ fontSize: '12px', color: 'var(--color-dark-gray)', fontWeight: 500 }}>{day.label}</span>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Focus Split */}
        <Card>
          <h3 style={{ fontSize: '18px', color: 'var(--color-motive-dark-blue)', margin: '0 0 32px 0' }}>Focus Split</h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {focusSplitData.length === 0 ? (
              <p style={{ color: 'var(--color-dark-gray)', fontSize: '14px', textAlign: 'center' }}>No completed tasks to split.</p>
            ) : (
              focusSplitData.map((item, i) => (
                <div key={i}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '12px', fontWeight: 600 }}>
                    <span style={{ color: 'var(--color-motive-dark-blue)' }}>{item.name}</span>
                    <span style={{ color: 'var(--color-dark-gray)' }}>{item.percentage}%</span>
                  </div>
                  <div style={{ height: '8px', backgroundColor: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ 
                      height: '100%', 
                      width: `${item.percentage}%`, 
                      backgroundColor: 'var(--color-motive-light-blue)',
                      borderRadius: '4px'
                    }}></div>
                  </div>
                </div>
              ))
            )}
          </div>
          <div style={{ marginTop: '32px', textAlign: 'center', fontSize: '10px', color: 'var(--color-dark-gray)' }}>
            AI classified based on categories
          </div>
        </Card>
      </div>

      {/* ERA Summaries */}
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
          <div>
            <h3 style={{ fontSize: '18px', color: 'var(--color-motive-dark-blue)', margin: '0 0 4px 0' }}>ERA Summaries</h3>
            <p style={{ fontSize: '12px', color: 'var(--color-dark-gray)', margin: 0 }}>Executive Reflection & Analysis (AI Generated)</p>
          </div>
          <Button onClick={generateNewERA} disabled={aiLoading} style={{ backgroundColor: '#eef2ff', color: 'var(--color-motive-dark-blue)', fontWeight: 600, border: 'none' }}>
            {aiLoading ? 'GENERATING...' : 'GENERATE REPORT'}
          </Button>
        </div>

        {/* Display the most recent summary as the "Weekly Comprehensive ERA" */}
        {summaries && summaries.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Featured Latest Summary */}
            <div style={{ paddingBottom: '24px', borderBottom: '1px solid #f1f5f9' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-motive-dark-blue)', fontWeight: 600, fontSize: '12px', marginBottom: '16px', letterSpacing: '0.5px' }}>
                <FiDownload /> WEEKLY COMPREHENSIVE ERA ({summaries[0].dateRangeStr || 'Recent'})
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '24px' }}>
                <div>
                  <h4 style={{ fontSize: '10px', color: 'var(--color-motive-light-blue)', fontWeight: 700, letterSpacing: '1px', marginBottom: '8px' }}>ACCOMPLISHED</h4>
                  <p style={{ fontSize: '13px', color: 'var(--color-dark-gray)', lineHeight: 1.6, margin: 0 }}>{summaries[0].experience}</p>
                </div>
                <div style={{ borderLeft: '1px solid #f1f5f9', paddingLeft: '24px' }}>
                  <h4 style={{ fontSize: '10px', color: '#dc2626', fontWeight: 700, letterSpacing: '1px', marginBottom: '8px' }}>CHALLENGES</h4>
                  <p style={{ fontSize: '13px', color: 'var(--color-dark-gray)', lineHeight: 1.6, margin: 0 }}>{summaries[0].reflection}</p>
                </div>
                <div style={{ borderLeft: '1px solid #f1f5f9', paddingLeft: '24px' }}>
                  <h4 style={{ fontSize: '10px', color: 'var(--color-motive-dark-blue)', fontWeight: 700, letterSpacing: '1px', marginBottom: '8px' }}>ACTION PLAN</h4>
                  <p style={{ fontSize: '13px', color: 'var(--color-dark-gray)', lineHeight: 1.6, margin: 0 }}>{summaries[0].action}</p>
                </div>
              </div>
            </div>

            {/* List of older summaries (mocking the list items in the design with actual data) */}
            {summaries.slice(1, 4).map((summary, idx) => {
              const d = new Date(summary.date);
              return (
                <div key={summary.id} style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '24px', paddingBottom: '24px', borderBottom: idx < 2 ? '1px solid #f1f5f9' : 'none' }}>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-motive-dark-blue)' }}>{d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric'})}</div>
                    <div style={{ fontSize: '12px', color: 'var(--color-dark-gray)' }}>{d.toLocaleDateString('en-US', { weekday: 'long' })}</div>
                  </div>
                  <div>
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                      <span style={{ fontSize: '10px', padding: '2px 8px', backgroundColor: '#eef2ff', color: 'var(--color-motive-light-blue)', fontWeight: 600, borderRadius: '4px' }}>SAVED ERA</span>
                    </div>
                    <p style={{ fontSize: '14px', color: '#1a1a1a', fontStyle: 'italic', margin: '0 0 12px 0', lineHeight: 1.5 }}>
                      "{summary.experience ? summary.experience.substring(0, 100) : 'No summary available'}..."
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{ padding: '48px 0', textAlign: 'center', color: 'var(--color-dark-gray)' }}>
            No ERA summaries generated yet. Click Generate Report to analyze your selected date range.
          </div>
        )}
      </Card>
    </div>
  );
}
