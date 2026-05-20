export interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'pending' | 'completed';
  category: string; // e.g., 'Work', 'Study', 'Personal', 'Health'
  priority: 'High' | 'Medium' | 'Low';
  deadline: string; // ISO string
  completedAt: string | null; // ISO string
  createdAt: string; // ISO string
}

export interface DailyNote {
  id: string;
  title: string;
  content: string;
  charCount: number;
  timestamp: string; // ISO string
}

export interface DailyHighlight {
  date: string;
  highlight: string;
}

export interface Summary {
  id: string;
  date: string; // ISO or YYYY-MM-DD
  dateRangeStr?: string; // used for period summaries
  type: 'daily' | 'period';
  experience: string;
  reflection: string;
  action: string;
  dailyHighlights?: DailyHighlight[];
}
