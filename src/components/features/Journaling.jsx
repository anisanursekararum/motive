"use client";
import React, { useState, useMemo, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';
import { Button } from '@/components/ui/Button';
import { useSearchParams } from 'next/navigation';
import { FiPlus } from 'react-icons/fi';

export function Journaling() {
  const searchParams = useSearchParams();
  const searchQuery = (searchParams?.get('q') || '').toLowerCase();

  const [activeNoteId, setActiveNoteId] = useState(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  
  // Get notes for today
  const notes = useLiveQuery(async () => {
    return await db.daily_notes.reverse().toArray();
  });

  const filteredNotes = useMemo(() => {
    if (!notes) return [];
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return notes.filter(note => {
      const noteDate = new Date(note.timestamp);
      if (noteDate < today || noteDate >= tomorrow) return false;

      if (searchQuery) {
        const matchTitle = (note.title || '').toLowerCase().includes(searchQuery);
        const matchDesc = note.content.toLowerCase().includes(searchQuery);
        if (!matchTitle && !matchDesc) return false;
      }

      return true;
    });
  }, [notes, searchQuery]);

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
    if (!content.trim() && !title.trim()) return;
    
    if (activeNoteId) {
      await db.daily_notes.update(activeNoteId, {
        title: title.trim() || 'Untitled Journal',
        content,
        charCount: content.length,
        timestamp: new Date().toISOString()
      });
    } else {
      const newNote = {
        id: uuidv4(),
        title: title.trim() || 'Untitled Journal',
        content,
        charCount: content.length,
        timestamp: new Date().toISOString()
      };
      await db.daily_notes.add(newNote);
      setActiveNoteId(newNote.id);
    }
  };

  const handleNewNote = () => {
    setActiveNoteId(null);
    setTitle('');
    setContent('');
  };

  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
  const charCount = content.length;
  const activeNoteData = activeNoteId ? filteredNotes.find(n => n.id === activeNoteId) : null;
  const displayDate = activeNoteData 
    ? new Date(activeNoteData.timestamp).toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    : new Date().toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  return (
    <div style={{ display: 'flex', gap: '32px', alignItems: 'flex-start', minHeight: '80vh' }}>
      
      {/* Left Column: Note List */}
      <div style={{ 
        flex: '0 0 350px', 
        backgroundColor: 'var(--color-white)', 
        borderRadius: '12px', 
        padding: '24px', 
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        maxHeight: '80vh',
        overflowY: 'auto'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '20px', color: 'var(--color-motive-dark-blue)', margin: 0, fontWeight: 600 }}>Today's Journal</h2>
          <button 
            onClick={handleNewNote}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-dark-gray)' }}
            title="New Journal"
          >
            <FiPlus size={20} />
          </button>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {filteredNotes.length === 0 ? (
            <p style={{ color: 'var(--color-dark-gray)', fontSize: '14px', textAlign: 'center', padding: '24px 0' }}>No journals for today.</p>
          ) : (
            filteredNotes.map(note => {
              const isActive = note.id === activeNoteId;
              const timeString = new Date(note.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
              return (
                <div 
                  key={note.id} 
                  onClick={() => setActiveNoteId(note.id)}
                  style={{ 
                    padding: '16px', 
                    backgroundColor: isActive ? '#f8fafc' : 'white', 
                    borderRadius: '8px', 
                    border: '1px solid',
                    borderColor: isActive ? 'var(--color-motive-light-blue)' : '#f1f5f9',
                    borderLeft: `4px solid ${isActive ? 'var(--color-motive-dark-blue)' : 'var(--color-motive-light-blue)'}`,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-motive-dark-blue)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '70%' }}>
                      {note.title || 'Untitled Journal'}
                    </span>
                    <span style={{ fontSize: '10px', color: 'var(--color-dark-gray)' }}>{timeString}</span>
                  </div>
                  <p style={{ 
                    fontSize: '12px', 
                    color: 'var(--color-dark-gray)', 
                    margin: 0,
                    lineHeight: '1.5',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden'
                  }}>
                    {note.content || 'No content...'}
                  </p>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Right Column: Editor & Cards */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* Editor Card */}
        <div style={{ 
          flex: 1,
          backgroundColor: 'white', 
          borderRadius: '12px', 
          padding: '48px', 
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <input 
            type="text"
            placeholder="Journal Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={{ 
              border: 'none', 
              fontSize: '32px', 
              fontWeight: 700, 
              color: 'var(--color-motive-dark-blue)', 
              outline: 'none', 
              width: '100%',
              marginBottom: '8px',
              fontFamily: 'inherit'
            }}
          />
          <div style={{ fontSize: '14px', color: 'var(--color-dark-gray)', marginBottom: '32px' }}>
            {displayDate}
          </div>
          
          <textarea
            placeholder="Reflecting on..."
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
              color: 'var(--color-dark-gray)',
              fontFamily: 'inherit',
              minHeight: '200px'
            }}
          />
          
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '24px' }}>
            <Button onClick={saveNote}>Save Notes</Button>
          </div>
        </div>

        {/* Bottom Cards */}
        <div style={{ display: 'flex', gap: '24px' }}>
          
          {/* Word Count */}
          <div style={{ 
            flex: 1, 
            backgroundColor: '#f8fafc', 
            borderRadius: '12px', 
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            border: '1px solid #e5e7eb'
          }}>
            <h4 style={{ fontSize: '10px', color: 'var(--color-dark-gray)', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '8px' }}>Word & Character Count</h4>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
              <span style={{ fontSize: '24px', fontWeight: 700, color: 'var(--color-motive-dark-blue)' }}>{wordCount}</span>
              <span style={{ fontSize: '12px', color: 'var(--color-dark-gray)' }}>words /</span>
              <span style={{ fontSize: '24px', fontWeight: 700, color: 'var(--color-motive-dark-blue)' }}>{charCount}</span>
              <span style={{ fontSize: '12px', color: 'var(--color-dark-gray)' }}>characters</span>
            </div>
            <span style={{ fontSize: '10px', color: 'var(--color-dark-gray)', marginTop: '8px', textTransform: 'uppercase' }}>Maximum 5000 Characters</span>
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
            <h4 style={{ fontSize: '10px', color: 'rgba(255,255,255,0.7)', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '8px' }}>ERA Cycle AI</h4>
            <div style={{ fontSize: '16px', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Insights Ready</span>
              <span>✨</span>
            </div>
            <Button style={{ backgroundColor: 'var(--color-motive-light-blue)', color: 'white', width: '100%', padding: '12px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}>
              ⚡ Extract AI Insights
            </Button>
          </div>

        </div>
      </div>
    </div>
  );
}
