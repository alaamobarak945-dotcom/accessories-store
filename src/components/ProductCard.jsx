import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';

export default function ProductCard({ product, index = 0 }) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const cardRef = useRef(null);
  const images = product.product_images || [];

  useEffect(() => {
    // Scroll Animation
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 }
    );

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    return () => {
      if (cardRef.current) observer.unobserve(cardRef.current);
    };
  }, []);

  useEffect(() => {
    if (images.length > 1) {
      const interval = setInterval(() => {
        setCurrentImageIndex((prev) => (prev + 1) % images.length);
      }, 2500);

      return () => clearInterval(interval);
    }
  }, [images.length]);

  const goToImage = (index) => {
    setCurrentImageIndex(index);
  };

  const currentImage = images[currentImageIndex]?.image_url || '';

  return (
    <Link
      ref={cardRef}
      to={`/product/${product.id}`}
      className={`group bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-700 ${
        isVisible
          ? 'opacity-100 translate-y-0'
          : 'opacity-0 translate-y-10'
      }`}
      style={{ transitionDelay: `${Math.min(index * 100, 500)}ms` }}
    >
      <div className="relative aspect-square bg-gray-50 overflow-hidden">
        {/* Images Container */}
        <div className="relative w-full h-full">
          {images.map((img, idx) => (
            <div
              key={idx}
              className={`absolute inset-0 transition-transform duration-500 ease-in-out ${
                idx === currentImageIndex
                  ? 'translate-x-0 opacity-100'
                  : idx < currentImageIndex
                  ? '-translate-x-full opacity-0'
                  : 'translate-x-full opacity-0'
              }`}
            >
              <img
                src={img.image_url}
                alt={product.name}
                className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                onError={(e) => { e.target.style.display = 'none'; }}
              />
            </div>
          ))}

          {!currentImage && (
            <div className="absolute inset-0 flex items-center justify-center text-gray-300">
              <span className="text-4xl">✦</span>
            </div>
          )}
        </div>

        {/* Dots */}
        {images.length > 1 && (
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
            {images.map((_, idx) => (
              <button
                key={idx}
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); goToImage(idx); }}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  idx === currentImageIndex ? 'w-5 bg-black' : 'w-1.5 bg-gray-300 hover:bg-gray-400'
                }`}
              ></button>
            ))}
          </div>
        )}

        {product.stock <= 5 && (
          <span className="absolute top-2 left-2 bg-red-600 text-white text-[10px] px-2 py-0.5 rounded-full z-10">
            Only {product.stock} left
          </span>
        )}

        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300 z-[5]"></div>
      </div>

      <div className="p-3">
        <p className="text-gray-400 text-[10px] mb-1 tracking-wider uppercase truncate">
          {product.categories?.name || 'Uncategorized'}
        </p>
        <h3 className="text-gray-900 font-medium text-sm mb-1 truncate group-hover:underline">
          {product.name}
        </h3>
        <p className="text-black font-bold text-sm">
          {parseFloat(product.price).toFixed(2)} EGP
        </p>
      </div>
    </Link>
  );
}