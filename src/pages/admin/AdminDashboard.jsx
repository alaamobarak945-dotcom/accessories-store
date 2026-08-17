import AdminLayout from '../../layouts/AdminLayout';
import { useAuth } from '../../contexts/AuthContext';

export default function AdminDashboard() {
  const { profile } = useAuth();

  return (
    <AdminLayout title="Dashboard">
      <h2 className="text-xl md:text-2xl font-bold text-gray-800 mb-4 md:mb-6">
        Welcome, {profile?.full_name || 'Admin'}!
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        <div className="bg-white rounded-xl shadow-sm p-4 md:p-6">
          <h3 className="text-gray-500 text-xs md:text-sm">Total Revenue</h3>
          <p className="text-xl md:text-2xl font-bold text-gray-800 mt-1 md:mt-2">ج.م 0.00</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 md:p-6">
          <h3 className="text-gray-500 text-xs md:text-sm">Total Orders</h3>
          <p className="text-xl md:text-2xl font-bold text-gray-800 mt-1 md:mt-2">0</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 md:p-6">
          <h3 className="text-gray-500 text-xs md:text-sm">Total Products</h3>
          <p className="text-xl md:text-2xl font-bold text-gray-800 mt-1 md:mt-2">0</p>
        </div>
      </div>
    </AdminLayout>
  );
}