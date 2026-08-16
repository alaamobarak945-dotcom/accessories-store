import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import StoreLayout from '../layouts/StoreLayout';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { shippingRates, baseWeight, extraWeightFee, vodafoneCashNumber, whatsappNumber } from '../data/shippingRates';

export default function Checkout() {
  const { cartItems, totalItems, totalPrice, clearCart } = useCart();
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  const [shippingAddress, setShippingAddress] = useState('');
  const [shippingPhone, setShippingPhone] = useState(profile?.phone || '');
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [governorate, setGovernorate] = useState('');
  const [weight, setWeight] = useState(2);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // حساب رسوم التوصيل
  const selectedGovernorate = shippingRates.find((g) => g.governorate === governorate);
  const baseFee = selectedGovernorate?.fee || 0;
  const extraWeight = weight > baseWeight ? weight - baseWeight : 0;
  const extraFee = extraWeight * extraWeightFee;
  const shippingFee = baseFee + extraFee;
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
      navigate(`/my-orders?success=1`);
    } catch (err) {
      setError(err.message || 'Error creating order');
    } finally {
      setLoading(false);
    }
  };

  if (cartItems.length === 0) {
    return (
      <StoreLayout>
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">Your cart is empty.</p>
          <button
            onClick={() => navigate('/shop')}
            className="bg-gray-800 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition"
          >
            Continue Shopping
          </button>
        </div>
      </StoreLayout>
    );
  }

  return (
    <StoreLayout>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Checkout</h1>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Form */}
          <form onSubmit={handleSubmit} className="md:col-span-2 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Shipping Address
              </label>
              <textarea
                value={shippingAddress}
                onChange={(e) => setShippingAddress(e.target.value)}
                required
                rows={3}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-gray-400"
                placeholder="Enter your full address..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={shippingPhone}
                  onChange={(e) => setShippingPhone(e.target.value)}
                  required
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-gray-400"
                  placeholder="+20 100 000 0000"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Governorate
                </label>
                <select
                  value={governorate}
                  onChange={(e) => setGovernorate(e.target.value)}
                  required
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-gray-400"
                >
                  <option value="">Select Governorate</option>
                  {shippingRates.map((g) => (
                    <option key={g.governorate} value={g.governorate}>
                      {g.governorate} - {g.fee} ج.م
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Package Weight (kg)
              </label>
              <input
                type="number"
                value={weight}
                onChange={(e) => setWeight(parseFloat(e.target.value) || 0)}
                min="0"
                step="0.5"
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-gray-400"
              />
              <p className="text-xs text-gray-500 mt-1">
                Base weight: {baseWeight} kg (included). Extra: {extraWeightFee} ج.م per kg.
              </p>
            </div>

            {/* Payment Method */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payment Method
              </label>
              <div className="space-y-2">
                <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition">
                  <input
                    type="radio"
                    value="cod"
                    checked={paymentMethod === 'cod'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  />
                  <div>
                    <p className="font-medium text-gray-800">Cash on Delivery</p>
                    <p className="text-sm text-gray-500">Pay when you receive your order</p>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition">
                  <input
                    type="radio"
                    value="vodafone_cash"
                    checked={paymentMethod === 'vodafone_cash'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  />
                  <div>
                    <p className="font-medium text-gray-800">Vodafone Cash</p>
                    <p className="text-sm text-gray-500">
                      Transfer to: {vodafoneCashNumber}
                    </p>
                  </div>
                </label>

                {paymentMethod === 'vodafone_cash' && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-700 mb-2">
                      Send payment proof via WhatsApp:
                    </p>
                    <a
                      href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
                        `New order - Total: ${finalTotal.toFixed(2)} ج.م`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition inline-block"
                    >
                      Send on WhatsApp
                    </a>
                  </div>
                )}

                <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition">
                  <input
                    type="radio"
                    value="visa"
                    checked={paymentMethod === 'visa'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  />
                  <div>
                    <p className="font-medium text-gray-800">Visa / Mastercard</p>
                    <p className="text-sm text-gray-500">Pay securely online</p>
                  </div>
                </label>

                {paymentMethod === 'visa' && (
                  <div className="bg-blue-50 rounded-lg p-4">
                    <p className="text-sm text-gray-700">
                      You will be redirected to payment gateway.
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      (Payment gateway integration coming soon)
                    </p>
                  </div>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gray-800 text-white py-3 rounded-lg hover:bg-gray-700 transition disabled:opacity-50"
            >
              {loading ? 'Creating Order...' : 'Place Order'}
            </button>
          </form>

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
                <span className="text-gray-800">ج.م {totalPrice.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Shipping Fee</span>
                <span className="text-gray-800">
                  {shippingFee > 0 ? `ج.م ${shippingFee.toFixed(2)}` : 'Select governorate'}
                </span>
              </div>
              <div className="border-t pt-2 flex justify-between">
                <span className="text-gray-800 font-medium">Total</span>
                <span className="text-gray-900 font-bold">
                  ج.م {finalTotal.toFixed(2)}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              {cartItems.map((item) => (
                <div key={item.id} className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                    {item.products?.product_images?.[0]?.image_url && (
                      <img
                        src={item.products.product_images[0].image_url}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-800 truncate">
                      {item.products?.name}
                    </p>
                    <p className="text-xs text-gray-500">x {item.quantity}</p>
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