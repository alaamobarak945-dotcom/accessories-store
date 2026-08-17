import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

export default function ProductCard({ product }) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const images = product.product_images || [];

  useEffect(() => {
    if (images.length > 1) {
      const interval = setInterval(() => {
        setCurrentImageIndex((prev) => (prev + 1) % images.length);
      }, 2500);

      return () => clearInterval(interval);
    }
  }, [images.length]);

  const currentImage = images[currentImageIndex]?.image_url || '';

  return (
    <Link
      to={`/product/${product.id}`}
      className="group bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300"
    >
      <div className="relative aspect-square bg-gray-50 overflow-hidden">
        {currentImage ? (
          <img
            src={currentImage}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300">
            <span className="text-4xl">✦</span>
          </div>
        )}

        {/* Dots Indicator */}
        {images.length > 1 && (
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
            {images.map((_, index) => (
              <div
                key={index}
                className={`w-1.5 h-1.5 rounded-full transition ${
                  index === currentImageIndex ? 'bg-black' : 'bg-gray-300'
                }`}
              ></div>
            ))}
          </div>
        )}

        {product.stock <= 5 && (
          <span className="absolute top-2 left-2 bg-red-600 text-white text-[10px] px-2 py-0.5 rounded-full">
            Only {product.stock} left
          </span>
        )}
      </div>

      <div className="p-3">
        <p className="text-gray-400 text-[10px] mb-1 tracking-wider uppercase truncate">
          {product.categories?.name || 'Uncategorized'}
        </p>
        <h3 className="text-gray-900 font-medium text-sm mb-1 truncate">
          {product.name}
        </h3>
        <p className="text-black font-bold text-sm">
          {parseFloat(product.price).toFixed(2)} EGP
        </p>
      </div>
    </Link>
  );
}