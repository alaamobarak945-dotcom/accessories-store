import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from './lib/supabaseClient';

function Home() {
  const [status, setStatus] = useState('Checking connection...');

  useEffect(() => {
    async function testConnection() {
      const { data, error } = await supabase.from('profiles').select('*').limit(1);
      
      if (error) {
        if (error.message.includes('relation "public.profiles" does not exist')) {
          setStatus('✅ Supabase connected! (profiles table not created yet)');
        } else {
          setStatus('❌ Connection error: ' + error.message);
        }
      } else {
        setStatus('✅ Supabase connected and profiles table exists!');
      }
    }

    testConnection();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">
          🛍️ Accessories Store
        </h1>
        <p className="text-gray-600">{status}</p>
      </div>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;