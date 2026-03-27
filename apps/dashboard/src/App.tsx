import React from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import ReviewQueue from './pages/ReviewQueue.js';

// Layout Component
const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="flex h-screen bg-gray-50 text-gray-900">
    {/* Sidebar */}
    <aside className="w-64 bg-white border-r border-gray-200">
      <div className="p-6">
        <h1 className="text-xl font-bold tracking-tight">Cronus</h1>
        <p className="text-xs text-gray-500 uppercase tracking-widest mt-1">Metabolus</p>
      </div>
      <nav className="mt-6 px-4 space-y-1">
        <Link to="/" className="block px-4 py-2 text-sm font-medium hover:bg-gray-100 rounded-lg">
          Dashboard
        </Link>
        <Link to="/assets" className="block px-4 py-2 text-sm font-medium hover:bg-gray-100 rounded-lg">
          Assets
        </Link>
        <Link to="/review" className="block px-4 py-2 text-sm font-medium hover:bg-gray-100 rounded-lg bg-gray-100">
          Review Queue
        </Link>
        <Link to="/calendar" className="block px-4 py-2 text-sm font-medium hover:bg-gray-100 rounded-lg">
          Calendar
        </Link>
        <Link to="/identity" className="block px-4 py-2 text-sm font-medium hover:bg-gray-100 rounded-lg">
          Brand Identity
        </Link>
      </nav>
    </aside>

    {/* Main Content */}
    <main className="flex-1 overflow-y-auto">
      <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8">
        <div className="flex items-center space-x-4">
          <span className="text-sm font-medium text-gray-500">Brand:</span>
          <select className="text-sm border-none bg-transparent font-semibold focus:ring-0 cursor-pointer">
            <option>Lefler Design</option>
          </select>
        </div>
        <div className="flex items-center space-x-4">
          <button className="px-4 py-2 bg-black text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors">
            Upload Asset
          </button>
        </div>
      </header>
      <div className="p-8 max-w-7xl mx-auto">
        {children}
      </div>
    </main>
  </div>
);

// Placeholder Pages
const DashboardHome = () => <h2 className="text-2xl font-bold text-gray-900">Brand Overview</h2>;
const AssetList = () => <h2 className="text-2xl font-bold text-gray-900">Source Assets</h2>;
const Calendar = () => <h2 className="text-2xl font-bold text-gray-900">Publishing Calendar</h2>;
const Identity = () => <h2 className="text-2xl font-bold text-gray-900">Natural Center</h2>;

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<DashboardHome />} />
        <Route path="/assets" element={<AssetList />} />
        <Route path="/review" element={<ReviewQueue />} />
        <Route path="/calendar" element={<Calendar />} />
        <Route path="/identity" element={<Identity />} />
      </Routes>
    </Layout>
  );
}
