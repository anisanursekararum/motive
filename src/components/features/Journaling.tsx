"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';
import { Button } from '@/components/ui/Button';
import { useSearchParams } from 'next/navigation';
import { FiPlus, FiX, FiLoader, FiCheck } from 'react-icons/fi';
import { DailyNote } from '@/types';
import { useLanguage } from '@/context/LanguageContext';

export function Journaling() {
  const searchParams = useSearchParams();
  const searchQuery = (searchParams?.get('q') || '').toLowerCase();
  const { t, language } = useLanguage();

  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  // AI Insights State (same behavior as Tasks)
  const [aiLoading, setAiLoading] = useState(false);
  const [aiInsightResult, setAiInsightResult] = useState<any>(null);
  const [isInsightModalOpen, setIsInsightModalOpen] = useState(false);

  // Get notes
  const notes = useLiveQuery(async (): Promise<DailyNote[]> => {
    return await db.daily_notes.reverse().toArray();
  });

  const filteredNotes = useMemo((): DailyNote[] => {
    if (!notes) return [];

    const pickedDate = new Date(selectedDate);
    pickedDate.setHours(0, 0, 0, 0);
    const nextDay = new Date(pickedDate);
    nextDay.setDate(nextDay.getDate() + 1);

    return notes.filter(note => {
      const noteDate = new Date(note.timestamp);
      if (noteDate < pickedDate || noteDate >= nextDay) return false;

      if (searchQuery) {
        const matchTitle = (note.title || '').toLowerCase().includes(searchQuery);
        const matchDesc = note.content.toLowerCase().includes(searchQuery);
        if (!matchTitle && !matchDesc) return false;
      }

      return true;
    });
  }, [notes, searchQuery, selectedDate]);

  // Load active note data into form when changed
  useEffect(() => {
    if (activeNoteId) {
      const note = filteredNotes.find(n => n.id === activeNoteId);
      if (note) {
        setTitle(note.title || '');
        setContent(note.content || '');
      }
    } else {
      setTitle('');
      setContent('');
    }
  }, [activeNoteId, filteredNotes]);

  const saveNote = async () => {
    if (!content.trim()) return;

    if (activeNoteId) {
      // Update
      await db.daily_notes.update(activeNoteId, {
        title: title.trim(),
        content: content.trim(),
        charCount: content.length,
        timestamp: new Date(`${selectedDate}T12:00:00`).toISOString()
      });
      alert(t('saved'));
    } else {
      // Create new
      const newId = uuidv4();
      const newNote: DailyNote = {
        id: newId,
        title: title.trim() || t('untitled_journal'),
        content: content.trim(),
        charCount: content.length,
        timestamp: new Date(`${selectedDate}T12:00:00`).toISOString()
      };
      await db.daily_notes.add(newNote);
      setActiveNoteId(newId);
      alert(t('saved'));
    }
  };

  const handleNewNote = () => {
    setActiveNoteId(null);
    setTitle('');
    setContent('');
  };

  // Extract AI Insights (Identical behavior to Tasks)
  const handleExtractAIInsights = async () => {
    setAiLoading(true);
    setIsInsightModalOpen(true);
    setAiInsightResult(null);

    try {
      const pickedDate = new Date(selectedDate);
      pickedDate.setHours(0, 0, 0, 0);
      const nextDay = new Date(pickedDate);
      nextDay.setDate(nextDay.getDate() + 1);

      // Fetch tasks for picked date
      const allTasks = await db.tasks.toArray();
      const dayTasks = allTasks.filter(task => {
        const tDate = task.deadline ? new Date(task.deadline) : new Date(task.createdAt);
        return tDate >= pickedDate && tDate < nextDay;
      });

      // Fetch notes for picked date
      const allNotes = await db.daily_notes.toArray();
      const dayNotes = allNotes.filter(note => {
        const nDate = new Date(note.timestamp);
        return nDate >= pickedDate && nDate < nextDay;
      });

      const response = await fetch('/api/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tasks: dayTasks,
          notes: dayNotes,
          dateRange: selectedDate,
          language: language
        })
      });

      if (!response.ok) {
        throw new Error("Failed to compile summary from Gemini server");
      }

      const eraResult = await response.json();
      
      // Save summary in database
      const summaryId = `daily-${selectedDate}`;
      await db.summaries.put({
        id: summaryId,
        date: selectedDate,
        type: 'daily',
        experience: eraResult.experience,
        reflection: eraResult.reflection,
        action: eraResult.action,
        dailyHighlights: eraResult.dailyHighlights || []
      });

      setAiInsightResult(eraResult);
    } catch (err: any) {
      console.error(err);
      alert("Error generating insights: " + err.message);
      setIsInsightModalOpen(false);
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

  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
  const charCount = content.length;

  const displayDate = new Date(selectedDate).toLocaleDateString(language === 'id' ? 'id-ID' : 'en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div style={{ display: 'flex', gap: '32px', alignItems: 'flex-start' }}>

      {/* Left Column: Note List */}
      <div style={{
        flex: '0 0 350px',
        backgroundColor: 'var(--surface-card)',
        borderTop: '4px solid var(--color-motive-dark-blue)',
        borderRadius: '12px',
        padding: '24px',
        boxShadow: 'var(--shadow-level-1)',
        maxHeight: '80vh',
        overflowY: 'auto'
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: '20px', color: 'var(--text-primary)', margin: 0, fontWeight: 600 }}>{t('journal_title')}</h2>
            <button
              onClick={handleNewNote}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center' }}
              title={t('untitled_journal')}
            >
              <FiPlus size={20} />
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600 }}>{t('pick_date')}</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => {
                setSelectedDate(e.target.value);
                setActiveNoteId(null);
              }}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '8px',
                border: '1px solid var(--border-input)',
                backgroundColor: 'var(--surface-input)',
                color: 'var(--text-primary)',
                fontSize: '14px',
                outline: 'none',
                fontFamily: 'inherit'
              }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {filteredNotes.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '14px', textAlign: 'center', padding: '24px 0' }}>{t('no_journals')}</p>
          ) : (
            filteredNotes.map(note => {
              const isActive = note.id === activeNoteId;
              const timeString = new Date(note.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
              return (
                <div
                  key={note.id}
                  onClick={() => setActiveNoteId(note.id)}
                  style={{
                    padding: '16px',
                    backgroundColor: isActive ? 'var(--surface-input)' : 'var(--surface-card)',
                    borderRadius: '8px',
                    border: '1px solid',
                    borderColor: isActive ? 'var(--color-motive-light-blue)' : 'var(--border-color)',
                    borderLeft: `4px solid ${isActive ? 'var(--color-motive-dark-blue)' : 'var(--color-motive-light-blue)'}`,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '70%' }}>
                      {note.title || t('untitled_journal')}
                    </span>
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{timeString}</span>
                  </div>
                  <p style={{
                    fontSize: '12px',
                    color: 'var(--text-secondary)',
                    margin: 0,
                    lineHeight: '1.5',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden'
                  }}>
                    {note.content}
                  </p>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Right Column: Editor & Stats */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Top Cards */}
        <div style={{ display: 'flex', gap: '24px' }}>
          {/* Word Count */}
          <div style={{
            flex: 1,
            backgroundColor: 'var(--surface-card)',
            borderRadius: '12px',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            borderTop: '4px solid var(--color-motive-dark-blue)',
            boxShadow: 'var(--shadow-level-1)'
          }}>
            <h4 style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '8px' }}>{t('word_count')}</h4>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
              <span style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)' }}>{wordCount}</span>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{t('words')} /</span>
              <span style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)' }}>{charCount}</span>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{t('characters')}</span>
            </div>
            <span style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '8px', textTransform: 'uppercase' }}>{t('max_char')}</span>
          </div>

          {/* ERA Cycle AI */}
          <div style={{
            flex: 1,
            backgroundColor: 'var(--color-motive-dark-blue)',
            borderRadius: '12px',
            padding: '24px',
            color: 'white',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center'
          }}>
            <h4 style={{ fontSize: '10px', color: 'rgba(255,255,255,0.7)', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '8px' }}>{t('era_ai')}</h4>
            <div style={{ fontSize: '16px', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>{t('insights_ready')}</span>
              <span>✨</span>
            </div>
            <Button 
              onClick={handleExtractAIInsights}
              style={{ backgroundColor: 'var(--color-motive-light-blue)', color: 'white', width: '100%', padding: '12px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}
            >
              ⚡ {t('extract_insights')}
            </Button>
          </div>
        </div>

        {/* Editor Card */}
        <div style={{
          flex: 1,
          backgroundColor: 'var(--surface-card)',
          borderRadius: '12px',
          padding: '48px',
          boxShadow: 'var(--shadow-level-1)',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <input
            type="text"
            placeholder={t('untitled_journal')}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={{
              border: 'none',
              fontSize: '32px',
              fontWeight: 700,
              color: 'var(--text-primary)',
              outline: 'none',
              width: '100%',
              marginBottom: '8px',
              fontFamily: 'inherit',
              backgroundColor: 'transparent'
            }}
          />
          <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '32px' }}>
            {displayDate}
          </div>

          <textarea
            placeholder={t('journal_placeholder')}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            maxLength={5000}
            style={{
              flex: 1,
              width: '100%',
              border: 'none',
              resize: 'none',
              outline: 'none',
              fontSize: '16px',
              lineHeight: 1.6,
              color: 'var(--text-primary)',
              fontFamily: 'inherit',
              minHeight: '375px',
              backgroundColor: 'transparent'
            }}
          />

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '24px' }}>
            <Button onClick={saveNote}>{t('save')}</Button>
          </div>
        </div>
      </div>

      {/* ERA Insights Modal Overlay */}
      {isInsightModalOpen && (
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
            maxWidth: '650px',
            width: '100%',
            boxShadow: 'var(--shadow-level-2)',
            display: 'flex',
            flexDirection: 'column',
            gap: '24px',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '20px', color: 'var(--text-primary)', margin: 0, fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>✨</span> {t('insights_modal_title')} — {selectedDate}
              </h3>
              <button 
                onClick={() => setIsInsightModalOpen(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
              >
                <FiX size={20} />
              </button>
            </div>

            {aiLoading ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', padding: '48px 0' }}>
                <FiLoader size={36} className="spin-loader" style={{ color: 'var(--color-motive-light-blue)' }} />
                <p style={{ fontSize: '14px', color: 'var(--text-secondary)', textAlign: 'center' }}>
                  {t('generating_insights')}
                </p>
                <style dangerouslySetInnerHTML={{__html: `
                  @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                  }
                  .spin-loader {
                    animation: spin 1s linear infinite;
                  }
                `}} />
              </div>
            ) : aiInsightResult ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                
                {/* Experience (E) */}
                <div style={{
                  padding: '20px',
                  backgroundColor: 'var(--surface-input)',
                  borderRadius: '12px',
                  borderLeft: '4px solid var(--color-motive-light-blue)'
                }}>
                  <h4 style={{ fontSize: '11px', color: 'var(--color-motive-light-blue)', fontWeight: 700, letterSpacing: '1px', marginBottom: '8px' }}>
                    {t('experience_title')}
                  </h4>
                  {formatERAPoints(aiInsightResult.experience)}
                </div>

                {/* Reflection (R) */}
                <div style={{
                  padding: '20px',
                  backgroundColor: 'var(--surface-input)',
                  borderRadius: '12px',
                  borderLeft: '4px solid #dc2626'
                }}>
                  <h4 style={{ fontSize: '11px', color: '#dc2626', fontWeight: 700, letterSpacing: '1px', marginBottom: '8px' }}>
                    {t('reflection_title')}
                  </h4>
                  {formatERAPoints(aiInsightResult.reflection)}
                </div>

                {/* Action (A) */}
                <div style={{
                  padding: '20px',
                  backgroundColor: 'var(--surface-input)',
                  borderRadius: '12px',
                  borderLeft: '4px solid var(--color-motive-dark-blue)'
                }}>
                  <h4 style={{ fontSize: '11px', color: 'var(--color-motive-dark-blue)', fontWeight: 700, letterSpacing: '1px', marginBottom: '8px' }}>
                    {t('action_title')}
                  </h4>
                  {formatERAPoints(aiInsightResult.action)}
                </div>
              </div>
            ) : null}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
              <Button onClick={() => setIsInsightModalOpen(false)} style={{ padding: '12px 28px' }}>
                {t('close')}
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
