import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import StoreLayout from '../layouts/StoreLayout';
import { useCart } from '../contexts/CartContext';

export default function Cart() {
  const { cartItems, loading, totalItems, totalPrice, updateQuantity, removeFromCart, clearCart } = useCart();
  const [error, setError] = useState('');
  const [clearing, setClearing] = useState(false);
  const navigate = useNavigate();

  const handleUpdateQuantity = async (itemId, newQuantity) => {
    if (newQuantity < 1) return;
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

  const handleClearCart = async () => {
    if (!confirm('Are you sure you want to clear your entire cart?')) return;
    setClearing(true);
    setError('');
    try {
      await clearCart();
    } catch (err) {
      setError(err.message);
    } finally {
      setClearing(false);
    }
  };

  return (
    <StoreLayout>
      <section className="bg-black text-white py-8">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h1 className="text-3xl md:text-4xl font-light tracking-tight">SHOPPING CART</h1>
          <p className="text-gray-400 text-sm mt-1">{totalItems} ITEM{totalItems !== 1 ? 'S' : ''}</p>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {error && (
          <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg mb-4 text-sm">{error}</div>
        )}

        {loading ? (
          <div className="text-center py-8"><p className="text-gray-500">Loading...</p></div>
        ) : cartItems.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-5xl mb-4">🛒</div>
            <p className="text-gray-500 mb-6">Your cart is empty.</p>
            <Link to="/shop" className="inline-block bg-black text-white px-6 py-2.5 rounded-full text-xs tracking-widest hover:bg-gray-800 transition">
              CONTINUE SHOPPING
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">{totalItems} item{totalItems !== 1 ? 's' : ''} in cart</span>
              <button onClick={handleClearCart} disabled={clearing} className="text-xs text-red-600 hover:text-red-800 tracking-wide disabled:opacity-50">
                {clearing ? 'CLEARING...' : '🗑️ CLEAR CART'}
              </button>
            </div>

            {cartItems.map((item) => (
              <div key={item.id} className="bg-white border border-gray-100 rounded-xl p-3 md:p-4 flex gap-3 md:gap-4 items-center hover:shadow-lg transition">
                <div className="w-16 h-16 md:w-20 md:h-20 bg-gray-50 rounded-lg overflow-hidden flex-shrink-0">
                  {item.products?.product_images?.[0]?.image_url ? (
                    <img src={item.products.product_images[0].image_url} alt={item.products.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300">✦</div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="text-gray-900 font-medium text-sm truncate">{item.products?.name || 'Deleted Product'}</h3>
                  <p className="text-gray-500 text-xs mb-1">{parseFloat(item.products?.price || 0).toFixed(2)} EGP</p>
                  {item.color && <p className="text-xs text-gray-500">Color: {item.color}</p>}
                  {item.notes && <p className="text-xs text-gray-500">Notes: {item.notes}</p>}

                  <div className="flex items-center gap-3 mt-2">
                    <div className="flex items-center border border-gray-200 rounded-full">
                      <button onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)} className="px-2.5 py-0.5 text-gray-600 hover:text-black text-sm">-</button>
                      <span className="px-3 py-0.5 text-xs font-medium">{item.quantity}</span>
                      <button onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)} className="px-2.5 py-0.5 text-gray-600 hover:text-black text-sm">+</button>
                    </div>

                    <button onClick={() => handleRemove(item.id)} className="text-[10px] text-gray-400 hover:text-red-600 transition tracking-widest">REMOVE</button>
                  </div>
                </div>

                <p className="font-bold text-sm md:text-base flex-shrink-0">
                  {(item.quantity * parseFloat(item.products?.price || 0)).toFixed(2)} EGP
                </p>
              </div>
            ))}

            <div className="border-t border-gray-200 pt-4 mt-4">
              <div className="flex justify-between items-center mb-4">
                <span className="text-gray-500">Subtotal</span>
                <span className="font-bold text-lg">{totalPrice.toFixed(2)} EGP</span>
              </div>
              <button onClick={() => navigate('/checkout')} className="w-full bg-black text-white py-3 rounded-full text-xs tracking-widest hover:bg-gray-800 transition">
                PROCEED TO CHECKOUT
              </button>
            </div>
          </div>
        )}
      </div>
    </StoreLayout>
  );
}