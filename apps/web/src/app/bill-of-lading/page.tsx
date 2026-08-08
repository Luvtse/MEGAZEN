'use client';

import React, { useState } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Save, Send, Eye } from 'lucide-react';

export default function BillOfLadingPage() {
  const [mode, setMode] = useState<'draft' | 'submit' | 'preview'>('draft');
  const [formData, setFormData] = useState({
    bolNumber: '',
    shipper: '',
    consignee: '',
    vessel: '',
    voyageNo: '',
    portOfLoading: '',
    portOfDischarge: '',
    prepaid: false,
    collect: false,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target as any;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  return (
    <DashboardLayout>
      <div className="p-8">
        <h1 className="text-3xl font-bold mb-8">Bill of Lading</h1>

        {/* Mode Tabs */}
        <div className="flex gap-2 p-1 bg-[#1a1a1a] rounded-lg mb-8 w-fit border border-gray-800">
          {(['draft', 'submit', 'preview'] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`flex items-center gap-2 px-4 py-2 rounded transition ${
                mode === m
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {m === 'draft' && <Save size={16} />}
              {m === 'submit' && <Send size={16} />}
              {m === 'preview' && <Eye size={16} />}
              {m.charAt(0).toUpperCase() + m.slice(1)}
            </button>
          ))}
        </div>

        {/* Amendment Counter */}
        <div className="bg-amber-500/10 border border-amber-500/50 rounded-lg p-4 mb-8">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-amber-400">Amendments Remaining:</span>
            <span className="text-2xl font-bold text-amber-400">3 / 3</span>
          </div>
        </div>

        {/* Form */}
        <div className="space-y-6">
          {/* Header Section */}
          <div className="bg-[#1a1a1a] rounded-lg border border-gray-800 p-6">
            <h2 className="text-lg font-semibold mb-4">Header & References</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">B/L Number *</label>
                <input
                  type="text"
                  name="bolNumber"
                  value={formData.bolNumber}
                  onChange={handleChange}
                  placeholder="e.g. MAEU984210549"
                  className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded text-white placeholder-gray-600 focus:border-blue-500 outline-none transition"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Vessel</label>
                <input
                  type="text"
                  name="vessel"
                  value={formData.vessel}
                  onChange={handleChange}
                  placeholder="e.g. MAERSK MC-KINNEY MOLLER"
                  className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded text-white placeholder-gray-600 focus:border-blue-500 outline-none transition"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Voyage Number</label>
                <input
                  type="text"
                  name="voyageNo"
                  value={formData.voyageNo}
                  onChange={handleChange}
                  placeholder="e.g. 2608E"
                  className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded text-white placeholder-gray-600 focus:border-blue-500 outline-none transition"
                />
              </div>
            </div>
          </div>

          {/* Parties Section */}
          <div className="bg-[#1a1a1a] rounded-lg border border-gray-800 p-6">
            <h2 className="text-lg font-semibold mb-4">Ocean Carriage Parties</h2>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Shipper *</label>
                <textarea
                  name="shipper"
                  value={formData.shipper}
                  onChange={handleChange}
                  placeholder="Full legal name and address..."
                  rows={2}
                  className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded text-white placeholder-gray-600 focus:border-blue-500 outline-none transition"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Consignee *</label>
                <textarea
                  name="consignee"
                  value={formData.consignee}
                  onChange={handleChange}
                  placeholder="Full legal name and address..."
                  rows={2}
                  className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded text-white placeholder-gray-600 focus:border-blue-500 outline-none transition"
                />
              </div>
            </div>
          </div>

          {/* Ports Section */}
          <div className="bg-[#1a1a1a] rounded-lg border border-gray-800 p-6">
            <h2 className="text-lg font-semibold mb-4">Ports</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Port of Loading *</label>
                <input
                  type="text"
                  name="portOfLoading"
                  value={formData.portOfLoading}
                  onChange={handleChange}
                  placeholder="e.g. SGSIN"
                  className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded text-white placeholder-gray-600 focus:border-blue-500 outline-none transition"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Port of Discharge *</label>
                <input
                  type="text"
                  name="portOfDischarge"
                  value={formData.portOfDischarge}
                  onChange={handleChange}
                  placeholder="e.g. USNYC"
                  className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded text-white placeholder-gray-600 focus:border-blue-500 outline-none transition"
                />
              </div>
            </div>
          </div>

          {/* Freight Terms */}
          <div className="bg-[#1a1a1a] rounded-lg border border-gray-800 p-6">
            <h2 className="text-lg font-semibold mb-4">Freight Terms</h2>
            <div className="flex gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="prepaid"
                  checked={formData.prepaid}
                  onChange={handleChange}
                  className="w-4 h-4 rounded border-gray-700 bg-gray-900"
                />
                <span className="text-sm font-medium">Prepaid</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="collect"
                  checked={formData.collect}
                  onChange={handleChange}
                  className="w-4 h-4 rounded border-gray-700 bg-gray-900"
                />
                <span className="text-sm font-medium">Collect</span>
              </label>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <button className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded transition flex items-center gap-2">
              <Save size={20} />
              {mode === 'draft' ? 'Save Draft' : mode === 'submit' ? 'Submit B/L' : 'Generate PDF'}
            </button>
            <button className="px-6 py-2 bg-gray-800 hover:bg-gray-700 text-white font-semibold rounded transition">
              Cancel
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
