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
  const [isZoomed, setIsZoomed] = useState(false);

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
      
      // ترتيب الصور: الرئيسية أولاً، ثم حسب تاريخ الإضافة
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
      setCartMessage('✅ تمت الإضافة إلى السلة!');
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
    if (product.product_images?.length > 0) {
      setSelectedImageIndex((prev) =>
        prev === product.product_images.length - 1 ? 0 : prev + 1
      );
    }
  };

  const goToPrevImage = () => {
    if (product.product_images?.length > 0) {
      setSelectedImageIndex((prev) =>
        prev === 0 ? product.product_images.length - 1 : prev - 1
      );
    }
  };

  if (loading) {
    return (
      <StoreLayout>
        <div className="text-center py-12">
          <p className="text-gray-500">Loading...</p>
        </div>
      </StoreLayout>
    );
  }

  if (!product) {
    return (
      <StoreLayout>
        <div className="text-center py-12">
          <p className="text-gray-500">Product not found.</p>
          <Link to="/shop" className="text-gray-800 underline mt-2 inline-block">
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
      <div className="max-w-7xl mx-auto px-4 py-8">
        <Link to="/shop" className="text-gray-600 hover:text-gray-800 mb-4 inline-block">
          ← Back to Shop
        </Link>

        {cartMessage && (
          <div className={`px-4 py-3 rounded-lg mb-4 ${
            cartMessage.startsWith('✅')
              ? 'bg-green-50 border border-green-200 text-green-600'
              : 'bg-red-50 border border-red-200 text-red-600'
          }`}>
            {cartMessage}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-4">
          {/* Images Section */}
          <div>
            {/* Main Image */}
            <div
              className="relative aspect-square bg-gray-100 rounded-xl overflow-hidden mb-4 cursor-zoom-in"
              onClick={() => setIsZoomed(true)}
            >
              {selectedImage ? (
                <img
                  src={selectedImage}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  No Image
                </div>
              )}

              {/* Navigation Arrows */}
              {images.length > 1 && (
                <>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      goToPrevImage();
                    }}
                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 rounded-full w-10 h-10 flex items-center justify-center text-gray-800 hover:bg-white transition"
                  >
                    ❮
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      goToNextImage();
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 rounded-full w-10 h-10 flex items-center justify-center text-gray-800 hover:bg-white transition"
                  >
                    ❯
                  </button>
                </>
              )}

              {/* Image Counter */}
              {images.length > 1 && (
                <div className="absolute bottom-2 right-2 bg-black/60 text-white px-3 py-1 rounded-full text-sm">
                  {selectedImageIndex + 1} / {images.length}
                </div>
              )}
            </div>

            {/* Thumbnails */}
            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-2">
                {images.map((img, index) => (
                  <button
                    key={img.id || index}
                    onClick={() => setSelectedImageIndex(index)}
                    className={`w-20 h-20 rounded-lg overflow-hidden border-2 flex-shrink-0 transition ${
                      selectedImageIndex === index
                        ? 'border-gray-800'
                        : 'border-transparent opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img
                      src={img.image_url}
                      alt={`${product.name} ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details Section */}
          <div>
            <p className="text-gray-500 text-sm mb-2">
              {product.categories?.name || 'Uncategorized'}
            </p>
            <h1 className="text-3xl font-bold text-gray-800 mb-4">
              {product.name}
            </h1>
            <p className="text-2xl font-bold text-gray-900 mb-4">
              ج.م {parseFloat(product.price).toFixed(2)}
            </p>
            <p className="text-gray-600 mb-6">
              {product.description || 'No description available.'}
            </p>

            <div className="mb-6">
              <span
                className={`px-3 py-1 rounded text-sm ${
                  product.stock > 0
                    ? 'bg-green-100 text-green-700'
                    : 'bg-red-100 text-red-700'
                }`}
              >
                {product.stock > 0
                  ? `In Stock (${product.stock} available)`
                  : 'Out of Stock'}
              </span>
            </div>

            {product.stock > 0 && (
              <div className="flex items-center gap-4 mb-6">
                <label className="text-gray-700">Quantity:</label>
                <div className="flex items-center border border-gray-300 rounded-lg">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="px-3 py-1 text-gray-600 hover:text-gray-800"
                  >
                    -
                  </button>
                  <span className="px-4 py-1 text-gray-800">{quantity}</span>
                  <button
                    onClick={() =>
                      setQuantity(Math.min(product.stock, quantity + 1))
                    }
                    className="px-3 py-1 text-gray-600 hover:text-gray-800"
                  >
                    +
                  </button>
                </div>
              </div>
            )}

            <button
              disabled={product.stock === 0 || addingToCart}
              onClick={handleAddToCart}
              className="w-full bg-gray-800 text-white py-3 rounded-lg hover:bg-gray-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {addingToCart
                ? 'Adding...'
                : product.stock === 0
                ? 'Out of Stock'
                : 'Add to Cart'}
            </button>
          </div>
        </div>
      </div>

      {/* Zoom Modal */}
      {isZoomed && selectedImage && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
          onClick={() => setIsZoomed(false)}
        >
          <img
            src={selectedImage}
            alt={product.name}
            className="max-w-full max-h-full object-contain"
          />
          <button
            onClick={() => setIsZoomed(false)}
            className="absolute top-4 right-4 text-white text-3xl hover:text-gray-300"
          >
            ×
          </button>

          {images.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  goToPrevImage();
                }}
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/20 text-white rounded-full w-12 h-12 flex items-center justify-center hover:bg-white/30 transition text-2xl"
              >
                ❮
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  goToNextImage();
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/20 text-white rounded-full w-12 h-12 flex items-center justify-center hover:bg-white/30 transition text-2xl"
              >
                ❯
              </button>
            </>
          )}
        </div>
      )}
    </StoreLayout>
  );
}