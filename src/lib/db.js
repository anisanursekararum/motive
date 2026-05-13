import Dexie from 'dexie';

export const db = new Dexie('MotiveDB');

db.version(1).stores({
  tasks: 'id, status, deadline, category, priority, completedAt',
  daily_notes: 'id, timestamp',
  summaries: 'id, date, type'
});
