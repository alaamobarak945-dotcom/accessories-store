import { useState, useEffect } from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import Modal from '../../components/Modal';
import { supabase } from '../../lib/supabaseClient';

export default function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  async function fetchCategories() {
    setLoading(true);
    setError('');
    const { data, error } = await supabase.from('categories').select('*').order('name');
    if (error) setError('Error: ' + error.message);
    else setCategories(data || []);
    setLoading(false);
  }

  function handleAdd() {
    setEditingCategory(null);
    setName('');
    setIsModalOpen(true);
  }

  function handleEdit(category) {
    setEditingCategory(category);
    setName(category.name);
    setIsModalOpen(true);
  }

  async function handleSave(e) {
    e.preventDefault();
    setError('');
    setSaving(true);
    let slug = name.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9\u0600-\u06FF-]/g, '');
    if (!slug) slug = 'category-' + Date.now().toString(36);

    try {
      if (editingCategory) {
        await supabase.from('categories').update({ name, slug }).eq('id', editingCategory.id);
      } else {
        await supabase.from('categories').insert({ name, slug });
      }
      setIsModalOpen(false);
      fetchCategories();
    } catch (err) {
      setError('Error: ' + err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(category) {
    if (!confirm(`Delete "${category.name}"?`)) return;
    await supabase.from('categories').delete().eq('id', category.id);
    fetchCategories();
  }

  return (
    <AdminLayout title="Categories">
      <div className="flex justify-end mb-4">
        <button onClick={handleAdd} className="bg-black text-white px-4 py-2 rounded-full text-xs tracking-widest hover:bg-gray-800 transition">
          + ADD CATEGORY
        </button>
      </div>

      {error && <div className="bg-red-50 text-red-600 px-3 py-2 rounded-lg mb-3 text-xs">{error}</div>}

      {loading ? (
        <div className="text-center py-8"><p className="text-gray-400 text-sm">Loading...</p></div>
      ) : categories.length === 0 ? (
        <div className="text-center py-8 border border-gray-100 rounded-xl"><p className="text-gray-400 text-sm">No categories.</p></div>
      ) : (
        <div className="space-y-2">
          {categories.map((category) => (
            <div key={category.id} className="border border-gray-100 rounded-xl p-3 flex items-center justify-between hover:border-black transition">
              <div>
                <p className="text-sm font-medium text-black">{category.name}</p>
                <p className="text-xs text-gray-400">{category.slug}</p>
              </div>
              <div className="flex gap-3">
                <button onClick={() => handleEdit(category)} className="text-xs text-gray-600 hover:text-black">Edit</button>
                <button onClick={() => handleDelete(category)} className="text-xs text-red-600 hover:text-red-800">Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingCategory ? 'Edit Category' : 'Add Category'}>
        <form onSubmit={handleSave} className="space-y-3">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="Category Name"
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-black"
          />
          <div className="flex gap-2">
            <button type="submit" disabled={saving} className="flex-1 bg-black text-white py-2.5 rounded-full text-xs tracking-widest hover:bg-gray-800 transition disabled:opacity-50">
              {saving ? 'Saving...' : 'Save'}
            </button>
            <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 border border-gray-200 py-2.5 rounded-full text-xs tracking-widest hover:border-black transition">
              Cancel
            </button>
          </div>
        </form>
      </Modal>
    </AdminLayout>
  );
}