'use client';

import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Activity, Package, TrendingUp, DollarSign, Clock, MapPin } from 'lucide-react';

interface StatCard {
  title: string;
  value: string | number;
  change: string;
  icon: React.ReactNode;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<StatCard[]>([
    {
      title: 'Total Containers',
      value: '2,345',
      change: '+12% from last month',
      icon: <Package className="text-blue-500" size={24} />,
    },
    {
      title: 'Active Bookings',
      value: '156',
      change: '+8% from last month',
      icon: <Activity className="text-green-500" size={24} />,
    },
    {
      title: 'On-Time Rate',
      value: '94.2%',
      change: '+2.1% from last month',
      icon: <TrendingUp className="text-purple-500" size={24} />,
    },
    {
      title: 'Revenue (This Month)',
      value: '$125,430',
      change: '+18% from last month',
      icon: <DollarSign className="text-yellow-500" size={24} />,
    },
    {
      title: 'Pending Approvals',
      value: '23',
      change: '+5 since yesterday',
      icon: <Clock className="text-red-500" size={24} />,
    },
    {
      title: 'Yard Occupancy',
      value: '78%',
      change: 'Moderate capacity',
      icon: <MapPin className="text-cyan-500" size={24} />,
    },
  ]);

  return (
    <DashboardLayout>
      <div className="p-8">
        <h1 className="text-3xl font-bold mb-8">Dashboard</h1>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="bg-[#1a1a1a] rounded-lg border border-gray-800 p-6 hover:border-gray-700 transition"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-gray-400 text-sm">{stat.title}</p>
                  <h3 className="text-3xl font-bold mt-1">{stat.value}</h3>
                </div>
                <div className="p-3 bg-gray-900 rounded-lg">{stat.icon}</div>
              </div>
              <p className="text-xs text-gray-500">{stat.change}</p>
            </div>
          ))}
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Activity Feed */}
          <div className="bg-[#1a1a1a] rounded-lg border border-gray-800 p-6">
            <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
            <div className="space-y-4">
              {[
                { type: 'Booking Created', desc: 'BK-2024-001234', time: '2 minutes ago' },
                { type: 'Container Assigned', desc: 'MSKU8841029', time: '5 minutes ago' },
                { type: 'Release Order Issued', desc: 'RO-2024-0567', time: '12 minutes ago' },
                { type: 'B/L Submitted', desc: 'MAEU984210549', time: '25 minutes ago' },
              ].map((activity, i) => (
                <div key={i} className="flex items-start gap-4 pb-4 border-b border-gray-800 last:border-0">
                  <div className="w-2 h-2 mt-2 bg-blue-500 rounded-full flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{activity.type}</p>
                    <p className="text-gray-400 text-xs">{activity.desc}</p>
                  </div>
                  <p className="text-gray-500 text-xs whitespace-nowrap">{activity.time}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Container Status */}
          <div className="bg-[#1a1a1a] rounded-lg border border-gray-800 p-6">
            <h2 className="text-xl font-semibold mb-4">Container Status</h2>
            <div className="space-y-4">
              {[
                { status: 'Available', count: 1245, color: 'bg-green-500' },
                { status: 'In Transit', count: 789, color: 'bg-blue-500' },
                { status: 'Arrived', count: 234, color: 'bg-purple-500' },
                { status: 'Maintenance', count: 77, color: 'bg-yellow-500' },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${item.color}`} />
                    <span className="text-sm">{item.status}</span>
                  </div>
                  <span className="font-semibold">{item.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
