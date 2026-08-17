import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import AuthLayout from '../layouts/AuthLayout';
import { useAuth } from '../contexts/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signIn(email, password);
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Welcome Back" subtitle="Login to your account">
      <form onSubmit={handleSubmit} className="space-y-4">
        {location.state?.message && (
          <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-xl text-sm">
            {location.state.message}
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm">
            {error}
          </div>
        )}

        <div>
          <label className="block text-xs text-gray-600 mb-2 tracking-widest uppercase">
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-black transition"
            placeholder="you@example.com"
          />
        </div>

        <div>
          <label className="block text-xs text-gray-600 mb-2 tracking-widest uppercase">
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-black transition"
            placeholder="Your password"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-black text-white py-3 rounded-full text-sm tracking-widest hover:bg-gray-800 transition disabled:opacity-50"
        >
          {loading ? 'LOGGING IN...' : 'LOGIN'}
        </button>

        <p className="text-center text-sm text-gray-500">
          Don't have an account?{' '}
          <Link to="/register" className="text-black font-medium hover:underline">
            Register
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}