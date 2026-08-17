import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import StoreLayout from '../layouts/StoreLayout';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';

export default function MyOrders() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState('active');

  useEffect(() => {
    if (user) {
      fetchOrders();
    }
  }, [user]);

  async function fetchOrders() {
    setLoading(true);
    setError('');

    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (
          id,
          quantity,
          price_at_time,
          product_name,
          products (
            id,
            name,
            product_images (
              id,
              image_url,
              is_primary
            )
          )
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching orders:', error.message);
      setError('Error loading orders: ' + error.message);
    } else {
      setOrders(data || []);
    }

    setLoading(false);
  }

  async function handleCancelOrder(orderId) {
    if (!confirm('Are you sure you want to cancel this order?')) {
      return;
    }

    setError('');

    const { error } = await supabase
      .from('orders')
      .update({ status: 'cancelled' })
      .eq('id', orderId)
      .eq('user_id', user.id);

    if (error) {
      setError('Error cancelling order: ' + error.message);
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

  const activeStatuses = ['pending', 'confirmed', 'preparing', 'shipped'];
  const completedStatuses = ['delivered', 'cancelled'];

  const activeOrders = orders.filter((order) => activeStatuses.includes(order.status));
  const completedOrders = orders.filter((order) => completedStatuses.includes(order.status));

  const displayedOrders = activeTab === 'active' ? activeOrders : completedOrders;

  const successMessage = searchParams.get('success') === '1';
  const paymentType = searchParams.get('payment');

  function getSuccessMessage() {
    if (paymentType === 'vodafone') {
      return '✅ Order created! Please send your transfer screenshot on WhatsApp to confirm your order.';
    }
    if (paymentType === 'cod') {
      return '✅ Order created! We will contact you to confirm shipping fee deposit.';
    }
    return '✅ Order created successfully!';
  }

  return (
    <StoreLayout>
      {/* Header */}
      <section className="bg-black text-white py-8">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h1 className="text-3xl md:text-4xl font-light tracking-tight">
            MY ORDERS
          </h1>
          <p className="text-gray-400 text-sm mt-1">Track your orders</p>
        </div>
      </section>

      <div className="max-w-3xl mx-auto px-4 py-6">
        {successMessage && (
          <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-xl mb-4 text-sm">
            {getSuccessMessage()}
          </div>
        )}

        {error && (
          <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl mb-4 text-sm">
            {error}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('active')}
            className={`px-4 py-2 rounded-full text-xs tracking-widest transition ${
              activeTab === 'active'
                ? 'bg-black text-white'
                : 'border border-gray-200 text-gray-600 hover:border-black'
            }`}
          >
            ACTIVE ({activeOrders.length})
          </button>
          <button
            onClick={() => setActiveTab('completed')}
            className={`px-4 py-2 rounded-full text-xs tracking-widest transition ${
              activeTab === 'completed'
                ? 'bg-black text-white'
                : 'border border-gray-200 text-gray-600 hover:border-black'
            }`}
          >
            COMPLETED ({completedOrders.length})
          </button>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <p className="text-gray-400 text-sm">Loading...</p>
          </div>
        ) : displayedOrders.length === 0 ? (
          <div className="text-center py-8 border border-gray-100 rounded-xl">
            <div className="text-4xl mb-3">📦</div>
            <p className="text-gray-400 text-sm mb-4">
              {activeTab === 'active' ? 'No active orders.' : 'No completed orders.'}
            </p>
            <Link
              to="/shop"
              className="inline-block bg-black text-white px-6 py-2.5 rounded-full text-xs tracking-widest hover:bg-gray-800 transition"
            >
              START SHOPPING
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {displayedOrders.map((order) => (
              <div key={order.id} className="border border-gray-100 rounded-xl p-4 hover:border-black transition">
                <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                  <div>
                    <p className="text-xs text-gray-400">
                      Order ID: {order.id.substring(0, 8)}...
                    </p>
                    <p className="text-xs text-gray-400">
                      {new Date(order.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-[10px] font-medium border ${statusColors[order.status]}`}>
                    {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                  </span>
                </div>

                <div className="space-y-2 mb-3">
                  {order.order_items?.map((item) => (
                    <div key={item.id} className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-50 rounded-lg overflow-hidden flex-shrink-0">
                        {item.products?.product_images?.[0]?.image_url && (
                          <img
                            src={item.products.product_images[0].image_url}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-800 truncate">
                          {item.product_name || item.products?.name || 'Deleted Product'}
                        </p>
                        <p className="text-xs text-gray-400">x {item.quantity}</p>
                      </div>
                      <p className="text-sm text-black font-medium">
                        ج.م {(item.price_at_time * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="border-t border-gray-100 pt-3 flex justify-between items-center">
                  <span className="text-sm text-gray-500">Total</span>
                  <span className="font-bold text-black">
                    ج.م {parseFloat(order.total_amount).toFixed(2)}
                  </span>
                </div>

                {order.status === 'pending' && (
                  <button
                    onClick={() => handleCancelOrder(order.id)}
                    className="mt-3 w-full border border-red-200 text-red-600 py-2 rounded-full text-xs tracking-widest hover:bg-red-50 transition"
                  >
                    CANCEL ORDER
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </StoreLayout>
  );
}