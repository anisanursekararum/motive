import { db } from './db';
import { Task, DailyNote, Summary } from '@/types';

export interface BackupData {
  tasks?: Task[];
  daily_notes?: DailyNote[];
  summaries?: Summary[];
}

export async function exportData(): Promise<string> {
  const tasks = await db.tasks.toArray();
  const daily_notes = await db.daily_notes.toArray();
  const summaries = await db.summaries.toArray();
  
  const data: BackupData = { tasks, daily_notes, summaries };
  return JSON.stringify(data, null, 2);
}

export async function importData(jsonData: string): Promise<{ success: boolean; error?: string }> {
  try {
    const data = JSON.parse(jsonData) as BackupData;
    
    // Validate schema basic
    if (data.tasks && Array.isArray(data.tasks)) {
      await db.tasks.bulkPut(data.tasks);
    }
    if (data.daily_notes && Array.isArray(data.daily_notes)) {
      await db.daily_notes.bulkPut(data.daily_notes);
    }
    if (data.summaries && Array.isArray(data.summaries)) {
      await db.summaries.bulkPut(data.summaries);
    }
    
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error?.message || 'Unknown import error' };
  }
}

export function downloadJsonFile(jsonData: string, filename = 'motive_backup.json'): void {
  const blob = new Blob([jsonData], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
