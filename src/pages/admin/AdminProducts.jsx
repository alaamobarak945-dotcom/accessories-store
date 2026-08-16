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
        categories (id, name),
        product_images (id, image_url, is_primary, created_at)
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
    
    // ترتيب الصور: الرئيسية أولاً
    const sortedImages = [...(product.product_images || [])].sort((a, b) => {
      if (a.is_primary && !b.is_primary) return -1;
      if (!a.is_primary && b.is_primary) return 1;
      return 0;
    });
    
    setImages(sortedImages);
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
        is_primary: images.length === 0 && uploadedUrls.length === 0,
      });
    }

    setImages([...images, ...uploadedUrls]);
    setUploading(false);
  }

  function handleSetPrimary(index) {
    const updatedImages = images.map((img, i) => ({
      ...img,
      is_primary: i === index,
    }));
    setImages(updatedImages);
  }

  function handleRemoveImage(index) {
    const updatedImages = images.filter((_, i) => i !== index);

    // إذا حذفنا الصورة الرئيسية، نجعل الأولى هي الرئيسية
    if (updatedImages.length > 0 && !updatedImages.some((img) => img.is_primary)) {
      updatedImages[0].is_primary = true;
    }

    setImages(updatedImages);
  }

  function handleMoveImage(index, direction) {
    const newImages = [...images];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;

    if (targetIndex < 0 || targetIndex >= newImages.length) return;

    [newImages[index], newImages[targetIndex]] = [newImages[targetIndex], newImages[index]];

    // تحديث الرئيسية لتكون أول صورة
    newImages.forEach((img, i) => {
      img.is_primary = i === 0;
    });

    setImages(newImages);
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
        // ============ تعديل منتج ============
        const { error: productError } = await supabase
          .from('products')
          .update(productData)
          .eq('id', editingProduct.id);

        if (productError) throw productError;

        // 1. حذف كل الصور القديمة من Database
        const { error: deleteError } = await supabase
          .from('product_images')
          .delete()
          .eq('product_id', editingProduct.id);

        if (deleteError) throw deleteError;

        // 2. إضافة كل الصور من جديد (القديمة والجديدة)
        if (images.length > 0) {
          const imageInserts = images.map((img, index) => ({
            product_id: editingProduct.id,
            image_url: img.image_url,
            is_primary: index === 0, // أول صورة = الرئيسية
          }));

          const { error: imageError } = await supabase
            .from('product_images')
            .insert(imageInserts);

          if (imageError) throw imageError;
        }
      } else {
        // ============ إضافة منتج جديد ============
        const { data: newProduct, error: productError } = await supabase
          .from('products')
          .insert(productData)
          .select()
          .single();

        if (productError) throw productError;

        if (images.length > 0) {
          const imageInserts = images.map((img, index) => ({
            product_id: newProduct.id,
            image_url: img.image_url,
            is_primary: index === 0,
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
                  Images
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
                    ج.م {parseFloat(product.price).toFixed(2)}
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
                  <td className="px-6 py-4 text-gray-600">
                    {product.product_images?.length || 0}
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
                Price (ج.م)
              </label>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                required
                min="0"
                step="0.01"
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-gray-400"
                placeholder="99.00"
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

          {/* Product Images */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Product Images
            </label>

            <input
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => handleUploadImages(e.target.files)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm mb-2"
            />
            {uploading && <p className="text-gray-500 text-sm mb-2">Uploading...</p>}

            {images.length > 0 && (
              <div className="space-y-2">
                {images.map((img, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 bg-gray-50 rounded-lg p-2"
                  >
                    <img
                      src={img.image_url}
                      alt={`Product ${index + 1}`}
                      className="w-16 h-16 object-cover rounded"
                    />
                    <div className="flex-1">
                      <p className="text-sm text-gray-600">
                        Image {index + 1}
                        {img.is_primary && (
                          <span className="ml-2 bg-gray-800 text-white px-2 py-0.5 rounded text-xs">
                            Main
                          </span>
                        )}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => handleMoveImage(index, 'up')}
                        disabled={index === 0}
                        className="px-2 py-1 text-gray-600 hover:text-gray-800 disabled:opacity-30"
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMoveImage(index, 'down')}
                        disabled={index === images.length - 1}
                        className="px-2 py-1 text-gray-600 hover:text-gray-800 disabled:opacity-30"
                      >
                        ↓
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSetPrimary(index)}
                        className={`px-2 py-1 text-xs ${
                          img.is_primary
                            ? 'text-gray-400'
                            : 'text-blue-600 hover:text-blue-800'
                        }`}
                      >
                        {img.is_primary ? 'Main' : 'Set Main'}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(index)}
                        className="px-2 py-1 text-red-600 hover:text-red-800"
                      >
                        ×
                      </button>
                    </div>
                  </div>
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