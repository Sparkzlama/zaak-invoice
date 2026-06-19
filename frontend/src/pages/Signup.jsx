import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth } from '../firebase.js';

export default function Signup() {
  const [form, setForm] = useState({ name: '', email: '', mobile: '', password: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirmPassword) { setError('Passwords do not match'); return; }
    if (form.password.length < 6) { setError('Password must be at least 6 characters'); return; }
    setLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, form.email, form.password);
      await updateProfile(cred.user, { displayName: form.name });
      navigate('/');
    } catch (err) {
      const msg = err.code === 'auth/email-already-in-use' ? 'Email already registered'
        : err.code === 'auth/weak-password' ? 'Password is too weak'
        : err.code === 'auth/invalid-email' ? 'Invalid email format'
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
          <p className="text-gray-500 text-sm mt-1">Create your account</p>
        </div>
        <h2 className="text-xl font-semibold mb-6">Sign Up</h2>
        {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
            <input type="text" className="input-field" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input type="email" className="input-field" value={form.email} onChange={e => setForm({...form, email: e.target.value})} required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mobile (optional)</label>
            <input type="tel" className="input-field" value={form.mobile} onChange={e => setForm({...form, mobile: e.target.value})} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input type="password" className="input-field" value={form.password} onChange={e => setForm({...form, password: e.target.value})} required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
            <input type="password" className="input-field" value={form.confirmPassword} onChange={e => setForm({...form, confirmPassword: e.target.value})} required />
          </div>
          <button type="submit" className="btn-primary w-full" disabled={loading}>{loading ? 'Creating account...' : 'Sign Up'}</button>
        </form>
        <p className="text-center text-sm text-gray-500 mt-6">
          Already have an account? <Link to="/login" className="text-brand-600 hover:underline font-medium">Sign In</Link>
        </p>
      </div>
    </div>
  );
}
