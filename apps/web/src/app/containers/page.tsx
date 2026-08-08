'use client';

import React from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Plus, Search, Filter } from 'lucide-react';

export default function ContainersPage() {
  const [containers] = React.useState([
    {
      id: '1',
      containerNumber: 'MSKU8841029',
      type: '40ft HC',
      status: 'available',
      carrier: 'Maersk',
      location: 'SGSIN',
    },
    {
      id: '2',
      containerNumber: 'TCLU3254789',
      type: '20ft',
      status: 'in-transit',
      carrier: 'MSC',
      location: 'At Sea',
    },
  ]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-green-500/20 text-green-400';
      case 'in-transit':
        return 'bg-blue-500/20 text-blue-400';
      case 'arrived':
        return 'bg-purple-500/20 text-purple-400';
      case 'maintenance':
        return 'bg-yellow-500/20 text-yellow-400';
      default:
        return 'bg-gray-500/20 text-gray-400';
    }
  };

  return (
    <DashboardLayout>
      <div className="p-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Containers</h1>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-white font-semibold transition">
            <Plus size={20} />
            Register Container
          </button>
        </div>

        {/* Filters */}
        <div className="flex gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 text-gray-600" size={20} />
            <input
              type="text"
              placeholder="Search containers..."
              className="w-full pl-10 pr-4 py-2 bg-[#1a1a1a] border border-gray-800 rounded text-white placeholder-gray-600 focus:border-blue-500 outline-none transition"
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-[#1a1a1a] border border-gray-800 rounded hover:border-gray-700 text-gray-300 transition">
            <Filter size={20} />
            Filters
          </button>
        </div>

        {/* Table */}
        <div className="bg-[#1a1a1a] rounded-lg border border-gray-800 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-800 bg-gray-900/50">
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-300">Container #</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-300">Type</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-300">Status</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-300">Carrier</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-300">Location</th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-gray-300">Actions</th>
              </tr>
            </thead>
            <tbody>
              {containers.map((container) => (
                <tr key={container.id} className="border-b border-gray-800 hover:bg-gray-900/50 transition">
                  <td className="px-6 py-4 text-sm font-medium">{container.containerNumber}</td>
                  <td className="px-6 py-4 text-sm text-gray-400">{container.type}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-block px-3 py-1 rounded text-xs font-medium ${getStatusColor(container.status)}`}>
                      {container.status.replace('-', ' ').charAt(0).toUpperCase() + container.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-400">{container.carrier}</td>
                  <td className="px-6 py-4 text-sm text-gray-400">{container.location}</td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-blue-400 hover:text-blue-300 text-sm font-medium transition">Track</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
}
