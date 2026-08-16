import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Home() {
  const { user, profile, signOut } = useAuth();

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Logout error:', error.message);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="text-2xl font-bold text-gray-800">
            🛍️ Accessories Store
          </Link>
          <div className="flex items-center gap-4">
            {user ? (
              <>
                <span className="text-gray-600">
                  Hello, {profile?.full_name || user.email}
                </span>
                <button
                  onClick={handleLogout}
                  className="bg-gray-800 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition"
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
                  className="bg-gray-800 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition"
                >
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold text-gray-800 mb-4">
          Welcome to Accessories Store
        </h1>
        <p className="text-gray-600 text-lg">
          Your one-stop shop for premium accessories.
        </p>
      </main>
    </div>
  );
}