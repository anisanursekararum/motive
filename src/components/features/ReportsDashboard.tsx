"use client";

import React, { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { FiDownload, FiMail, FiCalendar } from 'react-icons/fi';
import { useAuth } from '@/context/AuthContext';
import { Task, DailyNote, Summary } from '@/types';

interface VelocityDay {
  date: Date;
  label: string;
  completed: number;
  total: number;
}

interface FocusSplitItem {
  name: string;
  count: number;
  percentage: number;
}

export function ReportsDashboard() {
  const { user } = useAuth();
  const [dateFilter, setDateFilter] = useState('This Week');
  const [aiLoading, setAiLoading] = useState(false);
  
  // Custom date picker states (defaulting to last 6 days and today)
  const defaultStart = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 6);
    return d.toISOString().split('T')[0];
  }, []);
  const defaultEnd = useMemo(() => new Date().toISOString().split('T')[0], []);

  const [customStartDate, setCustomStartDate] = useState(defaultStart);
  const [customEndDate, setCustomEndDate] = useState(defaultEnd);

  // Date calculation based on filter
  const dateRange = useMemo((): { start: Date; end: Date } => {
    const end = new Date();
    const start = new Date();
    
    if (dateFilter === 'This Week') {
      start.setDate(end.getDate() - 6);
    } else if (dateFilter === 'Last Month') {
      start.setDate(end.getDate() - 29);
    } else {
      // Custom filter date pickers
      if (customStartDate && customEndDate) {
        const s = new Date(customStartDate);
        s.setHours(0,0,0,0);
        const e = new Date(customEndDate);
        e.setHours(23,59,59,999);
        return { start: s, end: e };
      }
      start.setDate(end.getDate() - 6);
    }
    
    start.setHours(0,0,0,0);
    end.setHours(23,59,59,999);
    return { start, end };
  }, [dateFilter, customStartDate, customEndDate]);

  const dateString = `${dateRange.start.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric'})} - ${dateRange.end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric'})}`;

  // Fetch data
  const tasks = useLiveQuery(async (): Promise<Task[]> => {
    return await db.tasks.toArray();
  }, []);

  const notes = useLiveQuery(async (): Promise<DailyNote[]> => {
    return await db.daily_notes.toArray();
  }, []);

  const summaries = useLiveQuery(async (): Promise<Summary[]> => {
    return await db.summaries.reverse().toArray();
  }, []);

  // Filter tasks and notes by dateRange
  const filteredTasks = useMemo((): Task[] => {
    if (!tasks) return [];
    return tasks.filter(t => {
      const d = new Date(t.deadline || t.createdAt || new Date());
      return d >= dateRange.start && d <= dateRange.end;
    });
  }, [tasks, dateRange]);

  const filteredNotes = useMemo((): DailyNote[] => {
    if (!notes) return [];
    return notes.filter(n => {
      const d = new Date(n.timestamp);
      return d >= dateRange.start && d <= dateRange.end;
    });
  }, [notes, dateRange]);

  // --- Calculate Productivity Velocity ---
  const velocityData = useMemo((): { data: VelocityDay[]; max: number; totalCompleted: number; totalCount: number } => {
    if (!filteredTasks) return { data: [], max: 1, totalCompleted: 0, totalCount: 0 };
    
    const days: VelocityDay[] = [];
    const current = new Date(dateRange.start);
    while (current <= dateRange.end) {
      days.push({
        date: new Date(current),
        label: current.toLocaleDateString('en-US', { weekday: 'short' }),
        completed: 0,
        total: 0
      });
      current.setDate(current.getDate() + 1);
    }
    
    let displayDays = days;
    if (days.length > 14) {
       displayDays = days.slice(-14); // keep a readable density
    }

    filteredTasks.forEach(task => {
      const taskDate = new Date(task.deadline || task.createdAt);
      const dayMatch = displayDays.find(d => 
        d.date.getDate() === taskDate.getDate() && 
        d.date.getMonth() === taskDate.getMonth() &&
        d.date.getFullYear() === taskDate.getFullYear()
      );
      if (dayMatch) {
        dayMatch.total++;
        if (task.status === 'completed') {
          dayMatch.completed++;
        }
      }
    });
    
    const maxTotal = Math.max(...displayDays.map(d => d.total), 1);
    
    return { 
      data: displayDays, 
      max: maxTotal, 
      totalCompleted: filteredTasks.filter(t => t.status === 'completed').length,
      totalCount: filteredTasks.length
    };
  }, [filteredTasks, dateRange]);

  // --- Correct Productivity Velocity Percentage VS Previous Period ---
  const velocityPercentageString = useMemo((): string => {
    if (!tasks || !dateRange) return '0%';
    
    const duration = dateRange.end.getTime() - dateRange.start.getTime();
    const prevStart = new Date(dateRange.start.getTime() - duration - 1);
    const prevEnd = new Date(dateRange.start.getTime() - 1);
    
    const currentCompleted = filteredTasks.filter(t => t.status === 'completed').length;
    
    const prevCompleted = tasks.filter(t => {
      if (t.status !== 'completed' || !t.completedAt) return false;
      const compDate = new Date(t.completedAt);
      return compDate >= prevStart && compDate <= prevEnd;
    }).length;
    
    if (prevCompleted === 0) {
      if (currentCompleted > 0) return `+${currentCompleted * 100}%`;
      return '0%';
    }
    
    const change = ((currentCompleted - prevCompleted) / prevCompleted) * 100;
    const rounded = Math.round(change);
    return rounded >= 0 ? `+${rounded}%` : `${rounded}%`;
  }, [tasks, dateRange, filteredTasks]);

  // --- Calculate Focus Split (All categories with tasks in range) ---
  const focusSplitData = useMemo((): FocusSplitItem[] => {
    if (!filteredTasks || filteredTasks.length === 0) return [];
    
    const categories: Record<string, number> = {};
    filteredTasks.forEach(t => {
      const cat = t.category || 'Other';
      categories[cat] = (categories[cat] || 0) + 1;
    });
    
    return Object.entries(categories)
      .map(([name, count]) => ({
        name,
        count,
        percentage: Math.round((count / filteredTasks.length) * 100)
      }))
      .sort((a, b) => b.percentage - a.percentage);
  }, [filteredTasks]);

  const handleExportPDF = () => {
    window.print();
  };

  const handleSendEmail = () => {
    const savedRecipient = localStorage.getItem('settings_recipientEmail') || user?.email || 'reflection@motive.app';
    
    // Construct email content
    const latestSummary = summaries && summaries.length > 0 ? summaries[0] : null;
    
    let eraText = "";
    if (latestSummary) {
      eraText = `
WEEKLY COMPREHENSIVE ERA (${latestSummary.dateRangeStr || 'Recent'}):
- Accomplished (Experience):
  ${latestSummary.experience || 'No experience details available.'}

- Challenges (Reflection):
  ${latestSummary.reflection || 'No reflection details available.'}

- Action Plan (Action):
  ${latestSummary.action || 'No action plan details available.'}
`;
    } else {
      eraText = `
WEEKLY COMPREHENSIVE ERA:
No summaries generated yet.
`;
    }

    const velocityText = velocityData.data.map(d => `- ${d.label}: ${d.completed} completed / ${d.total} total tasks`).join('\n');
    const focusText = focusSplitData.map(c => `- ${c.name}: ${c.percentage}% (${c.count} tasks)`).join('\n');

    const bodyText = `
Motive Reports for ${dateString}
Report generated on: ${new Date().toLocaleString()}

--------------------------------------------------
PRODUCTIVITY VELOCITY (Completed vs Total Tasks):
- Period Change: ${velocityPercentageString} vs previous period
${velocityText}

--------------------------------------------------
FOCUS SPLIT (Category Work distribution):
${focusText}

--------------------------------------------------
${eraText}

Generated by Motive Productivity App - Local-first & Private.
`;

    const mailtoUrl = `mailto:${savedRecipient}?subject=${encodeURIComponent(`Motive Reports for ${dateString}`)}&body=${encodeURIComponent(bodyText)}`;
    window.location.href = mailtoUrl;
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
      
      const newSummary: Summary = {
        id: crypto.randomUUID(),
        date: new Date().toISOString(),
        dateRangeStr: dateString,
        type: 'period',
        experience: data.experience,
        reflection: data.reflection,
        action: data.action,
        dailyHighlights: data.dailyHighlights || []
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
      
      {/* CSS print override injector */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body * {
            visibility: hidden;
          }
          #printableReportArea, #printableReportArea * {
            visibility: visible;
          }
          #printableReportArea {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            display: block !important;
            background: white !important;
            color: black !important;
            padding: 40px !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}} />

      {/* Printable Area - Rendered off-screen normally, visible in window.print() */}
      <div id="printableReportArea" style={{ display: 'none' }}>
        <div style={{ borderBottom: '3px solid #1A2254', paddingBottom: '16px', marginBottom: '24px' }}>
          <h1 style={{ fontSize: '28px', color: '#1A2254', margin: '0 0 8px 0' }}>Motive Reports</h1>
          <h2 style={{ fontSize: '18px', color: '#4A5FD9', margin: '0 0 8px 0' }}>Period Range: {dateString}</h2>
          <div style={{ fontSize: '12px', color: '#4a4a4a' }}>Report Generated: {new Date().toLocaleString()}</div>
        </div>

        <div style={{ marginBottom: '32px' }}>
          <h3 style={{ fontSize: '18px', color: '#1A2254', borderBottom: '1px solid #e2e8f0', paddingBottom: '6px', marginBottom: '16px' }}>Productivity Velocity</h3>
          <p style={{ fontSize: '14px', margin: '0 0 12px 0' }}>Completed vs Total tasks scheduled within range (Change vs previous period: <strong>{velocityPercentageString}</strong>):</p>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #cbd5e1', textAlign: 'left' }}>
                <th style={{ padding: '8px' }}>Day</th>
                <th style={{ padding: '8px' }}>Completed Tasks</th>
                <th style={{ padding: '8px' }}>Total Scheduled</th>
              </tr>
            </thead>
            <tbody>
              {velocityData.data.map((day, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '8px' }}>{day.label}</td>
                  <td style={{ padding: '8px', fontWeight: 'bold', color: '#1A2254' }}>{day.completed}</td>
                  <td style={{ padding: '8px' }}>{day.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ marginBottom: '32px' }}>
          <h3 style={{ fontSize: '18px', color: '#1A2254', borderBottom: '1px solid #e2e8f0', paddingBottom: '6px', marginBottom: '16px' }}>Focus Split</h3>
          <p style={{ fontSize: '14px', margin: '0 0 12px 0' }}>Total categories and percentage work splits across all schedules in range:</p>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #cbd5e1', textAlign: 'left' }}>
                <th style={{ padding: '8px' }}>Category</th>
                <th style={{ padding: '8px' }}>Task Count</th>
                <th style={{ padding: '8px' }}>Split Ratio</th>
              </tr>
            </thead>
            <tbody>
              {focusSplitData.map((c, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '8px', fontWeight: 'bold' }}>{c.name}</td>
                  <td style={{ padding: '8px' }}>{c.count} tasks</td>
                  <td style={{ padding: '8px', color: '#4A5FD9', fontWeight: 'bold' }}>{c.percentage}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div>
          <h3 style={{ fontSize: '18px', color: '#1A2254', borderBottom: '1px solid #e2e8f0', paddingBottom: '6px', marginBottom: '16px' }}>Executive Reflection & Analysis (ERA Summaries)</h3>
          {summaries && summaries.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ borderLeft: '4px solid #4A5FD9', paddingLeft: '16px' }}>
                <h4 style={{ fontSize: '13px', color: '#4A5FD9', margin: '0 0 6px 0', letterSpacing: '0.5px' }}>ACCOMPLISHED (EXPERIENCE)</h4>
                <p style={{ fontSize: '13px', margin: 0, lineHeight: '1.5' }}>{summaries[0].experience}</p>
              </div>
              <div style={{ borderLeft: '4px solid #dc2626', paddingLeft: '16px' }}>
                <h4 style={{ fontSize: '13px', color: '#dc2626', margin: '0 0 6px 0', letterSpacing: '0.5px' }}>CHALLENGES (REFLECTION)</h4>
                <p style={{ fontSize: '13px', margin: 0, lineHeight: '1.5' }}>{summaries[0].reflection}</p>
              </div>
              <div style={{ borderLeft: '4px solid #1A2254', paddingLeft: '16px' }}>
                <h4 style={{ fontSize: '13px', color: '#1A2254', margin: '0 0 6px 0', letterSpacing: '0.5px' }}>ACTION PLAN (ACTION)</h4>
                <p style={{ fontSize: '13px', margin: 0, lineHeight: '1.5' }}>{summaries[0].action}</p>
              </div>
              
              {summaries[0].dailyHighlights && summaries[0].dailyHighlights.length > 0 && (
                <div style={{ marginTop: '12px', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px' }}>
                  <h4 style={{ fontSize: '12px', color: '#1A2254', margin: '0 0 10px 0', letterSpacing: '0.5px' }}>DAILY HIGHLIGHTS OVERVIEW:</h4>
                  <ul style={{ margin: 0, paddingLeft: '20px', lineHeight: '1.6', fontSize: '12px' }}>
                    {summaries[0].dailyHighlights.map((hl, hlIdx) => (
                      <li key={hlIdx}>
                        <strong>{hl.date}:</strong> {hl.highlight}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <div style={{ fontSize: '13px', color: 'var(--color-dark-gray)' }}>No ERA Summaries generated for this range yet.</div>
          )}
        </div>
      </div>

      {/* Date Filter Card */}
      <Card className="no-print" style={{ padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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
        </div>

        {/* Conditional Custom Datepickers */}
        {dateFilter === 'Custom' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '4px', padding: '12px', backgroundColor: 'var(--color-light-gray)', borderRadius: '8px' }}>
            <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--color-dark-gray)' }}>Start Date:</label>
            <input 
              type="date" 
              value={customStartDate} 
              onChange={e => setCustomStartDate(e.target.value)} 
              style={{ padding: '6px 12px', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.15)', fontSize: '13px', outline: 'none' }} 
            />
            <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--color-dark-gray)' }}>End Date:</label>
            <input 
              type="date" 
              value={customEndDate} 
              onChange={e => setCustomEndDate(e.target.value)} 
              style={{ padding: '6px 12px', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.15)', fontSize: '13px', outline: 'none' }} 
            />
          </div>
        )}
      </Card>

      {/* Export Card */}
      <div className="no-print" style={{ 
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
      <div className="no-print" style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '24px' }}>
        
        {/* Productivity Velocity Chart Card */}
        <Card style={{ display: 'flex', flexDirection: 'column', borderTop: '4px solid var(--color-motive-dark-blue)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
            <div>
              <h3 style={{ fontSize: '18px', color: 'var(--color-motive-dark-blue)', margin: '0 0 4px 0' }}>Productivity Velocity</h3>
              <p style={{ fontSize: '12px', color: 'var(--color-dark-gray)', margin: 0 }}>Output measured in completed deep-work units</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--color-motive-dark-blue)' }}>
                {velocityPercentageString}
              </div>
              <div style={{ fontSize: '10px', color: 'var(--color-motive-light-blue)', fontWeight: 700, letterSpacing: '1px' }}>VS LAST PERIOD</div>
            </div>
          </div>
          
          {/* Dual Bar Chart rendering */}
          <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', gap: '12px', height: '160px', marginTop: 'auto' }}>
            {velocityData?.data?.map((day, i) => {
              const totalPct = day.total === 0 ? 0 : (day.total / velocityData.max) * 100;
              const completedPct = day.total === 0 ? 0 : (day.completed / velocityData.max) * 100;
              
              return (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', height: '100%', justifyContent: 'flex-end' }}>
                  {/* Cylinder overlay wrappers */}
                  <div style={{ 
                    position: 'relative', 
                    width: '100%', 
                    height: '120px', 
                    display: 'flex', 
                    alignItems: 'flex-end', 
                    justifyContent: 'center' 
                  }}>
                    {/* Total Tasks (Gray Background Bar) */}
                    <div style={{
                      position: 'absolute',
                      width: '14px',
                      height: `${totalPct}%`,
                      backgroundColor: '#cbd5e1',
                      borderRadius: '4px 4px 0 0',
                      transition: 'height 0.3s ease'
                    }} title={`Total Tasks: ${day.total}`} />
                    
                    {/* Completed Tasks (Navy Foreground Bar) */}
                    <div style={{
                      position: 'absolute',
                      width: '14px',
                      height: `${completedPct}%`,
                      backgroundColor: '#1A2254',
                      borderRadius: '4px 4px 0 0',
                      transition: 'height 0.3s ease',
                      zIndex: 2
                    }} title={`Completed Tasks: ${day.completed}`} />
                  </div>
                  <span style={{ fontSize: '11px', color: 'var(--color-dark-gray)', fontWeight: 500 }}>{day.label}</span>
                </div>
              );
            })}
          </div>
          
          <div style={{ display: 'flex', gap: '16px', marginTop: '16px', fontSize: '11px', color: 'var(--color-dark-gray)', justifyContent: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <div style={{ width: '10px', height: '10px', backgroundColor: '#1A2254', borderRadius: '2px' }}></div>
              <span>Completed Tasks</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <div style={{ width: '10px', height: '10px', backgroundColor: '#cbd5e1', borderRadius: '2px' }}></div>
              <span>Total Scheduled Tasks</span>
            </div>
          </div>
        </Card>

        {/* Focus Split */}
        <Card style={{ borderTop: '4px solid var(--color-motive-dark-blue)' }}>
          <h3 style={{ fontSize: '18px', color: 'var(--color-motive-dark-blue)', margin: '0 0 32px 0' }}>Focus Split</h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {focusSplitData.length === 0 ? (
              <p style={{ color: 'var(--color-dark-gray)', fontSize: '14px', textAlign: 'center' }}>No tasks found in this date range.</p>
            ) : (
              focusSplitData.map((item, i) => (
                <div key={i}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '12px', fontWeight: 600 }}>
                    <span style={{ color: 'var(--color-motive-dark-blue)' }}>{item.name}</span>
                    <span style={{ color: 'var(--color-dark-gray)' }}>{item.percentage}% ({item.count} tasks)</span>
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
            Categorized focus ratios based on all scheduled range tasks
          </div>
        </Card>
      </div>

      {/* ERA Summaries */}
      <Card className="no-print" style={{ borderTop: '4px solid var(--color-motive-dark-blue)' }}>
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            {/* Featured Latest Summary */}
            <div style={{ paddingBottom: '32px', borderBottom: '1px solid #f1f5f9' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-motive-dark-blue)', fontWeight: 600, fontSize: '12px', marginBottom: '16px', letterSpacing: '0.5px' }}>
                <FiDownload /> WEEKLY COMPREHENSIVE ERA ({summaries[0].dateRangeStr || 'Recent'})
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '24px' }}>
                <div>
                  <h4 style={{ fontSize: '10px', color: 'var(--color-motive-light-blue)', fontWeight: 700, letterSpacing: '1px', marginBottom: '8px' }}>ACCOMPLISHED (EXPERIENCE)</h4>
                  <p style={{ fontSize: '13px', color: 'var(--color-dark-gray)', lineHeight: 1.6, margin: 0 }}>{summaries[0].experience}</p>
                </div>
                <div style={{ borderLeft: '1px solid #f1f5f9', paddingLeft: '24px' }}>
                  <h4 style={{ fontSize: '10px', color: '#dc2626', fontWeight: 700, letterSpacing: '1px', marginBottom: '8px' }}>CHALLENGES (REFLECTION)</h4>
                  <p style={{ fontSize: '13px', color: 'var(--color-dark-gray)', lineHeight: 1.6, margin: 0 }}>{summaries[0].reflection}</p>
                </div>
                <div style={{ borderLeft: '1px solid #f1f5f9', paddingLeft: '24px' }}>
                  <h4 style={{ fontSize: '10px', color: 'var(--color-motive-dark-blue)', fontWeight: 700, letterSpacing: '1px', marginBottom: '8px' }}>ACTION PLAN (ACTION)</h4>
                  <p style={{ fontSize: '13px', color: 'var(--color-dark-gray)', lineHeight: 1.6, margin: 0 }}>{summaries[0].action}</p>
                </div>
              </div>
              
              {/* Render Daily Highlights for the latest featured summary if they exist */}
              {summaries[0].dailyHighlights && summaries[0].dailyHighlights.length > 0 && (
                <div style={{ marginTop: '24px', backgroundColor: 'var(--color-light-gray)', padding: '20px', borderRadius: '8px', borderLeft: '4px solid var(--color-motive-light-blue)' }}>
                  <h4 style={{ fontSize: '11px', color: 'var(--color-motive-dark-blue)', fontWeight: 700, letterSpacing: '1px', margin: '0 0 12px 0' }}>DAILY REFLECTION OVERVIEW</h4>
                  <ul style={{ margin: 0, paddingLeft: '16px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {summaries[0].dailyHighlights.map((hl, hlIdx) => (
                      <li key={hlIdx} style={{ fontSize: '12.5px', color: 'var(--color-dark-gray)', lineHeight: '1.4' }}>
                        <strong>{hl.date}:</strong> {hl.highlight}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* List of older summaries (un-cropped & displaying date creation and highlights) */}
            {summaries.length > 1 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <h4 style={{ fontSize: '14px', fontWeight: '700', color: 'var(--color-motive-dark-blue)', margin: '0 0 8px 0' }}>Historical Periodical Reports</h4>
                
                {summaries.slice(1, 10).map((summary, idx) => {
                  const d = new Date(summary.date);
                  return (
                    <div key={summary.id} style={{ 
                      display: 'flex', 
                      flexDirection: 'column', 
                      gap: '16px', 
                      paddingBottom: '24px', 
                      borderBottom: idx < (summaries.length - 2) ? '1px solid #f1f5f9' : 'none' 
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-motive-dark-blue)' }}>
                            {d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric'})}
                          </div>
                          <div style={{ fontSize: '12px', color: 'var(--color-dark-gray)', marginTop: '2px' }}>
                            Generated on: {d.toLocaleDateString('en-US', { weekday: 'long', hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                        <span style={{ fontSize: '10px', padding: '2px 8px', backgroundColor: '#eef2ff', color: 'var(--color-motive-light-blue)', fontWeight: 600, borderRadius: '4px' }}>
                          SAVED ERA ({summary.dateRangeStr || 'Custom Range'})
                        </span>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', backgroundColor: '#fafafa', padding: '20px', borderRadius: '12px', border: '1px solid #f1f5f9' }}>
                        <div>
                          <div style={{ fontSize: '10px', color: 'var(--color-motive-light-blue)', fontWeight: 700, letterSpacing: '0.5px', marginBottom: '6px' }}>ACCOMPLISHED</div>
                          <div style={{ fontSize: '13px', color: 'var(--color-dark-gray)', lineHeight: '1.5' }}>{summary.experience}</div>
                        </div>
                        <div style={{ borderLeft: '1px solid #eef2ff', paddingLeft: '16px' }}>
                          <div style={{ fontSize: '10px', color: '#dc2626', fontWeight: 700, letterSpacing: '0.5px', marginBottom: '6px' }}>CHALLENGES</div>
                          <div style={{ fontSize: '13px', color: 'var(--color-dark-gray)', lineHeight: '1.5' }}>{summary.reflection}</div>
                        </div>
                        <div style={{ borderLeft: '1px solid #eef2ff', paddingLeft: '16px' }}>
                          <div style={{ fontSize: '10px', color: 'var(--color-motive-dark-blue)', fontWeight: 700, letterSpacing: '0.5px', marginBottom: '6px' }}>ACTION PLAN</div>
                          <div style={{ fontSize: '13px', color: 'var(--color-dark-gray)', lineHeight: '1.5' }}>{summary.action}</div>
                        </div>
                      </div>

                      {/* Render Highlights for older summaries */}
                      {summary.dailyHighlights && summary.dailyHighlights.length > 0 && (
                        <div style={{ paddingLeft: '12px', borderLeft: '3px solid var(--color-motive-light-blue)', marginTop: '4px' }}>
                          <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--color-motive-dark-blue)', marginBottom: '8px' }}>DAILY REFLECTION OVERVIEW:</div>
                          <ul style={{ margin: 0, paddingLeft: '16px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            {summary.dailyHighlights.map((hl, hlIdx) => (
                              <li key={hlIdx} style={{ fontSize: '12px', color: 'var(--color-dark-gray)', lineHeight: '1.4' }}>
                                <strong>{hl.date}:</strong> {hl.highlight}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
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
