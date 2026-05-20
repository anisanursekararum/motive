import Dexie, { type Table } from 'dexie';
import { Task, DailyNote, Summary } from '@/types';

export class MotiveDatabase extends Dexie {
  tasks!: Table<Task, string>;
  daily_notes!: Table<DailyNote, string>;
  summaries!: Table<Summary, string>;

  constructor() {
    super('MotiveDB');
    this.version(1).stores({
      tasks: 'id, status, deadline, category, priority, completedAt',
      daily_notes: 'id, timestamp',
      summaries: 'id, date, type'
    });
  }
}

export const db = new MotiveDatabase();
