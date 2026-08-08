'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { BarChart3, Package, Anchor, FileText, Truck, MapPin, Settings, LogOut, Menu, X } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: LayoutProps) {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
    } else {
      // Fetch user profile
      fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then(res => res.json())
        .then(data => setUser(data.data))
        .catch(() => {
          localStorage.removeItem('token');
          router.push('/login');
        });
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    router.push('/login');
  };

  const navItems = [
    { label: 'Dashboard', href: '/dashboard', icon: BarChart3 },
    { label: 'Bookings', href: '/bookings', icon: FileText },
    { label: 'Containers', href: '/containers', icon: Package },
    { label: 'Release Orders', href: '/release-orders', icon: Truck },
    { label: 'Delivery Orders', href: '/delivery-orders', icon: Truck },
    { label: 'Bill of Lading', href: '/bill-of-lading', icon: FileText },
    { label: 'Tracking', href: '/tracking', icon: Anchor },
    { label: 'Customers', href: '/customers', icon: Package },
    { label: 'Yard', href: '/yard', icon: MapPin },
    { label: 'Reports', href: '/reports', icon: BarChart3 },
    { label: 'Settings', href: '/settings', icon: Settings },
  ];

  return (
    <div className="flex h-screen bg-[#0a0a0a]">
      {/* Sidebar */}
      <aside
        className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-[#1a1a1a] border-r border-gray-800 transition-all duration-300 flex flex-col`}
      >
        <div className="p-4 border-b border-gray-800">
          <div className="flex items-center justify-between">
            {sidebarOpen && <h1 className="text-xl font-bold text-blue-500">MEGAZEN</h1>}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-gray-800 rounded transition"
            >
              {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 px-4 py-2 rounded hover:bg-gray-800 transition text-gray-300 hover:text-white"
              >
                <Icon size={20} />
                {sidebarOpen && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-800">
          {sidebarOpen && user && (
            <div className="mb-4 text-sm text-gray-400">
              <p className="font-semibold text-white">{user.firstName} {user.lastName}</p>
              <p className="text-xs">{user.email}</p>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-4 py-2 rounded hover:bg-gray-800 transition text-red-400 hover:text-red-300"
          >
            <LogOut size={20} />
            {sidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <div className="h-16 bg-[#1a1a1a] border-b border-gray-800 flex items-center px-6">
          <h2 className="text-xl font-semibold">Maritime Logistics Dashboard</h2>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
