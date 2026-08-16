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
      await addToCart(product.id, quantity);
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

  if (loading) {
    return (
      <StoreLayout>
        <div className="text-center py-8">
          <p className="text-gray-500">Loading...</p>
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
      <div className="max-w-5xl mx-auto px-4 md:px-8 py-6">
        <Link to="/shop" className="text-gray-500 hover:text-black text-sm tracking-wide">
          ← BACK TO SHOP
        </Link>

        {cartMessage && (
          <div className="mt-4 text-center text-sm tracking-wide">
            {cartMessage}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
          {/* Images */}
          <div>
            <div className="aspect-square bg-gray-50 rounded-xl overflow-hidden mb-2">
              {selectedImage ? (
                <img
                  src={selectedImage}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-300">
                  No Image
                </div>
              )}
            </div>
            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto">
                {images.map((img, index) => (
                  <button
                    key={img.id || index}
                    onClick={() => setSelectedImageIndex(index)}
                    className={`w-14 h-14 rounded-lg overflow-hidden border-2 flex-shrink-0 transition ${
                      selectedImageIndex === index
                        ? 'border-black'
                        : 'border-transparent opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img
                      src={img.image_url}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details */}
          <div>
            <p className="text-gray-400 text-xs tracking-widest uppercase mb-1">
              {product.categories?.name || 'Uncategorized'}
            </p>
            <h1 className="text-2xl md:text-3xl font-light mb-2">
              {product.name}
            </h1>
            <p className="text-xl font-semibold mb-3">
              {parseFloat(product.price).toFixed(2)} EGP
            </p>
            <p className="text-gray-600 text-sm leading-relaxed mb-4">
              {product.description || 'No description available.'}
            </p>

            <div className="mb-4">
              <span className={`px-3 py-1 rounded-full text-xs tracking-wide ${
                product.stock > 0
                  ? 'bg-gray-100 text-gray-800'
                  : 'bg-red-50 text-red-600'
              }`}>
                {product.stock > 0
                  ? `IN STOCK (${product.stock})`
                  : 'OUT OF STOCK'}
              </span>
            </div>

            {product.stock > 0 && (
              <div className="flex items-center gap-4 mb-4">
                <span className="text-xs text-gray-600 tracking-wide">QUANTITY</span>
                <div className="flex items-center border border-gray-200 rounded-full">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="px-3 py-1 text-gray-600 hover:text-black"
                  >
                    -
                  </button>
                  <span className="px-4 py-1 text-sm font-medium">{quantity}</span>
                  <button
                    onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                    className="px-3 py-1 text-gray-600 hover:text-black"
                  >
                    +
                  </button>
                </div>
              </div>
            )}

            <button
              disabled={product.stock === 0 || addingToCart}
              onClick={handleAddToCart}
              className="w-full bg-black text-white py-3 rounded-full text-sm tracking-widest hover:bg-gray-800 transition disabled:opacity-50"
            >
              {addingToCart ? 'ADDING...' : 'ADD TO CART'}
            </button>
          </div>
        </div>
      </div>
    </StoreLayout>
  );
}