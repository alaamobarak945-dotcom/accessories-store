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
        order_items (id, quantity, price_at_time, product_name, color, notes, products (name))
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
    pending: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    confirmed: 'bg-blue-50 text-blue-700 border-blue-200',
    preparing: 'bg-purple-50 text-purple-700 border-purple-200',
    shipped: 'bg-orange-50 text-orange-700 border-orange-200',
    delivered: 'bg-green-50 text-green-700 border-green-200',
    cancelled: 'bg-red-50 text-red-700 border-red-200',
  };

  const statuses = ['pending', 'confirmed', 'preparing', 'shipped', 'delivered', 'cancelled'];

  function getPaymentMethodLabel(method) {
    if (method === 'cod') return 'Cash on Delivery';
    if (method === 'vodafone_cash') return 'Vodafone Cash';
    if (method === 'instapay') return 'InstaPay';
    return method || 'COD';
  }

  return (
    <AdminLayout title="Orders">
      <div className="mb-4">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border border-gray-200 rounded-full px-4 py-2 text-sm focus:outline-none focus:border-black w-full md:w-auto"
        >
          <option value="">All Statuses</option>
          {statuses.map((s) => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
        </select>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg mb-4 text-sm">{error}</div>
      )}

      {loading ? (
        <div className="text-center py-8"><p className="text-gray-400 text-sm">Loading...</p></div>
      ) : orders.length === 0 ? (
        <div className="text-center py-8 border border-gray-100 rounded-xl"><p className="text-gray-400 text-sm">No orders.</p></div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <div key={order.id} className="border border-gray-100 rounded-xl p-4 hover:border-black transition">
              <div className="flex flex-col md:flex-row justify-between gap-2 mb-3">
                <div>
                  <p className="text-xs text-gray-400">Order ID: {order.id.substring(0, 8)}...</p>
                  <p className="text-sm font-medium text-black">{order.profiles?.full_name || 'N/A'}</p>
                  <p className="text-xs text-gray-500">{order.shipping_phone}</p>
                  <p className="text-xs text-gray-400">{new Date(order.created_at).toLocaleString()}</p>
                </div>
                <div className="flex flex-wrap gap-2 items-start">
                  <span className="px-2 py-1 rounded-full text-[10px] border border-gray-200 text-gray-600">
                    {getPaymentMethodLabel(order.payment_method)}
                  </span>
                  <select
                    value={order.status}
                    onChange={(e) => handleStatusChange(order.id, e.target.value)}
                    className={`px-2 py-1 rounded-full text-[10px] border ${statusColors[order.status]}`}
                  >
                    {statuses.map((s) => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                  </select>
                </div>
              </div>

              <div className="space-y-2 mb-3">
                {order.order_items?.map((item) => (
                  <div key={item.id} className="text-xs">
                    <div className="flex justify-between">
                      <span className="text-gray-600">
                        {item.product_name || item.products?.name || 'Deleted'} x {item.quantity}
                      </span>
                      <span className="text-black font-medium">
                        ج.م {(item.price_at_time * item.quantity).toFixed(2)}
                      </span>
                    </div>
                    {item.color && (
                      <p className="text-gray-500 mt-0.5">Color: {item.color}</p>
                    )}
                    {item.notes && (
                      <p className="text-gray-500 mt-0.5">Notes: {item.notes}</p>
                    )}
                  </div>
                ))}
              </div>

              <div className="border-t border-gray-100 pt-2 flex justify-between">
                <span className="text-sm text-gray-500">Total</span>
                <span className="font-bold text-black">ج.م {parseFloat(order.total_amount).toFixed(2)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </AdminLayout>
  );
}