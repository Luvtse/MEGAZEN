'use client';

import React from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';

export default function TrackingPage() {
  return (
    <DashboardLayout>
      <div className="p-8">
        <h1 className="text-3xl font-bold mb-8">Container Tracking</h1>
        <div className="bg-[#1a1a1a] rounded-lg border border-gray-800 p-8 text-center">
          <p className="text-gray-400">Real-time tracking coming soon...</p>
        </div>
      </div>
    </DashboardLayout>
  );
}
