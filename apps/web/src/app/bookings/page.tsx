'use client';

import React, { useState } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Plus, Search, Filter } from 'lucide-react';

export default function BookingsPage() {
  const [bookings, setBookings] = useState([
    {
      id: '1',
      bookingNumber: 'BK-2024-001234',
      customer: 'Acme Import Co.',
      origin: 'SGSIN',
      destination: 'USNYC',
      status: 'approved',
      cargoType: 'General Cargo',
      createdAt: '2024-01-15',
    },
    {
      id: '2',
      bookingNumber: 'BK-2024-001235',
      customer: 'Global Exports Ltd.',
      origin: 'CNSHA',
      destination: 'EUBRU',
      status: 'pending',
      cargoType: 'Electronics',
      createdAt: '2024-01-16',
    },
  ]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-500/20 text-green-400';
      case 'pending':
        return 'bg-yellow-500/20 text-yellow-400';
      case 'cancelled':
        return 'bg-red-500/20 text-red-400';
      default:
        return 'bg-gray-500/20 text-gray-400';
    }
  };

  return (
    <DashboardLayout>
      <div className="p-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Bookings</h1>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-white font-semibold transition">
            <Plus size={20} />
            Create Booking
          </button>
        </div>

        {/* Filters */}
        <div className="flex gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 text-gray-600" size={20} />
            <input
              type="text"
              placeholder="Search bookings..."
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
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-300">Booking #</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-300">Customer</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-300">Route</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-300">Cargo Type</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-300">Status</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-300">Created</th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-gray-300">Actions</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((booking) => (
                <tr key={booking.id} className="border-b border-gray-800 hover:bg-gray-900/50 transition">
                  <td className="px-6 py-4 text-sm font-medium">{booking.bookingNumber}</td>
                  <td className="px-6 py-4 text-sm text-gray-400">{booking.customer}</td>
                  <td className="px-6 py-4 text-sm text-gray-400">{booking.origin} → {booking.destination}</td>
                  <td className="px-6 py-4 text-sm text-gray-400">{booking.cargoType}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-block px-3 py-1 rounded text-xs font-medium ${getStatusColor(booking.status)}`}>
                      {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-400">{booking.createdAt}</td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-blue-400 hover:text-blue-300 text-sm font-medium transition">View</button>
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
