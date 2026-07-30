import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { useDispatch } from 'react-redux';
import { Mail, Lock, User } from 'lucide-react';
import toast from 'react-hot-toast';
import { register } from '../store/slices/authSlice';

const Register = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const next = params.get('next');
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '' });
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password.length < 6) return toast.error('Password must be at least 6 characters.');

    setBusy(true);
    try {
      const user = await dispatch(register(form)).unwrap();
      toast.success(`Welcome, ${user.name || 'friend'}! 🎉`);
      navigate(next || (user.role === 'ADMIN' ? '/admin' : '/'));
    } catch (err) {
      toast.error(typeof err === 'string' ? err : 'Could not create your account.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-16 bg-gradient-to-b from-purple-50 to-white">
      <Helmet><title>Create Account - KidsColour</title></Helmet>
      <motion.div
        initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
        className="card p-8 w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🦄</div>
          <h1 className="text-3xl mb-1">Join the fun!</h1>
          <p className="text-gray-500">Create an account to start colouring.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block font-bold text-gray-700 mb-1">Full name</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input required value={form.name} onChange={set('name')} className="input-field pl-10" placeholder="Your name" />
            </div>
          </div>
          <div>
            <label className="block font-bold text-gray-700 mb-1">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input required type="email" value={form.email} onChange={set('email')} className="input-field pl-10" placeholder="you@example.com" />
            </div>
          </div>
          <div>
            <label className="block font-bold text-gray-700 mb-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input required type="password" value={form.password} onChange={set('password')} className="input-field pl-10" placeholder="At least 6 characters" />
            </div>
          </div>
          <button type="submit" disabled={busy} className="btn-primary w-full disabled:opacity-60">
            {busy ? 'Creating account…' : 'Create Account'}
          </button>
        </form>

        <p className="text-center text-gray-500 mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-primary font-bold hover:underline">Log in</Link>
        </p>
      </motion.div>
    </div>
  );
};

export default Register;
