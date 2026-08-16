import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import StoreLayout from '../layouts/StoreLayout';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';

export default function MyOrders() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();

  useEffect(() => {
    fetchOrders();
  }, [user]);

  async function fetchOrders() {
    setLoading(true);

    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (
          id,
          quantity,
          price_at_time,
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
    } else {
      setOrders(data || []);
    }

    setLoading(false);
  }

  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-700',
    confirmed: 'bg-blue-100 text-blue-700',
    preparing: 'bg-purple-100 text-purple-700',
    shipped: 'bg-orange-100 text-orange-700',
    delivered: 'bg-green-100 text-green-700',
    cancelled: 'bg-red-100 text-red-700',
  };

  return (
    <StoreLayout>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">My Orders</h1>

        {searchParams.get('success') === '1' && (
          <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-lg mb-4">
            ✅ Order created successfully!
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Loading orders...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl shadow-sm">
            <p className="text-gray-500 mb-4">You have no orders yet.</p>
            <Link
              to="/shop"
              className="bg-gray-800 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition inline-block"
            >
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div key={order.id} className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm text-gray-500">
                      Order ID: {order.id.substring(0, 8)}...
                    </p>
                    <p className="text-sm text-gray-500">
                      {new Date(order.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      statusColors[order.status] || 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                  </span>
                </div>

                <div className="space-y-2 mb-4">
                  {order.order_items?.map((item) => (
                    <div key={item.id} className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                        {item.products?.product_images?.[0]?.image_url && (
                          <img
                            src={item.products.product_images[0].image_url}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-gray-800">
                          {item.products?.name || 'Deleted Product'}
                        </p>
                        <p className="text-xs text-gray-500">x {item.quantity}</p>
                      </div>
                      <p className="text-sm text-gray-600">
                        ج.م {(item.price_at_time * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="border-t pt-4 flex justify-between">
                  <span className="text-gray-600">Total</span>
                  <span className="text-gray-900 font-bold">
                    ج.م {parseFloat(order.total_amount).toFixed(2)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </StoreLayout>
  );
}