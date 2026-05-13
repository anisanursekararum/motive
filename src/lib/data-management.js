import { db } from './db';

export async function exportData() {
  const tasks = await db.tasks.toArray();
  const daily_notes = await db.daily_notes.toArray();
  const summaries = await db.summaries.toArray();
  
  const data = { tasks, daily_notes, summaries };
  return JSON.stringify(data, null, 2);
}

export async function importData(jsonData) {
  try {
    const data = JSON.parse(jsonData);
    
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
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export function downloadJsonFile(jsonData, filename = 'motive_backup.json') {
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
