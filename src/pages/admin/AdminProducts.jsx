import { useState, useEffect } from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import Modal from '../../components/Modal';
import { supabase } from '../../lib/supabaseClient';

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [saving, setSaving] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [images, setImages] = useState([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  async function fetchProducts() {
    setLoading(true);
    setError('');

    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        categories (
          id,
          name
        ),
        product_images (
          id,
          image_url,
          is_primary
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      setError('Error loading products: ' + error.message);
    } else {
      setProducts(data || []);
    }

    setLoading(false);
  }

  async function fetchCategories() {
    const { data } = await supabase
      .from('categories')
      .select('*')
      .order('name');

    setCategories(data || []);
  }

  function handleAdd() {
    setEditingProduct(null);
    setName('');
    setDescription('');
    setPrice('');
    setStock('');
    setCategoryId('');
    setIsActive(true);
    setImages([]);
    setIsModalOpen(true);
  }

  function handleEdit(product) {
    setEditingProduct(product);
    setName(product.name);
    setDescription(product.description || '');
    setPrice(product.price.toString());
    setStock(product.stock.toString());
    setCategoryId(product.category_id || '');
    setIsActive(product.is_active);
    setImages(product.product_images || []);
    setIsModalOpen(true);
  }

  async function handleUploadImages(files) {
    setUploading(true);
    setError('');

    const uploadedUrls = [];

    for (const file of files) {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error } = await supabase.storage
        .from('product-images')
        .upload(filePath, file);

      if (error) {
        setError('Error uploading image: ' + error.message);
        setUploading(false);
        return;
      }

      const { data: urlData } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath);

      uploadedUrls.push({
        image_url: urlData.publicUrl,
        is_primary: uploadedUrls.length === 0 && images.length === 0,
      });
    }

    setImages([...images, ...uploadedUrls]);
    setUploading(false);
  }

  async function handleSave(e) {
    e.preventDefault();
    setError('');
    setSaving(true);

    try {
      if (!name || !price || !stock) {
        throw new Error('Name, price, and stock are required');
      }

      const productData = {
        name,
        description,
        price: parseFloat(price),
        stock: parseInt(stock),
        category_id: categoryId || null,
        is_active: isActive,
      };

      if (editingProduct) {
        // تعديل المنتج
        const { error } = await supabase
          .from('products')
          .update(productData)
          .eq('id', editingProduct.id);

        if (error) throw error;

        // حفظ الصور الجديدة (التي لا تحتوي على id)
        const newImages = images.filter((img) => !img.id);

        if (newImages.length > 0) {
          const imageInserts = newImages.map((img) => ({
            product_id: editingProduct.id,
            image_url: img.image_url,
            is_primary: img.is_primary,
          }));

          const { error: imageError } = await supabase
            .from('product_images')
            .insert(imageInserts);

          if (imageError) throw imageError;
        }

        // حذف الصور المحذوفة من Database
        const existingImageIds = images.filter((img) => img.id).map((img) => img.id);
        
        if (existingImageIds.length > 0) {
          const { error: deleteError } = await supabase
            .from('product_images')
            .delete()
            .eq('product_id', editingProduct.id)
            .not('id', 'in', `(${existingImageIds.join(',')})`);

          if (deleteError) throw deleteError;
        }
      } else {
        // إضافة منتج جديد
        const { data: newProduct, error } = await supabase
          .from('products')
          .insert(productData)
          .select()
          .single();

        if (error) throw error;

        if (images.length > 0) {
          const imageInserts = images.map((img) => ({
            product_id: newProduct.id,
            image_url: img.image_url,
            is_primary: img.is_primary,
          }));

          const { error: imageError } = await supabase
            .from('product_images')
            .insert(imageInserts);

          if (imageError) throw imageError;
        }
      }

      setIsModalOpen(false);
      fetchProducts();
    } catch (err) {
      setError('Error saving product: ' + err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(product) {
    if (!confirm(`Are you sure you want to delete "${product.name}"?`)) {
      return;
    }

    setError('');

    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', product.id);

    if (error) {
      setError('Error deleting product: ' + error.message);
    } else {
      fetchProducts();
    }
  }

  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AdminLayout title="Products">
      <div className="flex items-center justify-between mb-6">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search products..."
          className="border border-gray-300 rounded-lg px-4 py-2 w-64 focus:outline-none focus:ring-2 focus:ring-gray-400"
        />
        <button
          onClick={handleAdd}
          className="bg-gray-800 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition"
        >
          + Add Product
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-4">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-12">
          <p className="text-gray-500">Loading products...</p>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl shadow-sm">
          <p className="text-gray-500">No products found.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Product
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Stock
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredProducts.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {product.product_images?.[0]?.image_url && (
                        <img
                          src={product.product_images[0].image_url}
                          alt={product.name}
                          className="w-10 h-10 object-cover rounded"
                        />
                      )}
                      <span className="text-gray-800 font-medium">
                        {product.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-600">
                    {product.categories?.name || '—'}
                  </td>
                  <td className="px-6 py-4 text-gray-600">
                    ${parseFloat(product.price).toFixed(2)}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={
                        product.stock <= 5
                          ? 'text-red-600 font-medium'
                          : 'text-gray-600'
                      }
                    >
                      {product.stock}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2 py-1 rounded text-xs ${
                        product.is_active
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-200 text-gray-600'
                      }`}
                    >
                      {product.is_active ? 'Active' : 'Hidden'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => handleEdit(product)}
                      className="text-blue-600 hover:text-blue-800 mr-4"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(product)}
                      className="text-red-600 hover:text-red-800"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingProduct ? 'Edit Product' : 'Add Product'}
      >
        <form onSubmit={handleSave} className="space-y-4 max-h-[70vh] overflow-y-auto">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Product Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-gray-400"
              placeholder="Gold Necklace"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-gray-400"
              placeholder="Product description..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Price ($)
              </label>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                required
                min="0"
                step="0.01"
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-gray-400"
                placeholder="49.99"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Stock
              </label>
              <input
                type="number"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                required
                min="0"
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-gray-400"
                placeholder="10"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-gray-400"
            >
              <option value="">No Category</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="rounded"
              />
              <span className="text-sm text-gray-700">Active (visible to customers)</span>
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Product Images
            </label>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => handleUploadImages(e.target.files)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm"
            />
            {uploading && <p className="text-gray-500 text-sm mt-1">Uploading...</p>}
            {images.length > 0 && (
              <div className="flex gap-2 mt-2 flex-wrap">
                {images.map((img, index) => (
                  <img
                    key={index}
                    src={img.image_url}
                    alt="Product"
                    className="w-16 h-16 object-cover rounded"
                  />
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={saving || uploading}
              className="flex-1 bg-gray-800 text-white py-2 rounded-lg hover:bg-gray-700 transition disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Product'}
            </button>
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="flex-1 bg-gray-200 text-gray-800 py-2 rounded-lg hover:bg-gray-300 transition"
            >
              Cancel
            </button>
          </div>
        </form>
      </Modal>
    </AdminLayout>
  );
}