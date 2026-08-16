import AdminLayout from '../../layouts/AdminLayout';
import { useAuth } from '../../contexts/AuthContext';

export default function AdminDashboard() {
  const { profile } = useAuth();

  return (
    <AdminLayout title="Dashboard">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">
        Welcome, {profile?.full_name || 'Admin'}!
      </h2>
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
    </AdminLayout>
  );
}