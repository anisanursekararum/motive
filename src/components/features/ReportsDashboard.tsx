"use client";

import React, { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { FiDownload, FiMail, FiCalendar, FiLoader } from 'react-icons/fi';
import { useAuth } from '@/context/AuthContext';
import { Task, DailyNote, Summary } from '@/types';
import { useLanguage } from '@/context/LanguageContext';

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
  const { t, language } = useLanguage();
  const [dateFilter, setDateFilter] = useState('This Week');
  const [aiLoading, setAiLoading] = useState(false);
  const [emailSending, setEmailSending] = useState(false);
  const [hoveredBarIndex, setHoveredBarIndex] = useState<number | null>(null);

  // States for historical report modal & pagination
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [historyPage, setHistoryPage] = useState(1);
  const [selectedHistorySummary, setSelectedHistorySummary] = useState<Summary | null>(null);
  
  // Custom date picker states
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
      const s = new Date(customStartDate);
      const e = new Date(customEndDate);
      s.setHours(0,0,0,0);
      e.setHours(23,59,59,999);
      return { start: s, end: e };
    }
    
    start.setHours(0,0,0,0);
    end.setHours(23,59,59,999);
    return { start, end };
  }, [dateFilter, customStartDate, customEndDate]);

  const dateString = `${dateRange.start.toLocaleDateString(language === 'id' ? 'id-ID' : 'en-US', { month: 'short', day: 'numeric', year: 'numeric'})} - ${dateRange.end.toLocaleDateString(language === 'id' ? 'id-ID' : 'en-US', { month: 'short', day: 'numeric', year: 'numeric'})}`;

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
        label: current.toLocaleDateString(language === 'id' ? 'id-ID' : 'en-US', { weekday: 'short' }),
        completed: 0,
        total: 0
      });
      current.setDate(current.getDate() + 1);
    }
    
    let displayDays = days;
    if (days.length > 14) {
       displayDays = days.slice(-14);
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
  }, [filteredTasks, dateRange, language]);

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

  const handleSendEmail = async () => {
    const savedRecipient = localStorage.getItem('settings_recipientEmail') || user?.email || 'reflection@motive.app';
    
    // Construct email content
    const latestSummary = summaries && summaries.length > 0 ? summaries[0] : null;
    
    let eraText = "";
    if (latestSummary) {
      eraText = `
Experience:
${latestSummary.experience}

Reflection:
${latestSummary.reflection}

Action:
${latestSummary.action}
      `.trim();
    } else {
      eraText = "No summaries generated yet.";
    }

    const emailSubject = `Motive Productivity & Reflection Report — Period: ${dateString}`;
    const emailBody = `
Hi there,

Here is your periodic Motive Productivity & Reflection Report.

Period: ${dateString}
Productivity Velocity Change: ${velocityPercentageString}
Total Tasks Scheduled: ${velocityData.totalCount}
Completed Tasks: ${velocityData.totalCompleted}

==================================
EXECUTIVE REFLECTION & ANALYSIS (ERA)
==================================

${eraText}

==================================
Keep up the positive momentum and self-reflection!
Sent directly from Motive App on behalf of anisanursekararum@gmail.com.
    `.trim();

    setEmailSending(true);
    try {
      const res = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: savedRecipient,
          subject: emailSubject,
          body: emailBody
        })
      });
      const data = await res.json();
      if (data.success) {
        alert(language === 'id'
          ? `Laporan berhasil dikirim langsung ke ${savedRecipient} dari anisanursekararum@gmail.com!`
          : `Report successfully sent directly to ${savedRecipient} from anisanursekararum@gmail.com!`);
      } else {
        throw new Error(data.error);
      }
    } catch (err: any) {
      alert("Failed to send email directly: " + err.message);
    } finally {
      setEmailSending(false);
    }
  };

  // Generate Report via Gemini Proxied API
  const handleGenerateReport = async () => {
    setAiLoading(true);
    try {
      const response = await fetch('/api/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          tasks: filteredTasks, 
          notes: filteredNotes,
          dateRange: dateString,
          language: language
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

  // Helper function to render paragraphs and points beautifully
  const formatERAPoints = (text: any) => {
    if (!text) return null;
    let str = "";
    if (typeof text === 'string') {
      str = text;
    } else if (Array.isArray(text)) {
      str = text.join('\n');
    } else {
      str = String(text);
    }
    const paragraphs = str.split('\n\n').filter(Boolean);
    return paragraphs.map((para, pIdx) => {
      const lines = para.split('\n').filter(Boolean);
      const isList = lines.some(line => /^\s*[-*•\d+.]/.test(line));
      
      if (isList) {
        return (
          <ul key={pIdx} style={{ margin: '8px 0 16px 20px', paddingLeft: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {lines.map((line, lIdx) => {
              const cleanLine = line.replace(/^\s*[-*•\d+.]\s*/, '');
              return (
                <li key={lIdx} style={{ fontSize: '13px', lineHeight: 1.6, color: 'var(--text-secondary)', textAlign: 'justify' }}>
                  {cleanLine}
                </li>
              );
            })}
          </ul>
        );
      }
      
      return (
        <p key={pIdx} style={{ fontSize: '13px', lineHeight: 1.6, color: 'var(--text-secondary)', marginBottom: '16px', textAlign: 'justify' }}>
          {para}
        </p>
      );
    });
  };

  const historicalSummaries = useMemo(() => {
    if (!summaries || summaries.length <= 1) return [];
    return summaries.slice(1);
  }, [summaries]);

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

      {/* Printable Area */}
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
                  <td style={{ padding: '8px' }}>{`${day.date.getDate()}-${day.label}`}</td>
                  <td style={{ padding: '8px', fontWeight: 'bold', color: '#4A5FD9' }}>{day.completed}</td>
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
              {focusSplitData.map((item, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '8px', fontWeight: 600 }}>{item.name}</td>
                  <td style={{ padding: '8px' }}>{item.count}</td>
                  <td style={{ padding: '8px', fontWeight: 'bold', color: '#4A5FD9' }}>{item.percentage}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {summaries && summaries.length > 0 && (
          <div>
            <h3 style={{ fontSize: '18px', color: '#1A2254', borderBottom: '1px solid #e2e8f0', paddingBottom: '6px', marginBottom: '16px' }}>{language === 'id' ? 'Ringkasan Siklus ERA' : 'ERA Cycle Summary'}</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <h4 style={{ fontSize: '13px', color: '#4A5FD9', margin: '0 0 6px 0', textTransform: 'uppercase' }}>{language === 'id' ? 'PENCAPAIAN (EXPERIENCE)' : 'Accomplished (Experience)'}</h4>
                <div>{formatERAPoints(summaries[0].experience)}</div>
              </div>
              <div>
                <h4 style={{ fontSize: '13px', color: '#dc2626', margin: '0 0 6px 0', textTransform: 'uppercase' }}>{language === 'id' ? 'TANTANGAN (REFLECTION)' : 'Challenges (Reflection)'}</h4>
                <div>{formatERAPoints(summaries[0].reflection)}</div>
              </div>
              <div>
                <h4 style={{ fontSize: '13px', color: '#1A2254', margin: '0 0 6px 0', textTransform: 'uppercase' }}>{language === 'id' ? 'RENCANA KERJA (ACTION)' : 'Action Plan (Action)'}</h4>
                <div>{formatERAPoints(summaries[0].action)}</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main UI Header */}
      <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '28px', color: 'var(--text-primary)', fontWeight: 700, margin: 0 }}>{t('reports')}</h1>
          <p style={{ color: 'var(--text-secondary)', margin: '4px 0 0 0', fontSize: '14px' }}>
            {dateString}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <Button variant="secondary" onClick={handleExportPDF} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FiDownload /> PDF
          </Button>
          <Button variant="secondary" onClick={handleSendEmail} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FiMail /> {language === 'id' ? 'Kirim Email' : 'Send to Email'}
          </Button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="no-print" style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
        {['This Week', 'Last Month', 'Custom Range'].map(filter => (
          <button
            key={filter}
            onClick={() => setDateFilter(filter)}
            style={{
              padding: '10px 24px',
              borderRadius: '20px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '13px',
              backgroundColor: dateFilter === filter ? 'var(--color-motive-dark-blue)' : 'var(--surface-input)',
              color: dateFilter === filter ? 'white' : 'var(--text-secondary)',
              boxShadow: dateFilter === filter ? 'var(--shadow-level-1)' : 'none',
              transition: 'all 0.2s ease'
            }}
          >
            {filter === 'This Week' ? (language === 'id' ? 'Minggu Ini' : 'This Week') :
             filter === 'Last Month' ? (language === 'id' ? 'Bulan Lalu' : 'Last Month') :
             (language === 'id' ? 'Rentang Khusus' : 'Custom Range')}
          </button>
        ))}

        {dateFilter === 'Custom Range' && (
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginLeft: '12px', animation: 'fadeIn 0.2s ease' }}>
            <FiCalendar style={{ color: 'var(--text-secondary)' }} />
            <input
              type="date"
              value={customStartDate}
              onChange={e => setCustomStartDate(e.target.value)}
              style={{ padding: '6px 12px', borderRadius: '8px', border: '1px solid var(--border-input)', backgroundColor: 'var(--surface-input)', color: 'var(--text-primary)', fontSize: '13px', outline: 'none' }}
            />
            <span style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>to</span>
            <input
              type="date"
              value={customEndDate}
              onChange={e => setCustomEndDate(e.target.value)}
              style={{ padding: '6px 12px', borderRadius: '8px', border: '1px solid var(--border-input)', backgroundColor: 'var(--surface-input)', color: 'var(--text-primary)', fontSize: '13px', outline: 'none' }}
            />
          </div>
        )}
      </div>

      {/* Grid: Productivity Charts & Details */}
      <div className="no-print" style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '32px' }}>
        
        {/* Productivity Velocity Card */}
        <Card style={{ borderTop: '4px solid var(--color-motive-dark-blue)', display: 'flex', flexDirection: 'column', gap: '24px', minHeight: '340px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h3 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '18px', fontWeight: 600 }}>{t('productivity_velocity')}</h3>
              <p style={{ margin: '4px 0 0 0', color: 'var(--text-secondary)', fontSize: '12px' }}>
                {velocityData.totalCompleted} / {velocityData.totalCount} {t('completed_tasks')}
              </p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)' }}>
                {velocityPercentageString}
              </div>
              <div style={{ fontSize: '10px', color: 'var(--color-motive-light-blue)', fontWeight: 700, letterSpacing: '1px' }}>{t('vs_last')}</div>
            </div>
          </div>
          
          {/* Dual Bar Chart rendering */}
          <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', gap: '12px', height: '160px', marginTop: 'auto', position: 'relative' }}>
            {velocityData?.data?.map((day, i) => {
              const totalPct = day.total === 0 ? 0 : (day.total / velocityData.max) * 100;
              const completedPct = day.total === 0 ? 0 : (day.completed / velocityData.max) * 100;
              const percent = day.total === 0 ? 0 : Math.round((day.completed / day.total) * 100);
              const formattedLabel = `${day.date.getDate()}-${day.label}`;
              
              return (
                <div 
                  key={i} 
                  onMouseEnter={() => setHoveredBarIndex(i)}
                  onMouseLeave={() => setHoveredBarIndex(null)}
                  style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', height: '100%', justifyContent: 'flex-end', position: 'relative' }}
                >
                  {/* Tooltip bubble */}
                  {hoveredBarIndex === i && (
                    <div style={{
                      position: 'absolute',
                      bottom: `calc(${totalPct}% + 4px)`,
                      backgroundColor: 'var(--color-motive-dark-blue)',
                      color: 'white',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '10px',
                      fontWeight: 700,
                      whiteSpace: 'nowrap',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                      zIndex: 10,
                      pointerEvents: 'none',
                      transform: 'translateX(-50%)',
                      left: '50%'
                    }}>
                      {percent}% {t('completed')}
                      <div style={{
                        position: 'absolute',
                        top: '100%',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        borderWidth: '4px',
                        borderStyle: 'solid',
                        borderColor: 'var(--color-motive-dark-blue) transparent transparent transparent'
                      }} />
                    </div>
                  )}

                  {/* Cylinder overlay wrappers */}
                  <div style={{ 
                    position: 'relative', 
                    width: '100%', 
                    height: '120px', 
                    display: 'flex', 
                    alignItems: 'flex-end', 
                    justifyContent: 'center',
                    cursor: 'pointer'
                  }}>
                    {/* Total Tasks (Gray Background Bar) */}
                    <div style={{
                      position: 'absolute',
                      width: '14px',
                      height: `${totalPct}%`,
                      backgroundColor: 'var(--border-color)',
                      borderRadius: '4px 4px 0 0',
                      transition: 'height 0.3s ease'
                    }} />
                    
                    {/* Completed Tasks (Navy Foreground Bar - now #4A5FD9) */}
                    <div style={{
                      position: 'absolute',
                      width: '14px',
                      height: `${completedPct}%`,
                      backgroundColor: '#4A5FD9',
                      borderRadius: '4px 4px 0 0',
                      transition: 'height 0.3s ease',
                      zIndex: 2
                    }} />
                  </div>
                  <span style={{ fontSize: '10px', color: 'var(--text-secondary)', fontWeight: 600, whiteSpace: 'nowrap' }}>{formattedLabel}</span>
                </div>
              );
            })}
          </div>
          
          <div style={{ display: 'flex', gap: '16px', marginTop: '16px', fontSize: '11px', color: 'var(--text-secondary)', justifyContent: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <div style={{ width: '10px', height: '10px', backgroundColor: '#4A5FD9', borderRadius: '2px' }}></div>
              <span>{t('completed_tasks')}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <div style={{ width: '10px', height: '10px', backgroundColor: 'var(--border-color)', borderRadius: '2px' }}></div>
              <span>{t('total_tasks')}</span>
            </div>
          </div>
        </Card>

        {/* Focus Split */}
        <Card style={{ borderTop: '4px solid var(--color-motive-dark-blue)' }}>
          <h3 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '18px', fontWeight: 600 }}>{t('focus_split')}</h3>
          <p style={{ margin: '4px 0 24px 0', color: 'var(--text-secondary)', fontSize: '12px' }}>
            {t('focus_split_desc')}
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {focusSplitData.length === 0 ? (
              <div style={{ color: 'var(--text-secondary)', fontSize: '14px', textAlign: 'center', padding: '32px' }}>
                {t('no_tasks_range')}
              </div>
            ) : (
              focusSplitData.map((item, idx) => (
                <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 600 }}>
                    <span style={{ color: 'var(--text-primary)' }}>{item.name}</span>
                    <span style={{ color: 'var(--color-motive-light-blue)' }}>{item.percentage}%</span>
                  </div>
                  <div style={{ width: '100%', height: '8px', backgroundColor: 'var(--border-color)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: `${item.percentage}%`, height: '100%', backgroundColor: 'var(--color-motive-light-blue)', borderRadius: '4px' }}></div>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      {/* ERA Reflection & Analysis Summaries */}
      <Card className="no-print" style={{ borderTop: '4px solid var(--color-motive-light-blue)', padding: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
          <div>
            <h3 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '20px', fontWeight: 600 }}>{t('era_summaries')}</h3>
            <p style={{ margin: '4px 0 0 0', color: 'var(--text-secondary)', fontSize: '13px' }}>
              {t('era_desc')}
            </p>
          </div>
          <Button 
            onClick={handleGenerateReport} 
            disabled={aiLoading}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px' }}
          >
            {aiLoading ? (
              <>
                <FiLoader className="spin-loader" /> {t('generating')}
              </>
            ) : (
              <>
                ⚡ {t('generate_report')}
              </>
            )}
            <style dangerouslySetInnerHTML={{__html: `
              @keyframes spin {
                from { transform: rotate(0deg); }
                to { transform: rotate(360deg); }
              }
              .spin-loader {
                animation: spin 1s linear infinite;
              }
            `}} />
          </Button>
        </div>

        {/* Display the most recent summary as the "LATEST COMPREHENSIVE ERA SUMMARY" */}
        {summaries && summaries.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            {/* Featured Latest Summary */}
            <div style={{ paddingBottom: '32px', borderBottom: summaries.length > 1 ? '1px solid var(--border-color)' : 'none' }}>
              
              {/* White wording tag styled inside Motive Dark Blue solid badge */}
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                color: 'white',
                backgroundColor: 'var(--color-motive-dark-blue)',
                fontWeight: 700,
                fontSize: '11px',
                padding: '6px 16px',
                borderRadius: '20px',
                marginBottom: '20px',
                letterSpacing: '0.5px',
                textTransform: 'uppercase'
              }}>
                <FiDownload style={{ marginRight: '4px' }} />
                {language === 'id' 
                  ? `IKHTISAR SIKLUS ERA TERBARU — ${new Date(summaries[0].date).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}`
                  : `LATEST COMPREHENSIVE ERA SUMMARY — ${new Date(summaries[0].date).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}`}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '24px' }}>
                <div>
                  <h4 style={{ fontSize: '10px', color: 'var(--color-motive-light-blue)', fontWeight: 700, letterSpacing: '1px', marginBottom: '12px' }}>
                    {language === 'id' ? 'PENCAPAIAN (EXPERIENCE)' : 'ACCOMPLISHED (EXPERIENCE)'}
                  </h4>
                  {formatERAPoints(summaries[0].experience)}
                </div>
                <div style={{ borderLeft: '1px solid var(--border-color)', paddingLeft: '24px' }}>
                  <h4 style={{ fontSize: '10px', color: '#dc2626', fontWeight: 700, letterSpacing: '1px', marginBottom: '12px' }}>
                    {language === 'id' ? 'TANTANGAN (REFLECTION)' : 'CHALLENGES (REFLECTION)'}
                  </h4>
                  {formatERAPoints(summaries[0].reflection)}
                </div>
                <div style={{ borderLeft: '1px solid var(--border-color)', paddingLeft: '24px' }}>
                  <h4 style={{ fontSize: '10px', color: 'var(--color-motive-light-blue)', fontWeight: 700, letterSpacing: '1px', marginBottom: '12px' }}>
                    {language === 'id' ? 'RENCANA KERJA (ACTION)' : 'ACTION PLAN (ACTION)'}
                  </h4>
                  {formatERAPoints(summaries[0].action)}
                </div>
              </div>
              
              {/* Render Daily Highlights for the latest featured summary if they exist */}
              {summaries[0].dailyHighlights && summaries[0].dailyHighlights.length > 0 && (
                <div style={{ marginTop: '24px', backgroundColor: 'var(--surface-input)', padding: '20px', borderRadius: '8px', borderLeft: '4px solid var(--color-motive-light-blue)' }}>
                  <h4 style={{ fontSize: '11px', color: 'var(--color-motive-dark-blue)', fontWeight: 700, letterSpacing: '1px', margin: '0 0 12px 0' }}>{t('daily_overview')}</h4>
                  <ul style={{ margin: 0, paddingLeft: '16px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {summaries[0].dailyHighlights.map((hl, hlIdx) => (
                      <li key={hlIdx} style={{ fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                        <strong>{hl.date}:</strong> {hl.highlight}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* View Historical Periodical Reports Button */}
            {summaries.length > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', marginTop: '8px' }}>
                <Button 
                  variant="secondary" 
                  onClick={() => {
                    setHistoryPage(1);
                    setSelectedHistorySummary(null);
                    setIsHistoryModalOpen(true);
                  }}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px' }}
                >
                  📁 {language === 'id' ? 'Lihat Riwayat Laporan Periodik' : 'View Historical Periodical Reports'}
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '48px', color: 'var(--text-secondary)' }}>
            {t('no_era')}
          </div>
        )}
      </Card>

      {/* Historical Periodical Reports Modal with 5-row pagination */}
      {isHistoryModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000,
          padding: '24px',
          backdropFilter: 'blur(4px)'
        }}>
          <div style={{
            backgroundColor: 'var(--surface-card)',
            borderRadius: '16px',
            width: '900px',
            maxWidth: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: '32px',
            boxShadow: 'var(--shadow-level-2)',
            borderTop: '4px solid var(--color-motive-dark-blue)',
            display: 'flex',
            flexDirection: 'column',
            gap: '24px'
          }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '20px', fontWeight: 700 }}>
                  {language === 'id' ? 'Riwayat Laporan Siklus ERA' : 'Historical ERA Cycle Reports'}
                </h3>
                <p style={{ margin: '4px 0 0 0', color: 'var(--text-secondary)', fontSize: '13px' }}>
                  {language === 'id' ? 'Semua laporan periodik yang telah dibuat sebelumnya.' : 'Browse and review all past periodically generated reports.'}
                </p>
              </div>
              <button
                onClick={() => setIsHistoryModalOpen(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '20px' }}
              >
                ✕
              </button>
            </div>

            {/* Detailed single report expand view */}
            {selectedHistorySummary ? (
              <div style={{
                backgroundColor: 'var(--surface-input)',
                borderRadius: '12px',
                padding: '24px',
                borderLeft: '4px solid var(--color-motive-light-blue)',
                display: 'flex',
                flexDirection: 'column',
                gap: '20px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
                  <span style={{ fontWeight: 700, fontSize: '14px', color: 'var(--color-motive-dark-blue)' }}>
                    {language === 'id' ? 'PERIODE LAPORAN:' : 'REPORT PERIOD:'} {selectedHistorySummary.dateRangeStr || 'Historical'}
                  </span>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      {new Date(selectedHistorySummary.date).toLocaleString(language === 'id' ? 'id-ID' : 'en-US')}
                    </span>
                    <Button variant="secondary" style={{ padding: '4px 12px', fontSize: '11px' }} onClick={() => setSelectedHistorySummary(null)}>
                      ← {language === 'id' ? 'Kembali ke Daftar' : 'Back to List'}
                    </Button>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '24px' }}>
                  <div>
                    <h4 style={{ fontSize: '11px', color: 'var(--color-motive-light-blue)', fontWeight: 700, letterSpacing: '1px', marginBottom: '12px' }}>
                      {language === 'id' ? 'PENCAPAIAN (EXPERIENCE)' : 'ACCOMPLISHED (EXPERIENCE)'}
                    </h4>
                    {formatERAPoints(selectedHistorySummary.experience)}
                  </div>
                  <div style={{ borderLeft: '1px solid var(--border-color)', paddingLeft: '24px' }}>
                    <h4 style={{ fontSize: '11px', color: '#dc2626', fontWeight: 700, letterSpacing: '1px', marginBottom: '12px' }}>
                      {language === 'id' ? 'TANTANGAN (REFLECTION)' : 'CHALLENGES (REFLECTION)'}
                    </h4>
                    {formatERAPoints(selectedHistorySummary.reflection)}
                  </div>
                  <div style={{ borderLeft: '1px solid var(--border-color)', paddingLeft: '24px' }}>
                    <h4 style={{ fontSize: '11px', color: 'var(--color-motive-light-blue)', fontWeight: 700, letterSpacing: '1px', marginBottom: '12px' }}>
                      {language === 'id' ? 'RENCANA KERJA (ACTION)' : 'ACTION PLAN (ACTION)'}
                    </h4>
                    {formatERAPoints(selectedHistorySummary.action)}
                  </div>
                </div>

                {selectedHistorySummary.dailyHighlights && selectedHistorySummary.dailyHighlights.length > 0 && (
                  <div style={{ marginTop: '16px', backgroundColor: 'var(--surface-card)', padding: '16px', borderRadius: '8px', borderLeft: '4px solid var(--color-motive-light-blue)' }}>
                    <h5 style={{ fontSize: '11px', color: 'var(--color-motive-dark-blue)', fontWeight: 700, letterSpacing: '1px', margin: '0 0 8px 0' }}>
                      {language === 'id' ? 'IKHTISAR REFLEKSI HARIAN' : 'DAILY REFLECTION OVERVIEW'}
                    </h5>
                    <ul style={{ margin: 0, paddingLeft: '16px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      {selectedHistorySummary.dailyHighlights.map((hl, hlIdx) => (
                        <li key={hlIdx} style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                          <strong>{hl.date}:</strong> {hl.highlight}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <>
                {/* Historical summaries list before the recent one */}
                {historicalSummaries.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '48px', color: 'var(--text-secondary)' }}>
                    {language === 'id' ? 'Tidak ada laporan riwayat sebelum laporan terbaru ini.' : 'No older reports found in history.'}
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                      <thead>
                        <tr style={{ borderBottom: '2px solid var(--border-color)', color: 'var(--text-primary)', fontWeight: 600 }}>
                          <th style={{ padding: '12px' }}>{language === 'id' ? 'Tanggal Pembuatan' : 'Date Generated'}</th>
                          <th style={{ padding: '12px' }}>{language === 'id' ? 'Periode Laporan' : 'Report Period'}</th>
                          <th style={{ padding: '12px', textAlign: 'right' }}>{language === 'id' ? 'Aksi' : 'Action'}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {historicalSummaries.slice((historyPage - 1) * 5, historyPage * 5).map((summary) => {
                          const genDate = new Date(summary.date);
                          return (
                            <tr key={summary.id} style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                              <td style={{ padding: '14px 12px', fontWeight: 600 }}>
                                {genDate.toLocaleString(language === 'id' ? 'id-ID' : 'en-US')}
                              </td>
                              <td style={{ padding: '14px 12px' }}>
                                {summary.dateRangeStr || 'Custom Period'}
                              </td>
                              <td style={{ padding: '14px 12px', textAlign: 'right' }}>
                                <Button 
                                  variant="secondary" 
                                  style={{ padding: '6px 12px', fontSize: '11px' }} 
                                  onClick={() => setSelectedHistorySummary(summary)}
                                >
                                  {language === 'id' ? 'Lihat Laporan' : 'View Report'}
                                </Button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>

                    {/* Pagination Controls */}
                    {historicalSummaries.length > 5 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px' }}>
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                          {language === 'id' 
                            ? `Halaman ${historyPage} dari ${Math.ceil(historicalSummaries.length / 5)}`
                            : `Page ${historyPage} of ${Math.ceil(historicalSummaries.length / 5)}`}
                        </span>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <Button
                            variant="secondary"
                            disabled={historyPage === 1}
                            onClick={() => setHistoryPage(p => Math.max(p - 1, 1))}
                            style={{ padding: '6px 16px', fontSize: '12px' }}
                          >
                            {language === 'id' ? 'Sebelumnya' : 'Previous'}
                          </Button>
                          <Button
                            variant="secondary"
                            disabled={historyPage >= Math.ceil(historicalSummaries.length / 5)}
                            onClick={() => setHistoryPage(p => Math.min(p + 1, Math.ceil(historicalSummaries.length / 5)))}
                            style={{ padding: '6px 16px', fontSize: '12px' }}
                          >
                            {language === 'id' ? 'Berikutnya' : 'Next'}
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
              <Button style={{ padding: '12px 28px' }} onClick={() => setIsHistoryModalOpen(false)}>
                {t('close')}
              </Button>
            </div>

          </div>
        </div>
      )}
      
    </div>
  );
}
