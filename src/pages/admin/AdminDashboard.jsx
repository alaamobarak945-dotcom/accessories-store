import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export default function AdminDashboard() {
  const { profile, signOut } = useAuth();

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Logout error:', error.message);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-gray-900 text-white px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/admin" className="text-xl font-bold">
            🛍️ Admin Panel
          </Link>
          <span className="text-gray-400 text-sm">Dashboard</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-gray-300 text-sm">
            {profile?.full_name || 'Admin'}
          </span>
          <button
            onClick={handleLogout}
            className="bg-red-600 px-4 py-2 rounded-lg hover:bg-red-700 transition text-sm"
          >
            Logout
          </button>
        </div>
      </nav>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-gray-800 min-h-screen p-4">
          <nav className="space-y-2">
            <Link
              to="/admin"
              className="block px-4 py-2 rounded-lg bg-gray-700 text-white"
            >
              Dashboard
            </Link>
            <Link
              to="/admin/products"
              className="block px-4 py-2 rounded-lg text-gray-300 hover:bg-gray-700 hover:text-white transition"
            >
              Products
            </Link>
            <Link
              to="/admin/categories"
              className="block px-4 py-2 rounded-lg text-gray-300 hover:bg-gray-700 hover:text-white transition"
            >
              Categories
            </Link>
            <Link
              to="/admin/orders"
              className="block px-4 py-2 rounded-lg text-gray-300 hover:bg-gray-700 hover:text-white transition"
            >
              Orders
            </Link>
            <Link
              to="/admin/customers"
              className="block px-4 py-2 rounded-lg text-gray-300 hover:bg-gray-700 hover:text-white transition"
            >
              Customers
            </Link>
            <Link
              to="/admin/analytics"
              className="block px-4 py-2 rounded-lg text-gray-300 hover:bg-gray-700 hover:text-white transition"
            >
              Analytics
            </Link>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-6">
            Welcome, {profile?.full_name || 'Admin'}!
          </h1>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-gray-500 text-sm">Total Revenue</h3>
              <p className="text-2xl font-bold text-gray-800 mt-2">$0.00</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-gray-500 text-sm">Total Orders</h3>
              <p className="text-2xl font-bold text-gray-800 mt-2">0</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-gray-500 text-sm">Total Products</h3>
              <p className="text-2xl font-bold text-gray-800 mt-2">0</p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}