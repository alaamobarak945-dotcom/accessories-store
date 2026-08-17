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
      .select(`*, categories (id, name), product_images (id, image_url, is_primary)`)
      .order('created_at', { ascending: false });
    if (error) setError('Error loading products: ' + error.message);
    else setProducts(data || []);
    setLoading(false);
  }

  async function fetchCategories() {
    const { data } = await supabase.from('categories').select('*').order('name');
    setCategories(data || []);
  }

  function handleAdd() {
    setEditingProduct(null);
    setName(''); setDescription(''); setPrice(''); setStock(''); setCategoryId('');
    setIsActive(true); setImages([]);
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
    const sortedImages = [...(product.product_images || [])].sort((a, b) => (a.is_primary ? -1 : 1));
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
      const { error } = await supabase.storage.from('product-images').upload(fileName, file);
      if (error) { setError('Error uploading: ' + error.message); setUploading(false); return; }
      const { data: urlData } = supabase.storage.from('product-images').getPublicUrl(fileName);
      uploadedUrls.push({ image_url: urlData.publicUrl, is_primary: images.length === 0 && uploadedUrls.length === 0 });
    }
    setImages([...images, ...uploadedUrls]);
    setUploading(false);
  }

  function handleSetPrimary(index) {
    setImages(images.map((img, i) => ({ ...img, is_primary: i === index })));
  }

  function handleRemoveImage(index) {
    const updated = images.filter((_, i) => i !== index);
    if (updated.length > 0 && !updated.some((img) => img.is_primary)) updated[0].is_primary = true;
    setImages(updated);
  }

  async function handleSave(e) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      if (!name || !price || !stock) throw new Error('Name, price, and stock are required');
      const productData = {
        name, description,
        price: parseFloat(price),
        stock: parseInt(stock),
        category_id: categoryId || null,
        is_active: isActive,
      };

      if (editingProduct) {
        await supabase.from('products').update(productData).eq('id', editingProduct.id);
        await supabase.from('product_images').delete().eq('product_id', editingProduct.id);
        if (images.length > 0) {
          await supabase.from('product_images').insert(images.map((img, index) => ({
            product_id: editingProduct.id, image_url: img.image_url, is_primary: index === 0,
          })));
        }
      } else {
        const { data: newProduct, error } = await supabase.from('products').insert(productData).select().single();
        if (error) throw error;
        if (images.length > 0) {
          await supabase.from('product_images').insert(images.map((img, index) => ({
            product_id: newProduct.id, image_url: img.image_url, is_primary: index === 0,
          })));
        }
      }
      setIsModalOpen(false);
      fetchProducts();
    } catch (err) {
      setError('Error saving: ' + err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(product) {
    if (!confirm(`Delete "${product.name}"?`)) return;
    const { error } = await supabase.from('products').delete().eq('id', product.id);
    if (error) {
      if (error.message.includes('violates foreign key')) setError('Cannot delete: linked to orders.');
      else setError('Error deleting: ' + error.message);
    } else fetchProducts();
  }

  const filteredProducts = products.filter((p) => p.name.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <AdminLayout title="Products">
      <div className="flex flex-col gap-2 mb-4">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search..."
          className="border border-gray-300 rounded-lg px-3 py-2 w-full text-sm focus:outline-none"
        />
        <button onClick={handleAdd} className="bg-gray-800 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition text-sm">
          + Add Product
        </button>
      </div>

      {error && <div className="bg-red-50 text-red-600 px-3 py-2 rounded-lg mb-3 text-xs">{error}</div>}

      {loading ? (
        <div className="text-center py-8"><p className="text-gray-500 text-sm">Loading...</p></div>
      ) : filteredProducts.length === 0 ? (
        <div className="text-center py-8 bg-white rounded-xl shadow-sm"><p className="text-gray-500 text-sm">No products.</p></div>
      ) : (
        <div className="space-y-2">
          {filteredProducts.map((product) => (
            <div key={product.id} className="bg-white rounded-xl shadow-sm p-3 flex items-center gap-3">
              <div className="w-12 h-12 bg-gray-50 rounded-lg overflow-hidden flex-shrink-0">
                {product.product_images?.[0]?.image_url ? (
                  <img src={product.product_images[0].image_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs">✦</div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">{product.name}</p>
                <p className="text-xs text-gray-500">ج.م {parseFloat(product.price).toFixed(2)} · Stock: {product.stock}</p>
                <span className={`inline-block mt-1 px-2 py-0.5 rounded text-[10px] ${product.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'}`}>
                  {product.is_active ? 'Active' : 'Hidden'}
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <button onClick={() => handleEdit(product)} className="text-blue-600 text-xs">Edit</button>
                <button onClick={() => handleDelete(product)} className="text-red-600 text-xs">Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingProduct ? 'Edit Product' : 'Add Product'}>
        <form onSubmit={handleSave} className="space-y-3 max-h-[70vh] overflow-y-auto">
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} required placeholder="Product Name" className="w-full border rounded-lg px-3 py-2 text-sm" />
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} placeholder="Description" className="w-full border rounded-lg px-3 py-2 text-sm" />
          <div className="grid grid-cols-2 gap-2">
            <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} required min="0" step="0.01" placeholder="Price" className="border rounded-lg px-3 py-2 text-sm" />
            <input type="number" value={stock} onChange={(e) => setStock(e.target.value)} required min="0" placeholder="Stock" className="border rounded-lg px-3 py-2 text-sm" />
          </div>
          <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm">
            <option value="">No Category</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
            Active
          </label>
          <input type="file" accept="image/*" multiple onChange={(e) => handleUploadImages(e.target.files)} className="text-sm" />
          {images.length > 0 && (
            <div className="space-y-1">
              {images.map((img, i) => (
                <div key={i} className="flex items-center gap-2 bg-gray-50 rounded p-1">
                  <img src={img.image_url} alt="" className="w-10 h-10 object-cover rounded" />
                  <span className="text-xs flex-1">{img.is_primary ? 'Main' : `Image ${i + 1}`}</span>
                  <button type="button" onClick={() => handleSetPrimary(i)} className="text-xs text-blue-600">Set Main</button>
                  <button type="button" onClick={() => handleRemoveImage(i)} className="text-xs text-red-600">×</button>
                </div>
              ))}
            </div>
          )}
          <div className="flex gap-2">
            <button type="submit" disabled={saving || uploading} className="flex-1 bg-gray-800 text-white py-2 rounded-lg text-sm disabled:opacity-50">
              {saving ? 'Saving...' : 'Save'}
            </button>
            <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 bg-gray-200 py-2 rounded-lg text-sm">Cancel</button>
          </div>
        </form>
      </Modal>
    </AdminLayout>
  );
}