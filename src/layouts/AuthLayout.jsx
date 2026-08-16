import { Link } from 'react-router-dom';

export default function AuthLayout({ children, title, subtitle }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-sm p-8">
          <div className="text-center mb-8">
            <Link to="/" className="text-3xl font-bold text-gray-800">
              🛍️ Accessories Store
            </Link>
            <h2 className="mt-4 text-2xl font-semibold text-gray-800">
              {title}
            </h2>
            <p className="mt-1 text-gray-500">{subtitle}</p>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}