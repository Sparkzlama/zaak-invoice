import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase.js';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, form.email, form.password);
      navigate('/');
    } catch (err) {
      const msg = err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential'
        ? 'Invalid email or password'
        : err.code === 'auth/invalid-email' ? 'Invalid email format'
        : err.code === 'auth/too-many-requests' ? 'Too many attempts. Try again later.'
        : err.code === 'auth/operation-not-allowed' ? 'Email/Password sign-in not enabled in Firebase Console → Authentication → Sign-in method'
        : err.code === 'auth/configuration-not-found' ? 'Firebase project not found. Check your .env values.'
        : `Error: ${err.code || err.message}`;
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-50 to-blue-100 px-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <img src="/seal.png" alt="Seal" className="h-16 w-16 mx-auto mb-2" onError={(e) => { e.target.style.display = 'none'; }} />
          <h1 className="text-2xl font-bold text-brand-800">Zaak Construction</h1>
          <p className="text-gray-500 text-sm mt-1">Invoice Management System</p>
        </div>
        <h2 className="text-xl font-semibold mb-6">Sign In</h2>
        {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input type="email" className="input-field" value={form.email} onChange={e => setForm({...form, email: e.target.value})} required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input type="password" className="input-field" value={form.password} onChange={e => setForm({...form, password: e.target.value})} required />
          </div>
          <div className="text-right">
            <Link to="/forgot-password" className="text-sm text-brand-600 hover:underline">Forgot Password?</Link>
          </div>
          <button type="submit" className="btn-primary w-full" disabled={loading}>{loading ? 'Signing in...' : 'Sign In'}</button>
        </form>
        <p className="text-center text-sm text-gray-500 mt-6">
          Don't have an account? <Link to="/signup" className="text-brand-600 hover:underline font-medium">Sign Up</Link>
        </p>
      </div>
    </div>
  );
}
