import AdminLayout from '../../layouts/AdminLayout';
import { useAuth } from '../../contexts/AuthContext';

export default function AdminDashboard() {
  const { profile } = useAuth();

  return (
    <AdminLayout title="Dashboard">
      <h2 className="text-xl font-light text-black mb-4 tracking-wide">
        Welcome, {profile?.full_name || 'Admin'}
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <div className="border border-gray-100 rounded-xl p-4 hover:border-black transition">
          <h3 className="text-gray-400 text-xs tracking-widest uppercase">Revenue</h3>
          <p className="text-xl font-bold text-black mt-1">ج.م 0.00</p>
        </div>
        <div className="border border-gray-100 rounded-xl p-4 hover:border-black transition">
          <h3 className="text-gray-400 text-xs tracking-widest uppercase">Orders</h3>
          <p className="text-xl font-bold text-black mt-1">0</p>
        </div>
        <div className="border border-gray-100 rounded-xl p-4 hover:border-black transition">
          <h3 className="text-gray-400 text-xs tracking-widest uppercase">Products</h3>
          <p className="text-xl font-bold text-black mt-1">0</p>
        </div>
      </div>
    </AdminLayout>
  );
}