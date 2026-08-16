import { Link } from 'react-router-dom';
import StoreLayout from '../layouts/StoreLayout';

export default function Home() {
  return (
    <StoreLayout>
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <h1 className="text-5xl font-bold text-gray-800 mb-4">
          Welcome to Accessories Store
        </h1>
        <p className="text-gray-600 text-lg mb-8">
          Your one-stop shop for premium accessories.
        </p>
        <Link
          to="/shop"
          className="bg-gray-800 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition text-lg"
        >
          Shop Now
        </Link>
      </div>
    </StoreLayout>
  );
}