import { useState, useEffect } from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import { supabase } from '../../lib/supabaseClient';

export default function AdminCustomers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchCustomers();
  }, []);

  async function fetchCustomers() {
    setLoading(true);
    setError('');

    // جلب كل العملاء
    const { data: profilesData, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'customer')
      .order('created_at', { ascending: false });

    if (profilesError) {
      setError('Error loading customers: ' + profilesError.message);
      setLoading(false);
      return;
    }

    // جلب الطلبات لكل عميل
    const { data: ordersData, error: ordersError } = await supabase
      .from('orders')
      .select('user_id, total_amount, status, created_at')
      .order('created_at', { ascending: false });

    if (ordersError) {
      setError('Error loading orders: ' + ordersError.message);
      setLoading(false);
      return;
    }

    // تجميع بيانات العملاء
    const customersWithStats = (profilesData || []).map((profile) => {
      const userOrders = (ordersData || []).filter(
        (order) => order.user_id === profile.id
      );

      const totalOrders = userOrders.length;
      const totalSpent = userOrders
        .filter((order) => order.status !== 'cancelled')
        .reduce((sum, order) => sum + parseFloat(order.total_amount), 0);

      const lastOrder = userOrders.length > 0 ? userOrders[0] : null;

      return {
        ...profile,
        totalOrders,
        totalSpent,
        lastOrderDate: lastOrder ? lastOrder.created_at : null,
        lastOrderStatus: lastOrder ? lastOrder.status : null,
      };
    });

    setCustomers(customersWithStats);
    setLoading(false);
  }

  const filteredCustomers = customers.filter(
    (customer) =>
      customer.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.phone?.includes(searchQuery)
  );

  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-700',
    confirmed: 'bg-blue-100 text-blue-700',
    preparing: 'bg-purple-100 text-purple-700',
    shipped: 'bg-orange-100 text-orange-700',
    delivered: 'bg-green-100 text-green-700',
    cancelled: 'bg-red-100 text-red-700',
  };

  return (
    <AdminLayout title="Customers">
      <div className="flex items-center justify-between mb-6">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search customers by name, email, or phone..."
          className="border border-gray-300 rounded-lg px-4 py-2 w-full md:w-96 focus:outline-none focus:ring-2 focus:ring-gray-400"
        />
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-4">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-12">
          <p className="text-gray-500">Loading customers...</p>
        </div>
      ) : filteredCustomers.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl shadow-sm">
          <p className="text-gray-500">No customers found.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Phone
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Total Orders
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Total Spent
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Last Order
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Last Order Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Joined At
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredCustomers.map((customer) => (
                <tr key={customer.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div>
                      <p className="text-gray-800 font-medium">
                        {customer.full_name || 'N/A'}
                      </p>
                      <p className="text-gray-500 text-sm">{customer.email}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-600">{customer.phone || 'N/A'}</td>
                  <td className="px-6 py-4">
                    <span className="text-gray-800 font-medium">
                      {customer.totalOrders}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-gray-800 font-medium">
                      ج.م {customer.totalSpent.toFixed(2)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-600">
                    {customer.lastOrderDate
                      ? new Date(customer.lastOrderDate).toLocaleDateString()
                      : '—'}
                  </td>
                  <td className="px-6 py-4">
                    {customer.lastOrderStatus ? (
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          statusColors[customer.lastOrderStatus] || 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {customer.lastOrderStatus.charAt(0).toUpperCase() +
                          customer.lastOrderStatus.slice(1)}
                      </span>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-gray-600">
                    {new Date(customer.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AdminLayout>
  );
}