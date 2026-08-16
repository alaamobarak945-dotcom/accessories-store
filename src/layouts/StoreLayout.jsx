import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function StoreLayout({ children }) {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error.message);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="text-2xl font-bold text-gray-800">
              🛍️ Accessories Store
            </Link>

            <nav className="flex items-center gap-6">
              <Link
                to="/shop"
                className="text-gray-600 hover:text-gray-800"
              >
                Shop
              </Link>
              <Link
  to="/cart"
  className="text-gray-600 hover:text-gray-800"
>
  🛒 Cart
</Link>

              {user ? (
                <>
                  <span className="text-gray-600 text-sm hidden md:inline">
                    Hello, {profile?.full_name || user.email}
                  </span>
                  {profile?.role === 'admin' && (
                    <Link
                      to="/admin"
                      className="bg-gray-800 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition text-sm"
                    >
                      Admin Panel
                    </Link>
                  )}
                  <button
                    onClick={handleLogout}
                    className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 transition text-sm"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="text-gray-600 hover:text-gray-800"
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    className="bg-gray-800 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition text-sm"
                  >
                    Register
                  </Link>
                </>
              )}
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">{children}</main>

      {/* Footer */}
      <footer className="bg-white border-t mt-12">
        <div className="max-w-7xl mx-auto px-4 py-6 text-center text-gray-500 text-sm">
          © 2026 Accessories Store. All rights reserved.
        </div>
      </footer>
    </div>
  );
}