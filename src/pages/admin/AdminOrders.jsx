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
        profiles (full_name, email, phone),
        order_items (id, quantity, price_at_time, product_name, products (name))
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
    const { error } = await supabase.from('orders').update({ status: newStatus }).eq('id', orderId);
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

  function getPaymentMethodLabel(method) {
    if (method === 'cod') return 'Cash on Delivery';
    if (method === 'vodafone_cash') return 'Vodafone Cash';
    if (method === 'instapay') return 'InstaPay';
    return method || 'Cash on Delivery';
  }

  function getPaymentMethodColor(method) {
    if (method === 'cod') return 'bg-gray-100 text-gray-700';
    if (method === 'vodafone_cash') return 'bg-red-100 text-red-700';
    if (method === 'instapay') return 'bg-purple-100 text-purple-700';
    return 'bg-gray-100 text-gray-700';
  }

  return (
    <AdminLayout title="Orders">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 md:mb-6 gap-3">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none text-sm w-full md:w-auto"
        >
          <option value="">All Statuses</option>
          {statuses.map((status) => (
            <option key={status} value={status}>{status.charAt(0).toUpperCase() + status.slice(1)}</option>
          ))}
        </select>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-4 text-sm">{error}</div>
      )}

      {loading ? (
        <div className="text-center py-12"><p className="text-gray-500">Loading orders...</p></div>
      ) : orders.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl shadow-sm"><p className="text-gray-500">No orders found.</p></div>
      ) : (
        <div className="space-y-3 md:space-y-4">
          {orders.map((order) => (
            <div key={order.id} className="bg-white rounded-xl shadow-sm p-4 md:p-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between mb-3 gap-3">
                <div className="space-y-1">
                  <p className="text-xs text-gray-500">Order ID: {order.id.substring(0, 8)}...</p>
                  <p className="text-sm text-gray-800 font-medium">{order.profiles?.full_name || 'N/A'}</p>
                  <p className="text-xs text-gray-500">Phone: {order.shipping_phone}</p>
                  <p className="text-xs text-gray-500">{new Date(order.created_at).toLocaleString()}</p>
                </div>
                <div className="flex flex-wrap gap-2 items-center">
                  <span className={`px-2 py-1 rounded-full text-[10px] font-medium ${getPaymentMethodColor(order.payment_method)}`}>
                    {getPaymentMethodLabel(order.payment_method)}
                  </span>
                  <select
                    value={order.status}
                    onChange={(e) => handleStatusChange(order.id, e.target.value)}
                    className={`px-2 py-1 rounded-lg text-xs font-medium border-0 ${statusColors[order.status]}`}
                  >
                    {statuses.map((status) => (
                      <option key={status} value={status}>{status.charAt(0).toUpperCase() + status.slice(1)}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1 mb-3">
                {order.order_items?.map((item) => (
                  <div key={item.id} className="flex justify-between text-xs md:text-sm">
                    <span className="text-gray-600">{item.product_name || item.products?.name || 'Deleted'} x {item.quantity}</span>
                    <span className="text-gray-800">ج.م {(item.price_at_time * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div className="border-t pt-3 flex justify-between items-center">
                <span className="text-gray-600 text-sm">Total</span>
                <span className="text-gray-900 font-bold">ج.م {parseFloat(order.total_amount).toFixed(2)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </AdminLayout>
  );
}