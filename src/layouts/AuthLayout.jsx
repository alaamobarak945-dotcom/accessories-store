import { Link } from 'react-router-dom';

export default function AuthLayout({ children, title, subtitle }) {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-block">
            <img
              src="/logo.png"
              alt="M Style"
              className="h-16 w-auto object-contain mx-auto mb-4"
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
            <span className="text-3xl font-light tracking-tight">
              M <span className="font-bold">STYLE</span>
            </span>
          </Link>
          <h2 className="mt-6 text-xl font-light text-black tracking-wide">{title}</h2>
          <p className="mt-1 text-sm text-gray-400">{subtitle}</p>
        </div>

        <div className="border border-gray-100 rounded-2xl p-6 md:p-8">
          {children}
        </div>
      </div>
    </div>
  );
}