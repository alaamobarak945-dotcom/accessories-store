import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { useLanguage } from '../contexts/LanguageContext';

export default function StoreLayout({ children }) {
  const { user, profile, signOut } = useAuth();
  const { totalItems } = useCart();
  const { language, toggleLanguage, t } = useLanguage();
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
      <div className="bg-black text-white text-xs py-2 text-center tracking-wider">
        FREE SHIPPING ON ORDERS OVER 500 EGP
      </div>

      <header className="border-b border-gray-100 sticky top-0 z-40 bg-white">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-4">
          <div className="flex items-center justify-between gap-4">
            <Link to="/" className="flex items-center gap-3">
              <img src="/logo.png" alt="M Style" className="h-12 w-auto object-contain" onError={(e) => { e.target.style.display = 'none'; }} />
              <span className="text-2xl md:text-3xl font-light tracking-tight">
                M <span className="font-bold">STYLE</span>
              </span>
            </Link>

            <nav className="hidden md:flex items-center gap-8">
              <Link to="/" className="text-sm text-gray-600 hover:text-black transition tracking-wide">{t('home')}</Link>
              <Link to="/shop" className="text-sm text-gray-600 hover:text-black transition tracking-wide">{t('shop')}</Link>
              {user && (
                <Link to="/my-orders" className="text-sm text-gray-600 hover:text-black transition tracking-wide">{t('myOrders')}</Link>
              )}
            </nav>

            <div className="flex items-center gap-3">
              {/* Language Toggle */}
              <button
                onClick={toggleLanguage}
                className="text-sm text-gray-600 hover:text-black transition tracking-wide border border-gray-200 rounded-full px-3 py-1"
              >
                {language === 'ar' ? 'EN' : 'عربي'}
              </button>

              <Link to="/cart" className="relative p-2 hover:bg-gray-50 rounded-full transition">
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
                    <Link to="/admin" className="bg-black text-white px-4 py-2 rounded-full text-xs tracking-wider hover:bg-gray-800 transition">
                      {t('admin')}
                    </Link>
                  )}
                  <button onClick={handleLogout} className="text-sm text-gray-600 hover:text-black transition tracking-wide">
                    {t('logout')}
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <Link to="/login" className="text-sm text-gray-600 hover:text-black transition tracking-wide hidden md:inline">
                    {t('login')}
                  </Link>
                  <Link to="/register" className="bg-black text-white px-5 py-2 rounded-full text-xs tracking-wider hover:bg-gray-800 transition">
                    {t('register')}
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Mobile Navigation */}
          <nav className="md:hidden flex items-center gap-4 mt-4 pb-2 overflow-x-auto">
            <Link to="/" className="text-xs text-gray-600 hover:text-black whitespace-nowrap">{t('home')}</Link>
            <Link to="/shop" className="text-xs text-gray-600 hover:text-black whitespace-nowrap">{t('shop')}</Link>
            {user && <Link to="/my-orders" className="text-xs text-gray-600 hover:text-black whitespace-nowrap">{t('myOrders')}</Link>}
            {!user && <Link to="/login" className="text-xs text-gray-600 hover:text-black whitespace-nowrap">{t('login')}</Link>}
          </nav>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="bg-black text-white mt-20">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div>
              <h3 className="text-2xl font-light mb-4">M <span className="font-bold">STYLE</span></h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                Premium accessories curated for the modern individual.
              </p>
            </div>
            <div>
              <h4 className="text-sm font-semibold tracking-wider mb-4">QUICK LINKS</h4>
              <div className="space-y-3 text-gray-400 text-sm">
                <Link to="/shop" className="block hover:text-white transition">{t('shop')}</Link>
                <Link to="/cart" className="block hover:text-white transition">{t('cart')}</Link>
                {user && <Link to="/my-orders" className="block hover:text-white transition">{t('myOrders')}</Link>}
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