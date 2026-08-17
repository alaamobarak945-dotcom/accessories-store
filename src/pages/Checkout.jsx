import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import StoreLayout from '../layouts/StoreLayout';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { shippingRates, vodafoneCashNumber, whatsappNumber } from '../data/shippingRates';

export default function Checkout() {
  const { cartItems, totalItems, totalPrice, clearCart } = useCart();
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  const [shippingAddress, setShippingAddress] = useState('');
  const [shippingPhone, setShippingPhone] = useState(profile?.phone || '');
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [governorate, setGovernorate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const selectedGovernorate = shippingRates.find((g) => g.governorate === governorate);
  const shippingFee = selectedGovernorate?.fee || 0;
  const finalTotal = totalPrice + shippingFee;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!shippingAddress.trim()) {
        throw new Error('Please enter your shipping address');
      }
      if (!shippingPhone.trim()) {
        throw new Error('Please enter your phone number');
      }
      if (!governorate) {
        throw new Error('Please select your governorate');
      }

      const { data: orderId, error: orderError } = await supabase.rpc(
        'create_order',
        {
          p_shipping_address: shippingAddress,
          p_shipping_phone: shippingPhone,
          p_payment_method: paymentMethod,
          p_governorate: governorate,
          p_shipping_fee: shippingFee,
        }
      );

      if (orderError) throw orderError;

      await clearCart();

      // رسالة حسب طريقة الدفع
      if (paymentMethod === 'vodafone_cash') {
        navigate(`/my-orders?success=1&payment=vodafone`);
      } else if (paymentMethod === 'cod') {
        navigate(`/my-orders?success=1&payment=cod`);
      } else {
        navigate(`/my-orders?success=1`);
      }
    } catch (err) {
      setError(err.message || 'Error creating order');
    } finally {
      setLoading(false);
    }
  };

  if (cartItems.length === 0) {
    return (
      <StoreLayout>
        <div className="text-center py-8">
          <div className="text-5xl mb-4">🛒</div>
          <p className="text-gray-500 mb-6">Your cart is empty.</p>
          <button
            onClick={() => navigate('/shop')}
            className="bg-black text-white px-6 py-2.5 rounded-full text-xs tracking-widest hover:bg-gray-800 transition"
          >
            CONTINUE SHOPPING
          </button>
        </div>
      </StoreLayout>
    );
  }

  return (
    <StoreLayout>
      <section className="bg-black text-white py-8">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h1 className="text-3xl md:text-4xl font-light tracking-tight">
            CHECKOUT
          </h1>
          <p className="text-gray-400 text-sm mt-1">Complete your order</p>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {error && (
          <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-700 mb-1 tracking-wide">
                SHIPPING ADDRESS
              </label>
              <textarea
                value={shippingAddress}
                onChange={(e) => setShippingAddress(e.target.value)}
                required
                rows={2}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-black transition text-sm"
                placeholder="Enter your full address..."
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-gray-700 mb-1 tracking-wide">
                  PHONE
                </label>
                <input
                  type="tel"
                  value={shippingPhone}
                  onChange={(e) => setShippingPhone(e.target.value)}
                  required
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-black transition text-sm"
                  placeholder="01000000000"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1 tracking-wide">
                  GOVERNORATE
                </label>
                <select
                  value={governorate}
                  onChange={(e) => setGovernorate(e.target.value)}
                  required
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-black transition text-sm"
                >
                  <option value="">Select</option>
                  {shippingRates.map((g) => (
                    <option key={g.governorate} value={g.governorate}>
                      {g.governorate}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Payment Method */}
            <div>
              <label className="block text-sm text-gray-700 mb-2 tracking-wide">
                PAYMENT METHOD
              </label>
              <div className="space-y-2">
                {/* COD */}
                <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-xl cursor-pointer hover:border-black transition">
                  <input
                    type="radio"
                    value="cod"
                    checked={paymentMethod === 'cod'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="accent-black"
                  />
                  <div>
                    <p className="text-sm font-medium">Cash on Delivery</p>
                    <p className="text-xs text-gray-500">
                      You will be contacted to pay shipping fee as deposit
                    </p>
                  </div>
                </label>

                {/* Vodafone Cash */}
                <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-xl cursor-pointer hover:border-black transition">
                  <input
                    type="radio"
                    value="vodafone_cash"
                    checked={paymentMethod === 'vodafone_cash'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="accent-black"
                  />
                  <div>
                    <p className="text-sm font-medium">Vodafone Cash</p>
                    <p className="text-xs text-gray-500">
                      Transfer to: {vodafoneCashNumber}
                    </p>
                  </div>
                </label>

                {paymentMethod === 'vodafone_cash' && (
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-sm text-gray-700 mb-2">
                      Please transfer the full order amount ({finalTotal.toFixed(2)} EGP) to:
                    </p>
                    <p className="text-lg font-bold text-black mb-3">
                      {vodafoneCashNumber}
                    </p>
                    <p className="text-xs text-gray-500 mb-3">
                      After transfer, send a screenshot on WhatsApp to confirm your order.
                    </p>
                    <a
                      href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
                        `New order - Total: ${finalTotal.toFixed(2)} EGP - Name: ${profile?.full_name || ''} - Phone: ${shippingPhone}`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block bg-green-500 text-white px-5 py-2 rounded-full text-xs hover:bg-green-600 transition"
                    >
                      Send Transfer Screenshot
                    </a>
                  </div>
                )}

                {/* Visa - Disabled */}
                <div className="flex items-center gap-3 p-3 border border-gray-100 rounded-xl opacity-50 cursor-not-allowed">
                  <input
                    type="radio"
                    value="visa"
                    disabled
                    className="accent-black"
                  />
                  <div>
                    <p className="text-sm font-medium">Visa / Mastercard</p>
                    <p className="text-xs text-gray-400">Coming Soon</p>
                  </div>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-black text-white py-3 rounded-full text-xs tracking-widest hover:bg-gray-800 transition disabled:opacity-50"
            >
              {loading ? 'CREATING...' : 'PLACE ORDER'}
            </button>
          </form>

          {/* Summary */}
          <div className="bg-gray-50 rounded-xl p-4 h-fit">
            <h2 className="text-lg font-light mb-3 tracking-tight">ORDER SUMMARY</h2>

            <div className="space-y-2 mb-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Items</span>
                <span>{totalItems}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Subtotal</span>
                <span>{totalPrice.toFixed(2)} EGP</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Shipping</span>
                <span>{shippingFee > 0 ? `${shippingFee.toFixed(2)} EGP` : '—'}</span>
              </div>
              <div className="border-t border-gray-200 pt-2 flex justify-between">
                <span className="font-medium">Total</span>
                <span className="font-bold">{finalTotal.toFixed(2)} EGP</span>
              </div>
            </div>

            <div className="space-y-2 border-t border-gray-200 pt-3">
              {cartItems.map((item) => (
                <div key={item.id} className="flex items-center gap-2">
                  <div className="w-10 h-10 bg-white rounded-lg overflow-hidden flex-shrink-0">
                    {item.products?.product_images?.[0]?.image_url && (
                      <img
                        src={item.products.product_images[0].image_url}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-800 truncate">{item.products?.name}</p>
                    <p className="text-[10px] text-gray-500">x {item.quantity}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </StoreLayout>
  );
}