"use client";
import React, { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';
import { Button } from '@/components/ui/Button';
import { InputField } from '@/components/ui/InputField';
import { Chip } from '@/components/ui/Chip';
import { useSearchParams } from 'next/navigation';

export function TaskManager() {
  const searchParams = useSearchParams();
  const searchQuery = (searchParams?.get('q') || '').toLowerCase();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Work');
  const [priority, setPriority] = useState('Low');
  const [deadline, setDeadline] = useState('');
  
  const [filterCategory, setFilterCategory] = useState('All Categories');

  const tasks = useLiveQuery(() => db.tasks.orderBy('deadline').reverse().toArray());

  const addTask = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    
    const newTask = {
      id: uuidv4(),
      title,
      description,
      status: 'pending',
      category,
      priority,
      deadline: deadline ? new Date(deadline).toISOString() : new Date().toISOString(),
      completedAt: null,
      createdAt: new Date().toISOString()
    };
    
    await db.tasks.add(newTask);
    setTitle('');
    setDescription('');
    setDeadline('');
  };

  const toggleTaskStatus = async (task) => {
    const isCompleted = task.status === 'completed';
    await db.tasks.update(task.id, {
      status: isCompleted ? 'pending' : 'completed',
      completedAt: isCompleted ? null : new Date().toISOString()
    });
  };

  const deleteTask = async (taskId) => {
    await db.tasks.delete(taskId);
  };

  // Filter Tasks for "Today" and by category/search
  const filteredTasks = useMemo(() => {
    if (!tasks) return [];
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return tasks.filter(task => {
      // Date filter (only today)
      const taskDate = task.deadline ? new Date(task.deadline) : new Date(task.createdAt);
      if (taskDate < today || taskDate >= tomorrow) return false;

      // Category filter
      if (filterCategory !== 'All Categories' && task.category !== filterCategory) return false;

      // Search filter
      if (searchQuery) {
        const matchTitle = task.title.toLowerCase().includes(searchQuery);
        const matchDesc = task.description?.toLowerCase().includes(searchQuery);
        if (!matchTitle && !matchDesc) return false;
      }

      return true;
    });
  }, [tasks, filterCategory, searchQuery]);

  const pendingTasks = filteredTasks.filter(t => t.status === 'pending');
  const completedTasks = filteredTasks.filter(t => t.status === 'completed');
  const totalTasks = filteredTasks.length;
  const percentCompleted = totalTasks === 0 ? 0 : Math.round((completedTasks.length / totalTasks) * 100);

  // Format today's date for the header
  const todayDateString = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });

  return (
    <div style={{ display: 'flex', gap: '32px', alignItems: 'flex-start' }}>
      
      {/* Left Column: New Objective */}
      <div style={{ 
        flex: '0 0 350px', 
        backgroundColor: 'var(--color-white)', 
        borderRadius: '12px', 
        padding: '24px', 
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)' 
      }}>
        <h2 style={{ fontSize: '20px', color: 'var(--color-motive-dark-blue)', marginBottom: '24px', fontWeight: 600 }}>New Objective</h2>
        
        <form onSubmit={addTask} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-dark-gray)' }}>Task Title</label>
              <span style={{ fontSize: '10px', color: '#dc2626' }}>mandatory</span>
            </div>
            <InputField 
              placeholder="What needs to be done?" 
              value={title} 
              onChange={e => setTitle(e.target.value)} 
              required
              style={{ width: '100%', backgroundColor: '#f9fafb', border: '1px solid #e5e7eb' }}
            />
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-dark-gray)' }}>Description</label>
              <span style={{ fontSize: '10px', color: 'var(--color-dark-gray)', opacity: 0.7 }}>optional</span>
            </div>
            <textarea 
              placeholder="Break down the details..." 
              value={description}
              onChange={e => setDescription(e.target.value)}
              style={{ 
                width: '100%', 
                minHeight: '80px', 
                padding: '12px', 
                borderRadius: '8px', 
                border: '1px solid #e5e7eb',
                backgroundColor: '#f9fafb',
                fontFamily: 'inherit',
                fontSize: '14px',
                resize: 'vertical',
                outline: 'none'
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '16px' }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-dark-gray)', display: 'block', marginBottom: '8px' }}>Category</label>
              <select value={category} onChange={e => setCategory(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '14px', backgroundColor: '#f9fafb', outline: 'none' }}>
                <option value="Work">Work</option>
                <option value="Study">Study</option>
                <option value="Personal">Personal</option>
                <option value="Health">Health</option>
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-dark-gray)', display: 'block', marginBottom: '8px' }}>Priority</label>
              <select value={priority} onChange={e => setPriority(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '14px', backgroundColor: '#f9fafb', outline: 'none' }}>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>
          </div>

          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-dark-gray)', display: 'block', marginBottom: '8px' }}>Due Date</label>
            <input 
              type="datetime-local" 
              value={deadline} 
              onChange={e => setDeadline(e.target.value)} 
              style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '14px', backgroundColor: '#f9fafb', outline: 'none' }}
            />
          </div>

          <Button type="submit" style={{ width: '100%', padding: '14px', marginTop: '8px' }}>Create Task</Button>
        </form>
      </div>

      {/* Right Column: Daily Horizon */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {/* Bottom Cards */}
        <div style={{ display: 'flex', gap: '24px', marginTop: '8px' }}>
          
          {/* Daily Velocity */}
          <div style={{ 
            flex: 1,
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)', 
            borderTop: '4px solid var(--color-motive-dark-blue)',
            backgroundColor: 'white',
            borderRadius: '12px', 
            padding: '24px' 
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, color: 'var(--color-motive-dark-blue)', fontSize: '16px', fontWeight: 600 }}>Daily Velocity</h3>
              <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-dark-gray)' }}>{percentCompleted}% Completed</span>
            </div>
            
            {/* Progress Bar */}
            <div style={{ width: '100%', height: '4px', backgroundColor: '#d1d5db', borderRadius: '2px', marginBottom: '24px', overflow: 'hidden' }}>
              <div style={{ width: `${percentCompleted}%`, height: '100%', backgroundColor: 'var(--color-motive-dark-blue)', transition: 'width 0.3s ease' }}></div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--color-dark-gray)', fontWeight: 500 }}>
              <span>{pendingTasks.length} Tasks Remaining</span>
            </div>
          </div>

          {/* ERA Cycle Ready */}
          <div style={{ 
            flex: 1, 
            backgroundColor: 'var(--color-motive-dark-blue)', 
            borderRadius: '12px', 
            padding: '24px',
            color: 'white'
          }}>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <span style={{ fontSize: '20px' }}>✨</span> ERA Cycle Ready
            </h3>
            <Button style={{ backgroundColor: 'var(--color-motive-light-blue)', color: 'white', padding: '8px 24px', fontSize: '14px', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}>
             ⚡Process with AI
            </Button>
          </div>

        </div>
        {/* Header */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h1 style={{ fontSize: '28px', color: 'var(--color-motive-dark-blue)', fontWeight: 700, margin: 0 }}>Today's Tasks</h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '14px', color: 'var(--color-dark-gray)' }}>Filter by:</span>
              <select 
                value={filterCategory} 
                onChange={e => setFilterCategory(e.target.value)}
                style={{ padding: '8px 32px 8px 16px', borderRadius: '20px', border: '1px solid #e5e7eb', fontSize: '14px', backgroundColor: 'white', outline: 'none', cursor: 'pointer' }}
              >
                <option value="All Categories">All Categories</option>
                <option value="Work">Work</option>
                <option value="Study">Study</option>
                <option value="Personal">Personal</option>
                <option value="Health">Health</option>
              </select>
            </div>
          </div>
          <p style={{ color: 'var(--color-dark-gray)', margin: '8px 0 0 0', fontSize: '14px' }}>
            {todayDateString}
          </p>
        </div>

        {/* Task List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {filteredTasks.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px', backgroundColor: 'white', borderRadius: '12px', color: 'var(--color-dark-gray)' }}>
              No tasks found for today. Enjoy your day!
            </div>
          ) : (
            filteredTasks.map(task => {
              const isDone = task.status === 'completed';
              const timeString = task.deadline ? new Date(task.deadline).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '';
              
              return (
                <div key={task.id} style={{ 
                  display: 'flex', 
                  backgroundColor: 'white', 
                  borderRadius: '12px', 
                  padding: '20px', 
                  boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                  borderLeft: isDone ? '4px solid #10b981' : '4px solid var(--color-motive-dark-blue)',
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
                        border: isDone ? 'none' : '2px solid #d1d5db',
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
                        color: isDone ? 'var(--color-dark-gray)' : 'var(--color-motive-dark-blue)',
                        textDecoration: isDone ? 'line-through' : 'none',
                        fontSize: '16px'
                      }}>
                        {task.title}
                      </span>
                      <Chip style={{ fontSize: '10px', padding: '2px 8px', backgroundColor: '#eef2ff', color: 'var(--color-motive-light-blue)', fontWeight: 600 }}>{task.category.toUpperCase()}</Chip>
                      {task.priority === 'High' && <Chip style={{ fontSize: '10px', padding: '2px 8px', backgroundColor: '#fee2e2', color: '#dc2626', fontWeight: 600 }}>HIGH</Chip>}
                      {task.priority === 'Medium' && <Chip style={{ fontSize: '10px', padding: '2px 8px', backgroundColor: '#fef3c7', color: '#d97706', fontWeight: 600 }}>MEDIUM</Chip>}
                      {task.priority === 'Low' && <Chip style={{ fontSize: '10px', padding: '2px 8px', backgroundColor: '#d1fae5', color: '#059669', fontWeight: 600 }}>LOW</Chip>}
                    </div>
                    {task.description && (
                      <p style={{ 
                        margin: 0, 
                        fontSize: '14px', 
                        color: 'var(--color-dark-gray)',
                        textDecoration: isDone ? 'line-through' : 'none',
                        lineHeight: 1.5
                      }}>
                        {task.description}
                      </p>
                    )}
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                    <div style={{ fontSize: '12px', color: 'var(--color-dark-gray)', fontWeight: 600 }}>
                      {isDone ? 'DONE' : timeString}
                    </div>
                    <button 
                      onClick={() => deleteTask(task.id)}
                      style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: '12px', cursor: 'pointer', padding: 0, opacity: 0.7, fontWeight: 500 }}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

      </div>
    </div>
  );
}
