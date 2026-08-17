import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import StoreLayout from '../layouts/StoreLayout';
import { supabase } from '../lib/supabaseClient';
import { useCart } from '../contexts/CartContext';

export default function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);
  const [cartMessage, setCartMessage] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    fetchProduct();
  }, [id]);

  async function fetchProduct() {
    setLoading(true);

    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        categories (id, name),
        product_images (id, image_url, is_primary, created_at)
      `)
      .eq('id', id)
      .eq('is_active', true)
      .single();

    if (error) {
      console.error('Error fetching product:', error.message);
      setProduct(null);
    } else {
      setProduct(data);
      if (data.product_images?.length > 0) {
        const primaryIndex = data.product_images.findIndex((img) => img.is_primary);
        if (primaryIndex > 0) {
          const primary = data.product_images[primaryIndex];
          const rest = data.product_images.filter((_, i) => i !== primaryIndex);
          data.product_images = [primary, ...rest];
        }
        setSelectedImageIndex(0);
      }
    }

    setLoading(false);
  }

  const handleAddToCart = async () => {
    setCartMessage('');
    setAddingToCart(true);

    try {
      await addToCart(product.id, quantity, selectedColor, notes);
      setCartMessage('✅ Added to cart!');
      setTimeout(() => setCartMessage(''), 3000);
    } catch (err) {
      if (err.message.includes('logged in')) {
        navigate('/login');
      } else {
        setCartMessage('❌ ' + err.message);
      }
    } finally {
      setAddingToCart(false);
    }
  };

  const goToNextImage = () => {
    if (product?.product_images?.length > 0) {
      setSelectedImageIndex((prev) =>
        prev === product.product_images.length - 1 ? 0 : prev + 1
      );
    }
  };

  const goToPrevImage = () => {
    if (product?.product_images?.length > 0) {
      setSelectedImageIndex((prev) =>
        prev === 0 ? product.product_images.length - 1 : prev - 1
      );
    }
  };

  const colors = ['Black', 'White', 'Gold', 'Silver', 'Rose Gold', 'Other'];

  if (loading) {
    return (
      <StoreLayout>
        <div className="text-center py-8">
          <p className="text-gray-400">Loading...</p>
        </div>
      </StoreLayout>
    );
  }

  if (!product) {
    return (
      <StoreLayout>
        <div className="text-center py-8">
          <p className="text-gray-500">Product not found.</p>
          <Link to="/shop" className="text-black underline mt-2 inline-block text-sm">
            Back to Shop
          </Link>
        </div>
      </StoreLayout>
    );
  }

  const images = product.product_images || [];
  const selectedImage = images[selectedImageIndex]?.image_url || '';

  return (
    <StoreLayout>
      <div className="w-full px-4 md:px-6 py-6">
        <Link to="/shop" className="text-gray-500 hover:text-black text-sm tracking-wide">
          ← BACK TO SHOP
        </Link>

        {cartMessage && (
          <div className="mt-4 text-center text-sm tracking-wide">{cartMessage}</div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10 mt-4">
          {/* Images */}
          <div>
            <div className="relative aspect-square bg-gray-50 rounded-2xl overflow-hidden">
              {selectedImage ? (
                <img src={selectedImage} alt={product.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-300">
                  <span className="text-6xl">✦</span>
                </div>
              )}

              {images.length > 1 && (
                <>
                  <button onClick={goToPrevImage} className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full w-10 h-10 flex items-center justify-center text-black shadow-lg transition z-10">
                    ❮
                  </button>
                  <button onClick={goToNextImage} className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full w-10 h-10 flex items-center justify-center text-black shadow-lg transition z-10">
                    ❯
                  </button>
                </>
              )}

              {images.length > 1 && (
                <div className="absolute bottom-3 right-3 bg-black/60 text-white px-3 py-1 rounded-full text-xs">
                  {selectedImageIndex + 1} / {images.length}
                </div>
              )}
            </div>

            {images.length > 1 && (
              <div className="flex gap-2 mt-3 overflow-x-auto pb-2">
                {images.map((img, index) => (
                  <button
                    key={img.id || index}
                    onClick={() => setSelectedImageIndex(index)}
                    className={`w-16 h-16 md:w-20 md:h-20 rounded-xl overflow-hidden border-2 flex-shrink-0 transition ${
                      selectedImageIndex === index ? 'border-black' : 'border-transparent opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img src={img.image_url} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details */}
          <div>
            <p className="text-gray-400 text-xs tracking-widest uppercase mb-2">
              {product.categories?.name || 'Uncategorized'}
            </p>
            <h1 className="text-2xl md:text-3xl font-light mb-3">{product.name}</h1>
            <p className="text-2xl font-bold text-black mb-4">
              {parseFloat(product.price).toFixed(2)} EGP
            </p>

            {/* Color Selection */}
            <div className="mb-4">
              <h3 className="text-sm font-medium text-gray-900 mb-2 tracking-widest uppercase">Color</h3>
              <div className="flex flex-wrap gap-2">
                {colors.map((color) => (
                  <button
                    key={color}
                    onClick={() => setSelectedColor(color)}
                    className={`px-4 py-2 rounded-full text-xs tracking-wide border transition ${
                      selectedColor === color
                        ? 'bg-black text-white border-black'
                        : 'border-gray-200 text-gray-600 hover:border-black'
                    }`}
                  >
                    {color}
                  </button>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div className="mb-4">
              <h3 className="text-sm font-medium text-gray-900 mb-2 tracking-widest uppercase">Notes</h3>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="Add any special requests..."
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-black transition"
              />
            </div>

            {product.description && (
              <div className="mb-4">
                <h3 className="text-sm font-medium text-gray-900 mb-2 tracking-widest uppercase">Description</h3>
                <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-line">{product.description}</p>
              </div>
            )}

            {product.specifications && (
              <div className="mb-4">
                <h3 className="text-sm font-medium text-gray-900 mb-2 tracking-widest uppercase">Specifications</h3>
                <div className="text-gray-600 text-sm leading-relaxed whitespace-pre-line">
                  {product.specifications.split('\n').map((line, index) => (
                    <p key={index} className="mb-1">{line}</p>
                  ))}
                </div>
              </div>
            )}

            <div className="mb-4">
              <span className={`px-4 py-2 rounded-full text-xs tracking-wide ${
                product.stock > 0 ? 'bg-gray-100 text-gray-800' : 'bg-red-50 text-red-600'
              }`}>
                {product.stock > 0 ? `IN STOCK (${product.stock})` : 'OUT OF STOCK'}
              </span>
            </div>

            {product.stock > 0 && (
              <div className="flex items-center gap-4 mb-4">
                <span className="text-xs text-gray-600 tracking-wide">QUANTITY</span>
                <div className="flex items-center border border-gray-200 rounded-full">
                  <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="px-4 py-1.5 text-gray-600 hover:text-black">-</button>
                  <span className="px-5 py-1.5 font-medium text-sm">{quantity}</span>
                  <button onClick={() => setQuantity(Math.min(product.stock, quantity + 1))} className="px-4 py-1.5 text-gray-600 hover:text-black">+</button>
                </div>
              </div>
            )}

            <button
              disabled={product.stock === 0 || addingToCart}
              onClick={handleAddToCart}
              className="w-full bg-black text-white py-3.5 rounded-full text-sm tracking-widest hover:bg-gray-800 transition disabled:opacity-50"
            >
              {addingToCart ? 'ADDING...' : 'ADD TO CART'}
            </button>
          </div>
        </div>
      </div>
    </StoreLayout>
  );
}