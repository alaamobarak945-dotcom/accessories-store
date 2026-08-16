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

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error.message);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-900 min-h-screen fixed left-0 top-0 overflow-y-auto">
        <div className="p-4 border-b border-gray-800">
          <Link to="/admin" className="text-xl font-bold text-white">
            🛍️ Admin Panel
          </Link>
        </div>
        <nav className="p-4 space-y-1">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-gray-800 hover:text-white transition"
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-gray-800 absolute bottom-0 w-64">
          <div className="text-gray-300 text-sm mb-2">
            {profile?.full_name || 'Admin'}
          </div>
          <button
            onClick={handleLogout}
            className="w-full bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition text-sm"
          >
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 ml-64">
        <header className="bg-white shadow-sm px-8 py-4">
          <h1 className="text-2xl font-bold text-gray-800">{title}</h1>
        </header>
        <main className="p-8">{children}</main>
      </div>
    </div>
  );
}