"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';
import { Button } from '@/components/ui/Button';
import { InputField } from '@/components/ui/InputField';
import { Chip } from '@/components/ui/Chip';
import { useSearchParams } from 'next/navigation';
import { Task } from '@/types';
import { useLanguage } from '@/context/LanguageContext';
import { FiPlus, FiTrash2, FiEdit2, FiInfo, FiLoader, FiX, FiCheck } from 'react-icons/fi';

export function TaskManager() {
  const searchParams = useSearchParams();
  const searchQuery = (searchParams?.get('q') || '').toLowerCase();
  const { t, language } = useLanguage();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Work');
  const [priority, setPriority] = useState<'High' | 'Medium' | 'Low'>('Low');
  const [deadline, setDeadline] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  // Customizable Categories
  const [categories, setCategories] = useState<string[]>(['Work', 'Study', 'Personal', 'Health']);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingCategoryIdx, setEditingCategoryIdx] = useState<number | null>(null);
  const [editingCategoryName, setEditingCategoryName] = useState('');

  const [filterCategory, setFilterCategory] = useState('All Categories');

  // Load custom categories from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('motive_categories');
    if (saved) {
      const parsed = JSON.parse(saved);
      setCategories(parsed);
      if (parsed.length > 0) {
        setCategory(parsed[0]);
      }
    }
  }, []);

  const saveCategories = (newCats: string[]) => {
    setCategories(newCats);
    localStorage.setItem('motive_categories', JSON.stringify(newCats));
  };

  const handleAddCategory = () => {
    const trimmed = newCategoryName.trim();
    if (!trimmed) return;
    if (categories.includes(trimmed)) {
      alert("Category already exists!");
      return;
    }
    const updated = [...categories, trimmed];
    saveCategories(updated);
    setNewCategoryName('');
  };

  const handleStartEditCategory = (idx: number, name: string) => {
    setEditingCategoryIdx(idx);
    setEditingCategoryName(name);
  };

  const handleSaveEditCategory = (idx: number) => {
    const trimmed = editingCategoryName.trim();
    if (!trimmed) return;
    if (categories.includes(trimmed) && categories[idx] !== trimmed) {
      alert("Category already exists!");
      return;
    }
    const updated = [...categories];
    updated[idx] = trimmed;
    saveCategories(updated);
    setEditingCategoryIdx(null);
  };

  const handleDeleteCategory = (nameToDelete: string) => {
    if (categories.length <= 1) {
      alert("You must keep at least one category!");
      return;
    }
    const updated = categories.filter(c => c !== nameToDelete);
    saveCategories(updated);
    if (category === nameToDelete) {
      setCategory(updated[0]);
    }
  };

  // AI Insights State
  const [aiLoading, setAiLoading] = useState(false);
  const [aiInsightResult, setAiInsightResult] = useState<any>(null);
  const [isInsightModalOpen, setIsInsightModalOpen] = useState(false);

  const tasks = useLiveQuery(() => db.tasks.orderBy('deadline').reverse().toArray());

  const addTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const timeStr = deadline.trim() || '23:59';
    const datePart = selectedDate;
    const mergedDate = new Date(`${datePart}T${timeStr}:00`);

    const newTask: Task = {
      id: uuidv4(),
      title,
      description,
      status: 'pending',
      category,
      priority,
      deadline: mergedDate.toISOString(),
      completedAt: null,
      createdAt: new Date().toISOString()
    };

    await db.tasks.add(newTask);
    setTitle('');
    setDescription('');
    setDeadline('');
  };

  const toggleTaskStatus = async (task: Task) => {
    const isCompleted = task.status === 'completed';
    await db.tasks.update(task.id, {
      status: isCompleted ? 'pending' : 'completed',
      completedAt: isCompleted ? null : new Date().toISOString()
    });
  };

  const deleteTask = async (taskId: string) => {
    await db.tasks.delete(taskId);
  };

  // Extract AI Insights Function
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

  // Filter Tasks based on selectedDate and category/search
  const filteredTasks = useMemo((): Task[] => {
    if (!tasks) return [];

    const pickedDate = new Date(selectedDate);
    pickedDate.setHours(0, 0, 0, 0);
    const nextDay = new Date(pickedDate);
    nextDay.setDate(nextDay.getDate() + 1);

    return tasks.filter(task => {
      const taskDate = task.deadline ? new Date(task.deadline) : new Date(task.createdAt);
      if (taskDate < pickedDate || taskDate >= nextDay) return false;

      if (filterCategory !== 'All Categories' && task.category !== filterCategory) return false;

      if (searchQuery) {
        const matchTitle = task.title.toLowerCase().includes(searchQuery);
        const matchDesc = task.description?.toLowerCase().includes(searchQuery);
        if (!matchTitle && !matchDesc) return false;
      }

      return true;
    });
  }, [tasks, filterCategory, searchQuery, selectedDate]);

  const pendingTasks = filteredTasks.filter(t => t.status === 'pending');
  const completedTasks = filteredTasks.filter(t => t.status === 'completed');
  const totalTasks = filteredTasks.length;
  const percentCompleted = totalTasks === 0 ? 0 : Math.round((completedTasks.length / totalTasks) * 100);

  const headerDateString = new Date(selectedDate).toLocaleDateString(language === 'id' ? 'id-ID' : 'en-US', { weekday: 'long', month: 'short', day: 'numeric' });

  return (
    <div style={{ display: 'flex', gap: '32px', alignItems: 'flex-start' }}>

      {/* Left Column: New Objective */}
      <div style={{
        flex: '0 0 350px',
        backgroundColor: 'var(--surface-card)',
        borderRadius: '12px',
        padding: '24px',
        boxShadow: 'var(--shadow-level-1)',
        borderTop: '4px solid var(--color-motive-dark-blue)'
      }}>
        <h2 style={{ fontSize: '20px', color: 'var(--text-primary)', marginBottom: '24px', fontWeight: 600 }}>{t('new_objective')}</h2>

        <form onSubmit={addTask} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>{t('task_title')}</label>
              <span style={{ fontSize: '10px', color: '#dc2626' }}>{language === 'id' ? 'wajib' : 'mandatory'}</span>
            </div>
            <InputField
              placeholder={language === 'id' ? 'Apa yang harus dilakukan?' : 'What needs to be done?'}
              value={title}
              onChange={e => setTitle(e.target.value)}
              required
              style={{ width: '100%', backgroundColor: 'var(--surface-input)', border: '1px solid var(--border-input)', color: 'var(--text-primary)' }}
            />
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>{t('task_desc')}</label>
              <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{language === 'id' ? 'opsional' : 'optional'}</span>
            </div>
            <textarea
              placeholder={language === 'id' ? 'Rincian tugas...' : 'Break down the details...'}
              value={description}
              onChange={e => setDescription(e.target.value)}
              style={{
                width: '100%',
                minHeight: '80px',
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid var(--border-input)',
                backgroundColor: 'var(--surface-input)',
                color: 'var(--text-primary)',
                fontFamily: 'inherit',
                fontSize: '14px',
                resize: 'vertical',
                outline: 'none'
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '16px' }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>{t('category')}</label>
                <button 
                  type="button" 
                  onClick={() => setIsCategoryModalOpen(true)}
                  style={{ background: 'none', border: 'none', color: 'var(--color-motive-light-blue)', fontSize: '11px', cursor: 'pointer', fontWeight: 600, padding: 0 }}
                >
                  {t('manage_categories')}
                </button>
              </div>
              <select value={category} onChange={e => setCategory(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-input)', fontSize: '14px', backgroundColor: 'var(--surface-input)', color: 'var(--text-primary)', outline: 'none', cursor: 'pointer' }}>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>{t('priority')}</label>
              <select value={priority} onChange={e => setPriority(e.target.value as 'High' | 'Medium' | 'Low')} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-input)', fontSize: '14px', backgroundColor: 'var(--surface-input)', color: 'var(--text-primary)', outline: 'none', cursor: 'pointer' }}>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>
          </div>

          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>{t('deadline')}</label>
            <input
              type="time"
              value={deadline}
              onChange={e => setDeadline(e.target.value)}
              style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-input)', fontSize: '14px', backgroundColor: 'var(--surface-input)', color: 'var(--text-primary)', outline: 'none' }}
            />
          </div>

          <Button type="submit" style={{ width: '100%', padding: '14px', marginTop: '8px' }}>{t('add_task')}</Button>
        </form>
      </div>

      {/* Right Column: Daily Horizon */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Bottom Cards */}
        <div style={{ display: 'flex', gap: '24px', marginTop: '8px' }}>

          {/* Daily Velocity */}
          <div style={{
            flex: 1,
            boxShadow: 'var(--shadow-level-1)',
            borderTop: '4px solid var(--color-motive-dark-blue)',
            backgroundColor: 'var(--surface-card)',
            borderRadius: '12px',
            padding: '24px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '16px', fontWeight: 600 }}>{t('daily_velocity')}</h3>
              <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-secondary)' }}>{percentCompleted}% {t('completed')}</span>
            </div>

            {/* Progress Bar */}
            <div style={{ width: '100%', height: '4px', backgroundColor: 'var(--border-color)', borderRadius: '2px', marginBottom: '24px', overflow: 'hidden' }}>
              <div style={{ width: `${percentCompleted}%`, height: '100%', backgroundColor: 'var(--color-motive-light-blue)', transition: 'width 0.3s ease' }}></div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 500 }}>
              <span>{pendingTasks.length} {t('remaining')}</span>
            </div>
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

        {/* Header */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h1 style={{ fontSize: '28px', color: 'var(--text-primary)', fontWeight: 700, margin: 0 }}>{t('tasks')}</h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>{t('filter_by')}</span>
              <select
                value={filterCategory}
                onChange={e => setFilterCategory(e.target.value)}
                style={{ padding: '8px 32px 8px 16px', borderRadius: '20px', border: '1px solid var(--border-input)', fontSize: '14px', backgroundColor: 'var(--surface-input)', color: 'var(--text-primary)', outline: 'none', cursor: 'pointer' }}
              >
                <option value="All Categories">{t('all_categories')}</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '14px', color: 'var(--text-secondary)', fontWeight: 600 }}>{t('pick_date')}</span>
              <input
                type="date"
                value={selectedDate}
                onChange={e => setSelectedDate(e.target.value)}
                style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-input)', fontSize: '14px', backgroundColor: 'var(--surface-input)', color: 'var(--text-primary)', outline: 'none', cursor: 'pointer' }}
              />
            </div>
            <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '14px', fontWeight: 500 }}>
              {headerDateString}
            </p>
          </div>
        </div>

        {/* Task List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {filteredTasks.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px', backgroundColor: 'var(--surface-card)', borderRadius: '12px', color: 'var(--text-secondary)' }}>
              {t('no_tasks')}
            </div>
          ) : (
            filteredTasks.map(task => {
              const isDone = task.status === 'completed';
              const timeString = task.deadline ? new Date(task.deadline).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';

              return (
                <div key={task.id} style={{
                  display: 'flex',
                  backgroundColor: 'var(--surface-card)',
                  borderRadius: '12px',
                  padding: '20px',
                  boxShadow: 'var(--shadow-level-1)',
                  borderLeft: isDone ? '4px solid #10b981' : '4px solid #ef4444',
                  alignItems: 'flex-start',
                  gap: '16px',
                  opacity: isDone ? 0.7 : 1
                }}>
                  <div style={{ paddingTop: '2px' }}>
                    <div
                      onClick={() => toggleTaskStatus(task)}
                      style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '6px',
                        border: isDone ? 'none' : '2px solid var(--border-color)',
                        backgroundColor: isDone ? 'var(--color-motive-light-blue)' : 'transparent',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer'
                      }}
                    >
                      {isDone && <span style={{ color: 'white', fontSize: '14px' }}>✓</span>}
                    </div>
                  </div>

                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                      <span style={{
                        fontWeight: 600,
                        color: isDone ? 'var(--text-muted)' : 'var(--text-primary)',
                        textDecoration: isDone ? 'line-through' : 'none',
                        fontSize: '16px'
                      }}>
                        {task.title}
                      </span>
                      <Chip style={{ fontSize: '10px', padding: '2px 8px', backgroundColor: 'var(--chip-bg)', color: 'var(--color-motive-light-blue)', fontWeight: 600 }}>{task.category.toUpperCase()}</Chip>
                      {task.priority === 'High' && <Chip style={{ fontSize: '10px', padding: '2px 8px', backgroundColor: '#fee2e2', color: '#dc2626', fontWeight: 600 }}>HIGH</Chip>}
                      {task.priority === 'Medium' && <Chip style={{ fontSize: '10px', padding: '2px 8px', backgroundColor: '#fef3c7', color: '#d97706', fontWeight: 600 }}>MEDIUM</Chip>}
                      {task.priority === 'Low' && <Chip style={{ fontSize: '10px', padding: '2px 8px', backgroundColor: '#d1fae5', color: '#059669', fontWeight: 600 }}>LOW</Chip>}
                    </div>
                    {task.description && (
                      <p style={{
                        margin: 0,
                        fontSize: '14px',
                        color: 'var(--text-secondary)',
                        textDecoration: isDone ? 'line-through' : 'none',
                        lineHeight: 1.5
                      }}>
                        {task.description}
                      </p>
                    )}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600 }}>
                      {isDone ? 'DONE' : timeString}
                    </div>
                    <button
                      onClick={() => deleteTask(task.id)}
                      style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: '12px', cursor: 'pointer', padding: 0, opacity: 0.7, fontWeight: 500 }}
                    >
                      {language === 'id' ? 'Hapus' : 'Remove'}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

      </div>

      {/* Category Customizer Modal Overlay */}
      {isCategoryModalOpen && (
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
            maxWidth: '450px',
            width: '100%',
            boxShadow: 'var(--shadow-level-2)',
            display: 'flex',
            flexDirection: 'column',
            gap: '24px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '20px', color: 'var(--text-primary)', margin: 0, fontWeight: 600 }}>
                {t('manage_categories')}
              </h3>
              <button 
                onClick={() => setIsCategoryModalOpen(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
              >
                <FiX size={20} />
              </button>
            </div>

            {/* Add Category Form */}
            <div style={{ display: 'flex', gap: '12px' }}>
              <div style={{ flex: 1 }}>
                <InputField
                  placeholder={t('category_placeholder')}
                  value={newCategoryName}
                  onChange={e => setNewCategoryName(e.target.value)}
                  style={{ width: '100%', backgroundColor: 'var(--surface-input)', border: '1px solid var(--border-input)', color: 'var(--text-primary)' }}
                />
              </div>
              <Button onClick={handleAddCategory} style={{ padding: '0 20px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <FiPlus /> {t('save')}
              </Button>
            </div>

            {/* Categories List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '250px', overflowY: 'auto', paddingRight: '4px' }}>
              {categories.map((catName, idx) => (
                <div key={idx} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px',
                  backgroundColor: 'var(--surface-input)',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)'
                }}>
                  {editingCategoryIdx === idx ? (
                    <div style={{ display: 'flex', gap: '8px', flex: 1, marginRight: '12px' }}>
                      <InputField
                        value={editingCategoryName}
                        onChange={e => setEditingCategoryName(e.target.value)}
                        style={{ width: '100%', backgroundColor: 'var(--surface-card)', border: '1px solid var(--border-input)', color: 'var(--text-primary)', padding: '6px 12px' }}
                      />
                      <button 
                        onClick={() => handleSaveEditCategory(idx)}
                        style={{ background: 'none', border: 'none', color: '#10b981', cursor: 'pointer' }}
                        title={t('save')}
                      >
                        <FiCheck size={18} />
                      </button>
                    </div>
                  ) : (
                    <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {catName}
                    </span>
                  )}

                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    {editingCategoryIdx !== idx && (
                      <button 
                        onClick={() => handleStartEditCategory(idx, catName)}
                        style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: 0 }}
                        title={t('edit_category')}
                      >
                        <FiEdit2 size={16} />
                      </button>
                    )}
                    <button 
                      onClick={() => handleDeleteCategory(catName)}
                      style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: 0 }}
                      title={t('delete_category')}
                    >
                      <FiTrash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
              <Button variant="secondary" onClick={() => setIsCategoryModalOpen(false)} style={{ padding: '10px 24px' }}>
                {t('close')}
              </Button>
            </div>
          </div>
        </div>
      )}

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
