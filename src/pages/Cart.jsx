import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import StoreLayout from '../layouts/StoreLayout';
import { useCart } from '../contexts/CartContext';

export default function Cart() {
  const { cartItems, loading, totalItems, totalPrice, updateQuantity, removeFromCart } = useCart();
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleUpdateQuantity = async (itemId, newQuantity) => {
    try {
      await updateQuantity(itemId, newQuantity);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleRemove = async (itemId) => {
    if (!confirm('Remove this item from cart?')) return;
    try {
      await removeFromCart(itemId);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <StoreLayout>
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">
          Shopping Cart
        </h1>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Loading cart...</p>
          </div>
        ) : cartItems.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl shadow-sm">
            <p className="text-gray-500 mb-4">Your cart is empty.</p>
            <Link
              to="/shop"
              className="bg-gray-800 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition inline-block"
            >
              Continue Shopping
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {cartItems.map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-xl shadow-sm p-4 flex gap-4"
                >
                  <div className="w-24 h-24 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                    {item.products?.product_images?.[0]?.image_url ? (
                      <img
                        src={item.products.product_images[0].image_url}
                        alt={item.products.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                        No Image
                      </div>
                    )}
                  </div>

                  <div className="flex-1">
                    <h3 className="text-gray-800 font-medium mb-1">
                      {item.products?.name}
                    </h3>
                    <p className="text-gray-600 text-sm mb-2">
                      ج.م{parseFloat(item.products?.price || 0).toFixed(2)}
                    </p>

                    <div className="flex items-center gap-3">
                      <div className="flex items-center border border-gray-300 rounded-lg">
                        <button
                          onClick={() =>
                            handleUpdateQuantity(item.id, item.quantity - 1)
                          }
                          className="px-3 py-1 text-gray-600 hover:text-gray-800"
                        >
                          -
                        </button>
                        <span className="px-4 py-1 text-gray-800">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() =>
                            handleUpdateQuantity(item.id, item.quantity + 1)
                          }
                          className="px-3 py-1 text-gray-600 hover:text-gray-800"
                        >
                          +
                        </button>
                      </div>

                      <button
                        onClick={() => handleRemove(item.id)}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        Remove
                      </button>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-gray-900 font-bold">
                      ج.م
                      {(
                        item.quantity * parseFloat(item.products?.price || 0)
                      ).toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Summary */}
            <div className="bg-white rounded-xl shadow-sm p-6 h-fit">
              <h2 className="text-xl font-bold text-gray-800 mb-4">
                Order Summary
              </h2>
              <div className="space-y-2 mb-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Items</span>
                  <span className="text-gray-800">{totalItems}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="text-gray-800">
                    ج.م{totalPrice.toFixed(2)}
                  </span>
                </div>
              </div>
              <button
                onClick={() => navigate('/checkout')}
                className="w-full bg-gray-800 text-white py-3 rounded-lg hover:bg-gray-700 transition"
              >
                Proceed to Checkout
              </button>
            </div>
          </div>
        )}
      </div>
    </StoreLayout>
  );
}