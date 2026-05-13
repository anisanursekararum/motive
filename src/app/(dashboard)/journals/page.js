"use client";

import { Journaling } from '@/components/features/Journaling';
import { Suspense } from 'react';

export default function JournalsPage() {
  return (
    <Suspense fallback={<div>Loading journals...</div>}>
      <Journaling />
    </Suspense>
  );
}
