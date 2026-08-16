import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import StoreLayout from '../layouts/StoreLayout';
import { supabase } from '../lib/supabaseClient';

export default function Shop() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const categoryFromUrl = searchParams.get('category');
    if (categoryFromUrl) {
      setSelectedCategory(categoryFromUrl);
    }
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [selectedCategory, sortBy]);

  async function fetchCategories() {
    const { data } = await supabase
      .from('categories')
      .select('*')
      .order('name');

    setCategories(data || []);
  }

  async function fetchProducts() {
    setLoading(true);

    let query = supabase
      .from('products')
      .select(`
        *,
        categories (id, name),
        product_images (id, image_url, is_primary)
      `)
      .eq('is_active', true);

    if (selectedCategory !== 'all') {
      query = query.eq('category_id', selectedCategory);
    }

    if (sortBy === 'newest') {
      query = query.order('created_at', { ascending: false });
    } else if (sortBy === 'oldest') {
      query = query.order('created_at', { ascending: true });
    } else if (sortBy === 'price_low') {
      query = query.order('price', { ascending: true });
    } else if (sortBy === 'price_high') {
      query = query.order('price', { ascending: false });
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching products:', error.message);
      setProducts([]);
    } else {
      setProducts(data || []);
    }

    setLoading(false);
  }

  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <StoreLayout>
      {/* Compact Header */}
      <section className="bg-black text-white py-8">
        <div className="max-w-7xl mx-auto px-4 md:px-8 text-center">
          <h1 className="text-3xl md:text-4xl font-light tracking-tight">
            OUR COLLECTION
          </h1>
          <p className="text-gray-400 text-sm tracking-wide mt-1">
            Discover premium accessories
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-6">
        {/* Categories */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-4 justify-start md:justify-center">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-4 py-1.5 rounded-full text-xs tracking-wide whitespace-nowrap transition ${
              selectedCategory === 'all'
                ? 'bg-black text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            ALL
          </button>
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`px-4 py-1.5 rounded-full text-xs tracking-wide whitespace-nowrap transition ${
                selectedCategory === category.id
                  ? 'bg-black text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {category.name.toUpperCase()}
            </button>
          ))}
        </div>

        {/* Search and Sort */}
        <div className="flex flex-col md:flex-row gap-3 mb-6 justify-between">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search products..."
            className="border border-gray-200 rounded-full px-4 py-2 w-full md:w-72 focus:outline-none focus:border-black transition text-sm"
          />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="border border-gray-200 rounded-full px-4 py-2 focus:outline-none focus:border-black transition text-sm"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="price_low">Price: Low to High</option>
            <option value="price_high">Price: High to Low</option>
          </select>
        </div>

        {/* Products */}
        {loading ? (
          <div className="text-center py-8">
            <p className="text-gray-500">Loading...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-400">No products found.</p>
          </div>
        ) : (
          <>
            <p className="text-gray-400 text-xs mb-3 tracking-wide">
              {filteredProducts.length} PRODUCT{filteredProducts.length !== 1 ? 'S' : ''}
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
              {filteredProducts.map((product) => (
                <Link
                  key={product.id}
                  to={`/product/${product.id}`}
                  className="group bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300"
                >
                  <div className="relative aspect-square bg-gray-50 overflow-hidden">
                    {product.product_images?.[0]?.image_url ? (
                      <img
                        src={product.product_images[0].image_url}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-300">
                        <span className="text-4xl">✦</span>
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
              ))}
            </div>
          </>
        )}
      </div>
    </StoreLayout>
  );
}