import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login, register } from '../api/auth';
import { useAuthStore } from '../stores/authStore';

export default function LoginRegister() {
  const navigate = useNavigate();
  const { setToken } = useAuthStore();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      if (isLogin) {
        const data = await login(email, password);
        setToken(data.access_token);
        navigate('/');
      } else {
        await register(email, password);
        const data = await login(email, password);
        setToken(data.access_token);
        navigate('/');
      }
    } catch {
      setError(isLogin ? 'Login failed' : 'Registration failed');
    }
  };

  return (
    <div className="max-w-md mx-auto mt-20">
      <div className="bg-white rounded-lg border border-gray-200 p-8">
        <h2 className="text-2xl font-bold text-center mb-6">
          {isLogin ? 'Login' : 'Register'}
        </h2>
        {error && <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg mb-4">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2" required />
          </div>
          <button type="submit" className="w-full bg-maritime-600 text-white py-2 rounded-lg hover:bg-maritime-700">
            {isLogin ? 'Login' : 'Register'}
          </button>
        </form>
        <div className="text-center mt-4">
          <button onClick={() => setIsLogin(!isLogin)} className="text-sm text-maritime-600 hover:underline">
            {isLogin ? 'Need an account? Register' : 'Already have an account? Login'}
          </button>
        </div>
        <div className="text-center mt-4 text-sm text-gray-400">
          Or continue in anonymous mode
        </div>
      </div>
    </div>
  );
}
