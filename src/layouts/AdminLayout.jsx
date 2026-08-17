import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const menuItems = [
  { path: '/admin', label: 'Dashboard', icon: '📊' },
  { path: '/admin/products', label: 'Products', icon: '🛍️' },
  { path: '/admin/categories', label: 'Categories', icon: '📁' },
  { path: '/admin/orders', label: 'Orders', icon: '📦' },
  { path: '/admin/customers', label: 'Customers', icon: '👥' },
  { path: '/admin/analytics', label: 'Analytics', icon: '📈' },
];

export default function AdminLayout({ children, title }) {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error.message);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-full w-64 bg-black z-40 transform transition-transform duration-300 md:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-4 border-b border-gray-800 flex items-center justify-between">
          <Link to="/admin" className="text-lg font-bold text-white tracking-wide">
            M <span className="font-light">STYLE</span>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="text-gray-400 hover:text-white md:hidden text-xl"
          >
            ×
          </button>
        </div>

        <nav className="p-3 space-y-1">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setSidebarOpen(false)}
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-white hover:text-black transition text-sm tracking-wide"
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}

          {/* View Store Button */}
          <Link
            to="/"
            onClick={() => setSidebarOpen(false)}
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-white hover:text-black transition text-sm tracking-wide border-t border-gray-800 mt-3 pt-3"
          >
            <span>🏪</span>
            <span>View Store</span>
          </Link>
        </nav>

        <div className="p-4 border-t border-gray-800 absolute bottom-0 w-64 bg-black">
          <div className="text-gray-300 text-sm mb-2">{profile?.full_name || 'Admin'}</div>
          <button
            onClick={handleLogout}
            className="w-full bg-white text-black px-4 py-2 rounded-full hover:bg-gray-200 transition text-sm tracking-wide"
          >
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="md:ml-64">
        {/* Mobile Header */}
        <header className="bg-white border-b px-4 py-3 flex items-center justify-between md:hidden sticky top-0 z-20">
          <button onClick={() => setSidebarOpen(true)} className="text-2xl text-black">
            ☰
          </button>
          <h1 className="text-base font-semibold text-black tracking-wide">{title}</h1>
          <Link to="/" className="text-sm text-gray-600 hover:text-black">🏪</Link>
        </header>

        {/* Desktop Header */}
        <header className="bg-white border-b px-8 py-4 hidden md:flex items-center justify-between">
          <h1 className="text-2xl font-light text-black tracking-wide">{title}</h1>
          <Link
            to="/"
            className="text-sm text-gray-600 hover:text-black tracking-wide border border-gray-200 rounded-full px-4 py-1.5 hover:border-black transition"
          >
            🏪 View Store
          </Link>
        </header>

        <main className="p-3 md:p-6">{children}</main>
      </div>
    </div>
  );
}