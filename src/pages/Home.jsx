import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import StoreLayout from '../layouts/StoreLayout';
import { supabase } from '../lib/supabaseClient';
import ProductCard from '../components/ProductCard';

export default function Home() {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);

    const { data: categoriesData } = await supabase
      .from('categories')
      .select('*')
      .limit(10);

    setCategories(categoriesData || []);

    const { data: productsData } = await supabase
      .from('products')
      .select(`
        *,
        categories (name),
        product_images (image_url, is_primary)
      `)
      .eq('is_active', true)
      .limit(10)
      .order('created_at', { ascending: false });

    setFeaturedProducts(productsData || []);
    setLoading(false);
  }

  const filteredProducts = selectedCategory === 'all'
    ? featuredProducts
    : featuredProducts.filter((p) => p.category_id === selectedCategory);

  return (
    <StoreLayout>
      {/* Hero */}
      <section className="bg-black text-white">
        <div className="w-full px-4 md:px-8 py-10 md:py-14 text-center">
          <img
            src="/logo.png"
            alt="M Style"
            className="h-20 w-auto object-contain mx-auto mb-4"
            onError={(e) => { e.target.style.display = 'none'; }}
          />
          <h1 className="text-3xl md:text-5xl font-light tracking-tight mb-2">
            M <span className="font-bold">STYLE</span>
          </h1>
          <p className="text-base md:text-lg text-gray-400 mb-6 tracking-wide">
            Premium Accessories Collection
          </p>
          <Link
            to="/shop"
            className="inline-block bg-white text-black px-8 py-2.5 rounded-full text-sm tracking-widest hover:bg-gray-200 transition"
          >
            SHOP NOW
          </Link>
        </div>
      </section>

      {/* Categories */}
      <section className="w-full px-4 md:px-6 py-8">
        <h2 className="text-xl md:text-2xl font-light text-center mb-4 tracking-tight">
          SHOP BY CATEGORY
        </h2>
        <div className="flex gap-2 overflow-x-auto pb-2 justify-start md:justify-center">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-5 py-1.5 rounded-full text-xs tracking-wide whitespace-nowrap transition ${
              selectedCategory === 'all' ? 'bg-black text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All
          </button>
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`px-5 py-1.5 rounded-full text-xs tracking-wide whitespace-nowrap transition ${
                selectedCategory === category.id ? 'bg-black text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {category.name}
            </button>
          ))}
        </div>
      </section>

      {/* Products */}
      <section className="bg-gray-50 py-10">
        <div className="w-full px-4 md:px-6">
          <h2 className="text-xl md:text-2xl font-light text-center mb-6 tracking-tight">
            {selectedCategory === 'all' ? 'FEATURED PRODUCTS' : 'PRODUCTS'}
          </h2>
          {loading ? (
            <div className="text-center py-8">
              <p className="text-gray-400">Loading...</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <p className="text-center text-gray-400 text-sm">No products.</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
              {filteredProducts.map((product, index) => (
                <ProductCard key={product.id} product={product} index={index} />
              ))}
            </div>
          )}
          <div className="text-center mt-6">
            <Link
              to="/shop"
              className="inline-block border border-black text-black px-6 py-2 rounded-full text-xs tracking-widest hover:bg-black hover:text-white transition"
            >
              VIEW ALL
            </Link>
          </div>
        </div>
      </section>
    </StoreLayout>
  );
}