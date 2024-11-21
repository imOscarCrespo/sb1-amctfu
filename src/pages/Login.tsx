import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/axios';
import toast from 'react-hot-toast';

export default function Login() {
  const navigate = useNavigate();
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await api.post('/api/token/', credentials);
      localStorage.setItem('accessToken', response.data.access);
      localStorage.setItem('refreshToken', response.data.refresh);
      navigate('/', { replace: true });
    } catch (error) {
      toast.error('Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm card p-8">
        <div className="text-center mb-8">
          <div className="inline-block bg-black px-6 py-3 rounded-lg mb-6">
            <h1 className="text-white text-2xl font-light tracking-[0.2em]">
              ONETOC
            </h1>
          </div>
          <p className="text-gray-500">
            Sign in to manage your matches
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Username
            </label>
            <input
              type="text"
              value={credentials.username}
              onChange={(e) => setCredentials(prev => ({ ...prev, username: e.target.value }))}
              className="input"
              required
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Password
            </label>
            <input
              type="password"
              value={credentials.password}
              onChange={(e) => setCredentials(prev => ({ ...prev, password: e.target.value }))}
              className="input"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn w-full py-2.5 transition-all duration-200 transform active:scale-95"
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        <p className="mt-8 text-sm text-center text-gray-500">
          Analyze and improve your team's performance with app's advanced match tracking system.
        </p>
      </div>
    </div>
  );
}