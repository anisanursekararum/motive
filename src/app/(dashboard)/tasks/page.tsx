"use client";

import { TaskManager } from '@/components/features/TaskManager';
import { Suspense } from 'react';

export default function TasksPage() {
  return (
    <Suspense fallback={<div>Loading tasks...</div>}>
      <TaskManager />
    </Suspense>
  );
}
