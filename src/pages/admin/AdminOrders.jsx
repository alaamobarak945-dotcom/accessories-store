import { useState, useEffect } from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import { supabase } from '../../lib/supabaseClient';

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    fetchOrders();
  }, [statusFilter]);

  async function fetchOrders() {
    setLoading(true);

    let query = supabase
      .from('orders')
      .select(`
        *,
        profiles (
          full_name,
          email,
          phone
        ),
        order_items (
          id,
          quantity,
          price_at_time,
          product_name,
          products (
            name
          )
        )
      `)
      .order('created_at', { ascending: false });

    if (statusFilter) {
      query = query.eq('status', statusFilter);
    }

    const { data, error } = await query;

    if (error) {
      setError('Error loading orders: ' + error.message);
    } else {
      setOrders(data || []);
    }

    setLoading(false);
  }

  async function handleStatusChange(orderId, newStatus) {
    setError('');

    const { error } = await supabase
      .from('orders')
      .update({ status: newStatus })
      .eq('id', orderId);

    if (error) {
      setError('Error updating order: ' + error.message);
    } else {
      fetchOrders();
    }
  }

  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-700',
    confirmed: 'bg-blue-100 text-blue-700',
    preparing: 'bg-purple-100 text-purple-700',
    shipped: 'bg-orange-100 text-orange-700',
    delivered: 'bg-green-100 text-green-700',
    cancelled: 'bg-red-100 text-red-700',
  };

  const statuses = ['pending', 'confirmed', 'preparing', 'shipped', 'delivered', 'cancelled'];

  return (
    <AdminLayout title="Orders">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-gray-400"
        >
          <option value="">All Statuses</option>
          {statuses.map((status) => (
            <option key={status} value={status}>
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </option>
          ))}
        </select>

        <div className="flex gap-2 text-sm">
          <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full">Pending</span>
          <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full">Confirmed</span>
          <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full">Preparing</span>
          <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full">Shipped</span>
          <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full">Delivered</span>
          <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full">Cancelled</span>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-4">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-12">
          <p className="text-gray-500">Loading orders...</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl shadow-sm">
          <p className="text-gray-500">No orders found.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order.id} className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-4 flex-wrap gap-4">
                <div>
                  <p className="text-sm text-gray-500">
                    Order ID: {order.id.substring(0, 8)}...
                  </p>
                  <p className="text-sm text-gray-500">
                    Customer: {order.profiles?.full_name || 'N/A'}
                  </p>
                  <p className="text-sm text-gray-500">
                    Email: {order.profiles?.email || 'N/A'}
                  </p>
                  <p className="text-sm text-gray-500">
                    Phone: {order.shipping_phone}
                  </p>
                  <p className="text-sm text-gray-500">
                    {new Date(order.created_at).toLocaleString()}
                  </p>
                </div>

                <select
                  value={order.status}
                  onChange={(e) => handleStatusChange(order.id, e.target.value)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium border-0 ${statusColors[order.status]}`}
                >
                  {statuses.map((status) => (
                    <option key={status} value={status}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2 mb-4">
                {order.order_items?.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span className="text-gray-600">
                      {item.product_name || item.products?.name || 'Deleted Product'} x {item.quantity}
                    </span>
                    <span className="text-gray-800">
                      ج.م {(item.price_at_time * item.quantity).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="border-t pt-4">
                <p className="text-gray-600 text-sm mb-1">
                  <strong>Address:</strong> {order.shipping_address}
                </p>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total</span>
                  <span className="text-gray-900 font-bold">
                    ج.م {parseFloat(order.total_amount).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </AdminLayout>
  );
}