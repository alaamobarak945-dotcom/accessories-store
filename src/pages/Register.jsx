import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthLayout from '../layouts/AuthLayout';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';

export default function Register() {
  const { t } = useLanguage();
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { signUp } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (password.length < 6) { setError('Password must be at least 6 characters'); return; }
    setLoading(true);
    try {
      await signUp(email, password, fullName, phone);
      navigate('/login', { state: { message: 'Account created! Please login now.' } });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title={t('register')} subtitle={t('register')}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl text-sm">{error}</div>}
        <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} required placeholder="Full Name" className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-black transition" />
        <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} required placeholder="Phone" className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-black transition" />
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="Email" className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-black transition" />
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="Password (min 6)" className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-black transition" />
        <button type="submit" disabled={loading} className="w-full bg-black text-white py-3 rounded-full text-sm tracking-widest hover:bg-gray-800 transition disabled:opacity-50">
          {loading ? '...' : t('register')}
        </button>
        <p className="text-center text-sm text-gray-500">
          <Link to="/login" className="text-black font-medium hover:underline">{t('login')}</Link>
        </p>
      </form>
    </AuthLayout>
  );
}