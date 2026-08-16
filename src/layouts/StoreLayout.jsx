import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';

export default function StoreLayout({ children }) {
  const { user, profile, signOut } = useAuth();
  const { totalItems } = useCart();
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
    <div className="min-h-screen bg-white flex flex-col">
      {/* Announcement Bar */}
      <div className="bg-black text-white text-xs py-2 text-center tracking-wider">
        FREE SHIPPING ON ORDERS OVER 500 EGP
      </div>

      {/* Header */}
      <header className="border-b border-gray-100 sticky top-0 z-40 bg-white">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-4">
          <div className="flex items-center justify-between gap-4">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3">
              <img
                src="/logo.png"
                alt="M Style"
                className="h-12 w-auto object-contain"
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
              <span className="text-2xl md:text-3xl font-light tracking-tight">
                M <span className="font-bold">STYLE</span>
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-8">
              <Link to="/" className="text-sm text-gray-600 hover:text-black transition tracking-wide">
                HOME
              </Link>
              <Link to="/shop" className="text-sm text-gray-600 hover:text-black transition tracking-wide">
                SHOP
              </Link>
              {user && (
                <Link to="/my-orders" className="text-sm text-gray-600 hover:text-black transition tracking-wide">
                  MY ORDERS
                </Link>
              )}
            </nav>

            {/* Right Actions */}
            <div className="flex items-center gap-3">
              <Link
                to="/cart"
                className="relative p-2 hover:bg-gray-50 rounded-full transition"
              >
                <span className="text-xl">🛒</span>
                {totalItems > 0 && (
                  <span className="absolute -top-1 -right-1 bg-black text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">
                    {totalItems}
                  </span>
                )}
              </Link>

              {user ? (
                <div className="flex items-center gap-3">
                  {profile?.role === 'admin' && (
                    <Link
                      to="/admin"
                      className="bg-black text-white px-4 py-2 rounded-full text-xs tracking-wider hover:bg-gray-800 transition"
                    >
                      ADMIN
                    </Link>
                  )}
                  <button
                    onClick={handleLogout}
                    className="text-sm text-gray-600 hover:text-black transition tracking-wide"
                  >
                    LOGOUT
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <Link
                    to="/login"
                    className="text-sm text-gray-600 hover:text-black transition tracking-wide hidden md:inline"
                  >
                    LOGIN
                  </Link>
                  <Link
                    to="/register"
                    className="bg-black text-white px-5 py-2 rounded-full text-xs tracking-wider hover:bg-gray-800 transition"
                  >
                    REGISTER
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Mobile Navigation */}
          <nav className="md:hidden flex items-center gap-4 mt-4 pb-2 overflow-x-auto">
            <Link to="/" className="text-xs text-gray-600 hover:text-black whitespace-nowrap">
              HOME
            </Link>
            <Link to="/shop" className="text-xs text-gray-600 hover:text-black whitespace-nowrap">
              SHOP
            </Link>
            {user && (
              <Link to="/my-orders" className="text-xs text-gray-600 hover:text-black whitespace-nowrap">
                MY ORDERS
              </Link>
            )}
            {!user && (
              <Link to="/login" className="text-xs text-gray-600 hover:text-black whitespace-nowrap">
                LOGIN
              </Link>
            )}
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">{children}</main>

      {/* Footer */}
      <footer className="bg-black text-white mt-20">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <img
                  src="/logo.png"
                  alt="M Style"
                  className="h-10 w-auto object-contain"
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
                <h3 className="text-2xl font-light">
                  M <span className="font-bold">STYLE</span>
                </h3>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed">
                Premium accessories curated for the modern individual.
              </p>
            </div>
            <div>
              <h4 className="text-sm font-semibold tracking-wider mb-4">QUICK LINKS</h4>
              <div className="space-y-3 text-gray-400 text-sm">
                <Link to="/shop" className="block hover:text-white transition">Shop</Link>
                <Link to="/cart" className="block hover:text-white transition">Cart</Link>
                {user && <Link to="/my-orders" className="block hover:text-white transition">My Orders</Link>}
              </div>
            </div>
            <div>
              <h4 className="text-sm font-semibold tracking-wider mb-4">CONTACT</h4>
              <p className="text-gray-400 text-sm leading-relaxed">
                Phone: 01040908007
                <br />
                Email: mohanadehab20088@gmail.com
              </p>
            </div>
          </div>
        </div>
        <div className="border-t border-gray-800 py-6 text-center text-gray-500 text-xs tracking-wider">
          © 2026 M STYLE. ALL RIGHTS RESERVED.
        </div>
      </footer>
    </div>
  );
}